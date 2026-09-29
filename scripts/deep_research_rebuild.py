#!/usr/bin/env python3
import csv, json, re, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup

SOURCE=Path(sys.argv[1] if len(sys.argv)>1 else "/tmp/hstu-source")
ROOT=Path(".")
INDEX=ROOT/"index.html"
JS=ROOT/"shanille-refinements.js"
CAT=ROOT/"research-catalogue.json"
AUDIT_DIR=ROOT/"internal-audits"
AUDIT_DIR.mkdir(exist_ok=True)

OBJECTIVES=[
"Coinfection and Communicable Diseases",
"Sexually Transmitted Infections",
"Stigma and Discrimination",
"Psychosocial Determinants and Effects of HIV/AIDS",
"Antiretroviral Drug Resistance",
"Antiretroviral Therapy Outcomes",
"Prevention of Mother-to-Child Transmission",
"Adolescent HIV/AIDS",
"Pediatric HIV/AIDS",
"Key and Vulnerable Populations",
"Knowledge, Attitudes, Behaviors, and Practices",
"Epidemiology of HIV in Jamaica",
"The National HIV Response",
"Tuberculosis Prevention and Control",
"Risk Communication",
]
FILES={
"adolescent-hiv-aids.txt":"Adolescent HIV/AIDS",
"antiretroviral-drug-resistance.txt":"Antiretroviral Drug Resistance",
"antiretroviral-therapy-outcomes.txt":"Antiretroviral Therapy Outcomes",
"coinfection-and-communicable-diseases.txt":"Coinfection and Communicable Diseases",
"epidemiology-of-hiv-in-jamaica.txt":"Epidemiology of HIV in Jamaica",
"knowledge-attitudes-behaviour-and-practices.txt":"Knowledge, Attitudes, Behaviors, and Practices",
"key-and-vulnerable-populations.txt":"Key and Vulnerable Populations",
"paediatric-hiv-aids.txt":"Pediatric HIV/AIDS",
"prevention-of-mother-to-child-transmission.txt":"Prevention of Mother-to-Child Transmission",
"psychosocial-determinants-and-effects-of-hiv-aids.txt":"Psychosocial Determinants and Effects of HIV/AIDS",
"risk-communication.txt":"Risk Communication",
"sexually-transmitted-infections.txt":"Sexually Transmitted Infections",
"stigma-and-discrimination.txt":"Stigma and Discrimination",
"the-national-hiv-response.txt":"The National HIV Response",
"tuberculosis-prevention-and-control.txt":"Tuberculosis Prevention and Control",
}
BOILER={
"Skip to Main Content","This website was built on Wix. Create yours today.","Get Started",
"HSTU | HIV, STI, TB Unit","Research Areas","Repository","Resources","Reports","About",
"< Back","Previous","Next"
}
NON_RESEARCH={
"https://hstu.moh.gov.jm/media/reports/hiv-epidemiological-reports":"reports",
"https://hstu.moh.gov.jm/about/structure-overview-of-the-nhp":"resources",
}
CARIBBEAN_TERMS=[
r"\bcaribbean\b",r"\bdominican republic\b",r"\bbarbados\b",r"\btrinidad\b",r"\btobago\b",
r"\bhaiti\b",r"\bguyana\b",r"\bbahamas\b",r"\bbelize\b",r"\bsuriname\b",r"\bgrenada\b",
r"\bsaint lucia\b",r"\bst\.? lucia\b",r"\bsaint vincent\b",r"\bpuerto rico\b",
r"\bwest indies\b",r"\bantilles\b"
]
JAMAICA_TERMS=[r"\bjamaica\b",r"\bjamaican\b",r"\bkingston\b",r"\bmontego bay\b",r"\bwestern jamaica\b"]

def norm_url(url):
    return url.strip().rstrip(").,;").split("#")[0].rstrip("/")

def clean_citation(citation, category):
    c=re.sub(r"\s+"," ",citation).strip()
    for header in [category,"Paediatric HIV/AIDS","Knowledge, Attitudes, Behaviour and Practices"]:
        if c.lower().startswith(header.lower()):
            c=c[len(header):].strip()
    c=re.sub(r"^\d+\.\s*","",c)
    return c.strip()

