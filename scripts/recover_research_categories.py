#!/usr/bin/env python3
"""Public J-MERG category-page extraction; no authentication or bypass."""
import asyncio,csv,json,re,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT="https://williamsandremoh.wixsite.com/jmerg/items-2/"
SLUGS=[
"adolescent-hiv%2Faids","antiretroviral-drug-resistance","antiretroviral-therapy-outcomes",
"capacity-building","coinfection-and-communicable-diseases","epidemiology-of-hiv-in-jamaica",
"key-and-vulnerable-populations","knowledge-attitudes-behaviour-and-practices",
"paediatric-hiv%2Faids","prevention-of-mother-to-child-transmission",
"psychosocial-determinants-and-effects-of-hiv%2Faids","reports","risk-communication",
"sexually-transmitted-infections","stigma-and-discrimination","the-national-hiv-response",
"tuberculosis-prevention-and-control"]
OUT=Path("internal-audits/category-crawl");OUT.mkdir(parents=True,exist_ok=True)
async def main():
    rows=[];status=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
        context=await browser.new_context(user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36")
        for slug in SLUGS:
            page=await context.new_page()
            url=ROOT+slug
            state={"category":slug,"url":url,"status":"unverified","records":0}
            try:
                response=await page.goto(url,wait_until="domcontentloaded",timeout=45000)
                state["http_status"]=response.status if response else None
                await page.wait_for_timeout(4500)
                for _ in range(4):
                    await page.mouse.wheel(0,1800);await page.wait_for_timeout(550)
                # Capture rendered content and all link context for later human review.
                html=await page.content()
                (OUT/(slug.replace("%2F","-")+".html")).write_text(html,encoding="utf-8")
                body=await page.locator("body").inner_text(timeout=12000)
                (OUT/(slug.replace("%2F","-")+".txt")).write_text(body,encoding="utf-8")
                links=await page.locator("a[href]").evaluate_all("""els=>els.map(a=>({
                  href:a.href,title:(a.innerText||a.getAttribute('aria-label')||'').trim(),
                  context:(a.closest('article,[data-testid],li')?.innerText||a.parentElement?.innerText||'').trim().slice(0,1500)
                }))""")
                # Keep only content-bearing document, citation and item links, not generic navigation.
                for link in links:
                    href=link.get("href","")
                    if not href or href.startswith("javascript:"):continue
                    if any(x in href.lower() for x in ["filesusr.com","pubmed.ncbi.nlm.nih.gov","doi.org","/items-2/","hstu.moh.gov.jm/media/"]) or href.lower().endswith(".pdf"):
                        rows.append({"category":slug,"source_page":url,**link})
                state.update(status="retrieved" if state.get("http_status")==200 else "http_error",records=sum(x["category"]==slug for x in rows),body_chars=len(body))
                print(slug,state["status"],state["records"],flush=True)
            except Exception as e:
                state.update(status="failed",error=str(e)[:300]);print(slug,"FAILED",e,flush=True)
            finally:
                status.append(state);await page.close()
        await browser.close()
    with (OUT/"extracted_links.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=["category","source_page","href","title","context"]);w.writeheader();w.writerows(rows)
    (OUT/"crawl_status.json").write_text(json.dumps(status,indent=2),encoding="utf-8")
    good=sum(x["status"]=="retrieved" and x.get("body_chars",0)>200 for x in status)
    print("Accessible category pages:",good,"of",len(status),"candidate links:",len(rows))
    if good==0:raise SystemExit("No category page was accessible; see crawl_status.json. No classification was inferred.")
if __name__=="__main__":asyncio.run(main())
