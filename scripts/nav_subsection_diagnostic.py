from pathlib import Path
import re,json
s=Path("index.html").read_text(encoding="utf-8")
terms=["hstu-nav-item","data-view","dropdown","submenu","nav-item","nav-dropdown","mouseenter","mouseover","scrollIntoView","location.hash","setView"]
out=[]
for term in terms:
  for m in list(re.finditer(re.escape(term),s,re.I))[:80]:
    out.append({"term":term,"pos":m.start(),"excerpt":s[max(0,m.start()-1400):m.start()+5000]})
out=sorted(out,key=lambda x:x["pos"])
Path("internal-audits/nav-subsection-diagnostic.json").write_text(json.dumps(out,indent=2),encoding="utf-8")
print([(x["term"],x["pos"]) for x in out[:100]])