def derive_title(citation):
    c=citation.strip().strip(".")
    m=re.match(r"^(.+?)\s+[–—-]\s*((?:19|20)\d{2})\s+[–—-]\s+(.+)$",c)
    if m:
        title=m.group(3).strip()
        title=re.sub(r"\s*\(([^()]*(?:Journal|J Med|AIDS|Medicine|Health|Care|Pediatr|Paediatr|Lancet|BMC|Sex|Infect|Epidemiol|Review)[^()]*)\)\s*$","",title,flags=re.I)
        return title.strip(" .")
    m=re.match(r"^(.+?)(?:\.\s*)?\(((?:19|20)\d{2})\)\.?\s*(.+)$",c)
    if m:
        rest=m.group(3).strip()
        parts=rest.split(". ")
        if parts and len(parts[0])>=22:
            return parts[0].strip(" .")
        return rest.strip(" .")
    m=re.match(r"^([A-Z][A-Za-z'’.-]+(?:\s+[A-Z]{1,3})?(?:,\s*[A-Z][A-Za-z'’.-]+(?:\s+[A-Z]{1,3})?){1,6})\.\s+(.+)$",c)
    if m:
        rest=m.group(2).strip()
        parts=rest.split(". ")
        if parts and len(parts[0])>=22:
            return parts[0].strip(" .")
    return c

def authors_from(citation):
    c=citation.strip()
    m=re.match(r"^(.+?)\s+[–—-]\s*(?:19|20)\d{2}\s+[–—-]\s+",c)
    if m: return m.group(1).strip()
    m=re.match(r"^(.+?)(?:\.\s*)?\((?:19|20)\d{2}\)",c)
    if m: return m.group(1).strip(" .")
    m=re.match(r"^(.+?)\.\s+[A-Z]",c)
    if m and len(m.group(1))<100: return m.group(1).strip()
    return ""

def year_from(citation):
    m=re.search(r"\b(?:19|20)\d{2}\b",citation)
    return m.group(0) if m else "Undated"

def levels_from(text):
    t=text.lower()
    if any(re.search(p,t) for p in JAMAICA_TERMS):
        return ["Jamaica","Caribbean"],"Jamaica"
    if any(re.search(p,t) for p in CARIBBEAN_TERMS):
        return ["Caribbean"],"Caribbean"
    return [],"Unspecified"

def parse_source():
    merged={}
    assignments=0
    for fname,category in FILES.items():
        path=SOURCE/fname
        if not path.exists():
            raise SystemExit("Missing recovered category page: "+str(path))
        lines=[x.strip() for x in path.read_text(encoding="utf-8",errors="ignore").splitlines()]
        buf=[]
        for line in lines:
            if not line or line in BOILER or line.startswith("© 2035"):
                continue
            m=re.search(r"https?://\S+",line)
            if m:
                before=line[:m.start()].strip()
                if before: buf.append(before)
                citation=clean_citation(" ".join(buf),category)
                url=m.group(0).rstrip(").,;")
                buf=[]
                if not citation: continue
                assignments+=1
                key=norm_url(url)
                if key in NON_RESEARCH:
                    continue
                if key not in merged:
                    levels,geography=levels_from(citation)
                    merged[key]={
                        "url":url,
                        "citation":citation,
                        "title":derive_title(citation),
                        "authors":authors_from(citation),
                        "year":year_from(citation),
                        "type":"Research Literature",
                        "destination":"Research",
                        "category":category,
                        "categories":[category],
                        "levels":levels,
                        "geography":geography,
                    }
                else:
                    r=merged[key]
                    if category not in r["categories"]: r["categories"].append(category)
                    if len(citation)>len(r["citation"]):
                        r["citation"]=citation
                        r["title"]=derive_title(citation)
                        r["authors"]=authors_from(citation)
                        r["year"]=year_from(citation)
                    levels,geography=levels_from(r["citation"]+" "+citation)
                    r["levels"],r["geography"]=levels,geography
            else:
                headers={category.lower(),"paediatric hiv/aids","knowledge, attitudes, behaviour and practices"}
                if line.lower() not in headers: buf.append(line)
    rows=list(merged.values())
    rows.sort(key=lambda r:(int(r["year"]) if str(r["year"]).isdigit() else 0,r["title"]),reverse=True)
    for i,r in enumerate(rows,1):
        r["id"]="HSTU-RSCH-"+str(i).zfill(3)
        r["objectiveNumbers"]=[OBJECTIVES.index(c)+1 for c in r["categories"] if c in OBJECTIVES]
        r["classification"]="Research area assigned from the repository topic page"
    return rows,assignments

