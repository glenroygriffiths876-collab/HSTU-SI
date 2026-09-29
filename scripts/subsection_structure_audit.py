from pathlib import Path
from bs4 import BeautifulSoup
import json
soup=BeautifulSoup(Path("index.html").read_text(encoding="utf-8"),"html.parser")
out={}
for view in ["gallery","resources","services","capacity","research"]:
    sec=soup.find(id="view-"+view)
    rows=[]
    if sec:
        for el in sec.find_all(recursive=False):
            rows.append({
              "tag":el.name,"id":el.get("id"),"classes":el.get("class"),
              "text":el.get_text(" ",strip=True)[:180]
            })
        buttons=[{"text":b.get_text(" ",strip=True),"attrs":dict(b.attrs)} for b in sec.find_all("button")]
    else: buttons=[]
    out[view]={"children":rows,"buttons":buttons[:80]}
Path("internal-audits/subsection-structure.json").write_text(json.dumps(out,indent=2),encoding="utf-8")
print(json.dumps(out,indent=2))
