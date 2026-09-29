from pathlib import Path
import re, json
html=Path("index.html").read_text(encoding="utf-8")
js=Path("shanille-refinements.js").read_text(encoding="utf-8")
terms=["recovered entries match","No verified matches","refineResearchObjective","refineResearchLevel","shanille-refinements.js"]
out={}
for term in terms:
    out[term]={
      "index_count": html.count(term),
      "js_count": js.count(term),
      "index_positions":[m.start() for m in re.finditer(re.escape(term),html)][:20],
      "js_positions":[m.start() for m in re.finditer(re.escape(term),js)][:20]
    }
# capture research-related inline script excerpts
excerpts=[]
for pat in ["recovered entries match","No verified matches","refineResearchObjective","refineResearchLevel"]:
    for m in re.finditer(re.escape(pat),html):
        excerpts.append({"term":pat,"excerpt":html[max(0,m.start()-1800):m.start()+3500]})
Path("internal-audits/research-ui-diagnostic.json").write_text(json.dumps({"counts":out,"excerpts":excerpts},indent=2),encoding="utf-8")
print(json.dumps(out,indent=2))