SESSION=requests.Session()
SESSION.headers.update({"User-Agent":"Mozilla/5.0 (compatible; HSTU-Resource-Centre-Link-Audit/1.0)"})

def inspect_link(record):
    url=record["url"]
    out={"url":url,"title":record["title"],"status":"","http_status":"","final_url":"","note":""}
    try:
        resp=SESSION.get(url,timeout=14,allow_redirects=True,stream=True)
        out["http_status"]=resp.status_code
        out["final_url"]=resp.url
        if 200 <= resp.status_code < 400:
            out["status"]="accessible"
        elif resp.status_code in (401,403,405,406,429):
            out["status"]="restricted"
            out["note"]="Host restricted automated checking; link retained."
        elif resp.status_code in (404,410):
            out["status"]="unavailable"
        else:
            out["status"]="check"
        ctype=(resp.headers.get("content-type") or "").lower()
        if "html" in ctype and out["status"]=="accessible":
            try:
                chunk=resp.raw.read(350000,decode_content=True)
                doc=BeautifulSoup(chunk,"html.parser")
                meta_title=None
                for attrs in [
                    {"name":"citation_title"},{"property":"og:title"},{"name":"dc.title"},{"name":"DC.Title"}
                ]:
                    tag=doc.find("meta",attrs=attrs)
                    if tag and tag.get("content"):
                        meta_title=tag["content"].strip();break
                weak=(len(record["title"])>240 or " et. al." in record["title"] or re.match(r"^GBD .*Collaborators",record["title"],re.I))
                if meta_title and len(meta_title)>15 and weak:
                    record["title"]=re.sub(r"\s+"," ",meta_title).strip()
            except Exception:
                pass
        resp.close()
    except requests.RequestException as e:
        out["status"]="check"
        out["note"]=type(e).__name__
    return out

def audit_links(rows):
    results=[]
    with ThreadPoolExecutor(max_workers=14) as ex:
        futs={ex.submit(inspect_link,r):r for r in rows}
        for fut in as_completed(futs):
            try: results.append(fut.result())
            except Exception as e:
                r=futs[fut]
                results.append({"url":r["url"],"title":r["title"],"status":"check","http_status":"","final_url":"","note":type(e).__name__})
    by_url={norm_url(x["url"]):x for x in results}
    for r in rows:
        r["linkStatus"]=by_url.get(norm_url(r["url"]),{}).get("status","check")
    results.sort(key=lambda x:(x["status"],x["title"]))
    return results

