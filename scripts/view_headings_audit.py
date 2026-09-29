from pathlib import Path
from bs4 import BeautifulSoup
import json
soup=BeautifulSoup(Path("index.html").read_text(encoding="utf-8"),"html.parser")
out={}
for view in ["home","research","capacity","reports","data-audit","gallery","resources","services"]:
    sec=soup.find(id="view-"+view)
    rows=[]
    if sec:
        for h in sec.find_all(["h1","h2","h3","h4"]):
            parent=h.parent
            rows.append({
              "text":h.get_text(" ",strip=True),
              "tag":h.name,
              "id":h.get("id"),
              "classes":h.get("class"),
              "parent_tag":parent.name if parent else None,
              "parent_id":parent.get("id") if parent else None,
              "parent_classes":parent.get("class") if parent else None
            })
    out[view]=rows
Path("internal-audits/view-headings.json").write_text(json.dumps(out,indent=2),encoding="utf-8")
print(json.dumps(out,indent=2))
