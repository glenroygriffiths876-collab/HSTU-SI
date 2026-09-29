import json, concurrent.futures, urllib.request, urllib.error, ssl, time
from pathlib import Path
cat=json.loads(Path("research-catalogue.json").read_text(encoding="utf-8"))
records=cat.get("records",[])
urls=sorted({r.get("url") for r in records if r.get("url")})
ctx=ssl.create_default_context()
def check(url):
    req=urllib.request.Request(url,method="HEAD",headers={"User-Agent":"Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req,timeout=12,context=ctx) as resp:
            return {"url":url,"status":resp.status,"result":"reachable"}
    except urllib.error.HTTPError as e:
        if e.code in (401,403,405,429):
            try:
                req2=urllib.request.Request(url,method="GET",headers={"User-Agent":"Mozilla/5.0","Range":"bytes=0-2048"})
                with urllib.request.urlopen(req2,timeout=12,context=ctx) as resp:
                    return {"url":url,"status":resp.status,"result":"reachable"}
            except urllib.error.HTTPError as e2:
                if e2.code in (401,403,429): return {"url":url,"status":e2.code,"result":"restricted"}
                return {"url":url,"status":e2.code,"result":"http_error"}
            except Exception as e2:
                return {"url":url,"status":None,"result":"network_error","error":str(e2)[:180]}
        return {"url":url,"status":e.code,"result":"http_error"}
    except Exception as e:
        return {"url":url,"status":None,"result":"network_error","error":str(e)[:180]}
with concurrent.futures.ThreadPoolExecutor(max_workers=24) as ex:
    results=list(ex.map(check,urls))
by={r["url"]:r for r in results}
summary={}
for r in results: summary[r["result"]]=summary.get(r["result"],0)+1
# Duplicate and metadata checks
dupes=len(records)-len(urls)
obj_counts={str(i):0 for i in range(1,16)}
geo_counts={}
for r in records:
    for i in set(r.get("objectiveNumbers") or []):
        if str(i) in obj_counts: obj_counts[str(i)]+=1
    geo=r.get("geography","Unspecified");geo_counts[geo]=geo_counts.get(geo,0)+1
report={"record_count":len(records),"unique_url_count":len(urls),"duplicate_url_records":dupes,"link_summary":summary,"objective_counts":obj_counts,"geography_counts":geo_counts,"links":results}
Path("internal-audits/research-link-filter-audit.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="links"},indent=2))
if dupes: raise SystemExit(f"Duplicate URL records remain: {dupes}")
if any(v==0 for v in obj_counts.values()): raise SystemExit("One or more Strategic Objectives has zero records")