def fix_index():
    soup=BeautifulSoup(INDEX.read_text(encoding="utf-8"),"html.parser")
    removed=0
    for sc in list(soup.find_all("script")):
        body=sc.string or sc.get_text() or ""
        if "HSTU_AUDITED_RECORDS" in body or "HSTU_VERIFIED_OBJECTIVES" in body:
            sc.decompose();removed+=1
    for st in list(soup.find_all("style")):
        if st.get("id")=="hstu-final-audit-style":
            st.decompose();removed+=1
    reports=soup.find(id="view-reports")
    if reports and "hiv-epidemiological-reports" not in str(reports):
        target=reports.select_one(".hstu-parity-sections") or reports
        target.append(BeautifulSoup('<section class="hstu-parity-group"><h2>HIV Epidemiological Reports</h2><div class="hstu-refine-grid"><article class="hstu-refine-card hstu-parity-card"><span class="badge">HSTU · Epidemiology</span><h3>HIV Epidemiological Reports</h3><a href="https://hstu.moh.gov.jm/media/reports/hiv-epidemiological-reports/" target="_blank" rel="noopener noreferrer">Open collection ↗</a></article></div></section>',"html.parser"))
    resources=soup.find(id="view-resources")
    if resources and "structure-overview-of-the-nhp" not in str(resources):
        resources.append(BeautifulSoup('<section class="wrap hstu-parity-group"><h2>Programme Information</h2><div class="hstu-refine-grid"><article class="hstu-refine-card hstu-parity-card"><span class="badge">HSTU · Programme</span><h3>Structure overview of the National HIV Program</h3><a href="https://hstu.moh.gov.jm/about/structure-overview-of-the-nhp/" target="_blank" rel="noopener noreferrer">View programme structure ↗</a></article></div></section>',"html.parser"))
    INDEX.write_text(str(soup),encoding="utf-8")
    return removed

def fix_js():
    s=JS.read_text(encoding="utf-8")
    s=re.sub(
        r"const objective=document\.getElementById\('refineResearchObjective'\);if\(objective\)\{.*?objective\.value=.*?;\}",
        "const objective=document.getElementById('refineResearchObjective');if(objective){objective.replaceChildren(new Option('All 15 Strategic Objectives','All'));OBJECTIVES.forEach((name,i)=>objective.add(new Option((i+1)+'. '+name,String(i+1))));objective.value='All';}",
        s,count=1,flags=re.S)
    old2="const q=document.getElementById('refineResearchSearch'),level=document.getElementById('refineResearchLevel'),grid=document.getElementById('refineResearchGrid'),status=document.getElementById('refineResearchStatus'),viewAll=document.getElementById('refineResearchViewAll');let expanded=false;if(level&&level.options[0])level.options[0].textContent='All Research';"
    new2="const q=document.getElementById('refineResearchSearch'),level=document.getElementById('refineResearchLevel'),grid=document.getElementById('refineResearchGrid'),status=document.getElementById('refineResearchStatus'),viewAll=document.getElementById('refineResearchViewAll');let expanded=false;if(level){level.replaceChildren(new Option('All Research','All'),new Option('Jamaica','Jamaica'),new Option('Caribbean','Caribbean'));level.value='All';}"
    if old2 not in s: raise SystemExit("Research level setup target not found")
    s=s.replace(old2,new2)
    old3="let rows=research.filter(r=>(objective.value==='All'||(Array.isArray(r.objectives)?r.objectives.includes(Number(objective.value)):String(r.objective)===objective.value))&&(!search||norm([r.title,r.authors,r.category,r.year,...(r.topics||[])].join(' ')).includes(search)));"
    new3="let rows=research.filter(r=>(objective.value==='All'||(Array.isArray(r.objectives)?r.objectives.includes(Number(objective.value)):String(r.objective)===objective.value))&&(!search||norm([r.title,r.authors,r.citation,r.category,r.year,r.geography,...(r.topics||[])].join(' ')).includes(search)));"
    if old3 in s: s=s.replace(old3,new3)
    s=s.replace("if(level.value==='Jamaica')rows=rows.filter(r=>r.geography==='Jamaica');","if(level.value==='Jamaica')rows=rows.filter(r=>Array.isArray(r.levels)&&r.levels.includes('Jamaica'));")
    s=s.replace("if(level.value==='Caribbean')rows=rows.filter(r=>r.geography==='Jamaica'||r.geography==='Caribbean');","if(level.value==='Caribbean')rows=rows.filter(r=>Array.isArray(r.levels)&&r.levels.includes('Caribbean'));")
    s=s.replace("status.textContent=rows.length+' research records'+(objective.value==='All'&&unclassified?' · '+unclassified+' awaiting objective verification':'')+(note?' · '+note:'');","status.textContent=rows.length+' studies match'+(note?' · '+note:'');")
    JS.write_text(s,encoding="utf-8")

