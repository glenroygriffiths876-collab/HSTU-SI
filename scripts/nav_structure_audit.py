from pathlib import Path
from bs4 import BeautifulSoup
import json
soup=BeautifulSoup(Path("index.html").read_text(encoding="utf-8"),"html.parser")
out=[]
for item in soup.select(".hstu-nav-item"):
    main=item.select_one(":scope > .nav-btn")
    out.append({
      "main_text":main.get_text(" ",strip=True) if main else None,
      "main_data_view":main.get("data-view") if main else None,
      "dropdown":[
        {"text":b.get_text(" ",strip=True),"attrs":dict(b.attrs)}
        for b in item.select(".hstu-nav-dropdown button")
      ]
    })
Path("internal-audits/nav-structure.json").write_text(json.dumps(out,indent=2),encoding="utf-8")
print(json.dumps(out,indent=2))
