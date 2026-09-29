import asyncio, json, re, hashlib
from pathlib import Path
from urllib.parse import urlparse, urlunparse
from playwright.async_api import async_playwright

START=[
 "https://williamsandremoh.wixsite.com/jmerg",
 "https://williamsandremoh.wixsite.com/jmerg/about",
 "https://williamsandremoh.wixsite.com/jmerg/items-2",
 "https://williamsandremoh.wixsite.com/jmerg/general-5",
]
BASE_HOST="williamsandremoh.wixsite.com"
BASE_PREFIX="/jmerg"
OUT=Path("internal-audits/source-site-snapshot")
OUT.mkdir(parents=True,exist_ok=True)

def clean(u):
    try:
        p=urlparse(u)
        if p.scheme not in ("http","https") or p.netloc!=BASE_HOST: return None
        if not p.path.startswith(BASE_PREFIX): return None
        path=re.sub(r"/+$","",p.path) or BASE_PREFIX
        return urlunparse(("https",p.netloc,path,"","",""))
    except: return None

def fname(u):
    p=urlparse(u).path[len(BASE_PREFIX):].strip("/") or "home"
    p=re.sub(r"[^a-zA-Z0-9._-]+","-",p)[:120]
    return p or "home"

async def main():
    queue=list(dict.fromkeys(START))
    seen=set(); pages=[]; all_links=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
        context=await browser.new_context(user_agent="Mozilla/5.0 Chrome/131 Safari/537.36")
        while queue and len(seen)<80:
            url=queue.pop(0)
            url=clean(url)
            if not url or url in seen: continue
            seen.add(url)
            page=await context.new_page()
            rec={"url":url,"status":"failed"}
            try:
                resp=await page.goto(url,wait_until="domcontentloaded",timeout=45000)
                rec["http_status"]=resp.status if resp else None
                await page.wait_for_timeout(3500)
                for _ in range(3):
                    await page.mouse.wheel(0,1800); await page.wait_for_timeout(500)
                body=await page.locator("body").inner_text(timeout=12000)
                title=await page.title()
                links=await page.locator("a[href]").evaluate_all("""els=>els.map(a=>({
                  href:a.href,
                  text:(a.innerText||a.getAttribute('aria-label')||'').trim()
                }))""")
                internal=[]; external=[]
                for x in links:
                    href=x.get("href","")
                    cu=clean(href)
                    item={"source":url,"href":href,"text":x.get("text","")[:300]}
                    all_links.append(item)
                    if cu:
                        internal.append(cu)
                        if cu not in seen and cu not in queue: queue.append(cu)
                    elif href.startswith("http"):
                        external.append(href)
                name=fname(url)
                (OUT/f"{name}.txt").write_text(body,encoding="utf-8")
                rec.update(status="retrieved",title=title,body_chars=len(body),
                           internal_links=sorted(set(internal)),
                           external_link_count=len(set(external)))
            except Exception as e:
                rec["error"]=str(e)[:500]
            finally:
                pages.append(rec); await page.close()
        await browser.close()
    (OUT/"pages.json").write_text(json.dumps(pages,indent=2),encoding="utf-8")
    (OUT/"links.json").write_text(json.dumps(all_links,indent=2),encoding="utf-8")
    print("retrieved",sum(x["status"]=="retrieved" for x in pages),"pages of",len(pages))
if __name__=="__main__":
    asyncio.run(main())
