from pathlib import Path
from bs4 import BeautifulSoup
import json
s=Path("index.html").read_text(encoding="utf-8")
soup=BeautifulSoup(s,"html.parser")
nav=[]
for item in soup.select(".hstu-nav-item"):
    main=item.select_one(":scope > .nav-btn") or item.find("button")
    dd=item.select_one(".hstu-nav-dropdown")
    nav.append({
      "main_text":" ".join(main.stripped_strings) if main else "",
      "main_view":main.get("data-view") if main else None,
      "dropdown":[{
        "text":" ".join(b.stripped_strings),
        "data_view":b.get("data-view"),
        "data_target":b.get("data-target"),
        "data_section":b.get("data-section"),
        "onclick":b.get("onclick")
      } for b in (dd.find_all("button") if dd else [])]
    })
views={}
for view in soup.select("[id^='view-']"):
    heads=[]
    for h in view.find_all(["h1","h2","h3","summary"]):
        txt=" ".join(h.stripped_strings)
        if txt:
            parent=h.find_parent(["section","article","div","details"])
            heads.append({"text":txt[:160],"id":h.get("id"),"parent_id":parent.get("id") if parent else None,"parent_class":" ".join(parent.get("class",[])) if parent else ""})
    views[view["id"]]=heads
Path("internal-audits/nav-subsection-diagnostic.json").write_text(json.dumps({"nav":nav,"views":views},indent=2),encoding="utf-8")
print(json.dumps(nav,indent=2))