def write_outputs(rows,assignments,link_results,removed):
    CAT.write_text(json.dumps({
        "generated":"2026-09-29",
        "scope":"Research studies and literature drawn from the 15 Research Repository topic pages.",
        "recordCount":len(rows),
        "categoryAssignments":sum(len(r["categories"]) for r in rows),
        "records":rows,
    },indent=2,ensure_ascii=False),encoding="utf-8")
    csv_path=AUDIT_DIR/"RESEARCH_LINK_AUDIT_2026-09-29.csv"
    with csv_path.open("w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=["status","http_status","title","url","final_url","note"])
        w.writeheader();w.writerows(link_results)
    counts={}
    for x in link_results: counts[x["status"]]=counts.get(x["status"],0)+1
    cat_counts={name:0 for name in OBJECTIVES}
    for r in rows:
        for c in r["categories"]: cat_counts[c]+=1
    jam=sum("Jamaica" in r["levels"] for r in rows)
    car=sum("Caribbean" in r["levels"] for r in rows)
    all_only=sum(not r["levels"] for r in rows)
    md=[
      "# Research filter and link audit — 29 September 2026","",
      "- Source category link assignments parsed: **"+str(assignments)+"**.",
      "- Unique research records after URL deduplication and routing non-research items elsewhere: **"+str(len(rows))+"**.",
      "- Objective assignments retained across the 15 research areas: **"+str(sum(cat_counts.values()))+"**.",
      "- Removed old competing inline Research renderer/dropdown blocks: **"+str(removed)+"**.",
      "- Jamaica filter: **"+str(jam)+"** records.",
      "- Caribbean filter (including Jamaica): **"+str(car)+"** records.",
      "- All Research-only because location is not explicit in the citation: **"+str(all_only)+"** records.",
      "","## Link-check results",
    ]
    for k in sorted(counts): md.append("- "+k+": **"+str(counts[k])+"**")
    md+=["","## Strategic Objective counts"]
    for i,name in enumerate(OBJECTIVES,1): md.append("- "+str(i)+". "+name+": **"+str(cat_counts[name])+"**")
    (AUDIT_DIR/"RESEARCH_FILTER_AUDIT_2026-09-29.md").write_text("\n".join(md)+"\n",encoding="utf-8")

def qa(rows):
    if len(rows)<270: raise SystemExit("Research recovery unexpectedly low: "+str(len(rows)))
    urls=[norm_url(r["url"]) for r in rows]
    if len(urls)!=len(set(urls)): raise SystemExit("Duplicate research URL remained after merge")
    for obj in OBJECTIVES:
        if not any(obj in r["categories"] for r in rows):
            raise SystemExit("Strategic Objective missing records: "+obj)
    html=INDEX.read_text(encoding="utf-8")
    for bad in ["HSTU_AUDITED_RECORDS","recovered entries match","No verified matches. Try All Research","Open original source"]:
        if bad.lower() in html.lower(): raise SystemExit("Old Research renderer/public wording remains: "+bad)
    js=JS.read_text(encoding="utf-8")
    if "replaceChildren(new Option('All Research','All')" not in js: raise SystemExit("Level dropdown not rebuilt deterministically")
    if "objective.replaceChildren(new Option('All 15 Strategic Objectives','All')" not in js: raise SystemExit("Objective dropdown not rebuilt deterministically")

rows,assignments=parse_source()
link_results=audit_links(rows)
removed=fix_index()
fix_js()
write_outputs(rows,assignments,link_results,removed)
qa(rows)
print(json.dumps({
 "uniqueResearch":len(rows),
 "sourceAssignments":assignments,
 "objectiveAssignments":sum(len(r["categories"]) for r in rows),
 "jamaica":sum("Jamaica" in r["levels"] for r in rows),
 "caribbean":sum("Caribbean" in r["levels"] for r in rows),
 "allOnly":sum(not r["levels"] for r in rows),
 "removedCompetingBlocks":removed,
},indent=2))
