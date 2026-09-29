from pathlib import Path
import re,json
s=Path("index.html").read_text(encoding="utf-8")
terms=[
"What are you looking for?","Search manuals, learning, research, services, gallery resources and more",
"Ask me about a condition","cite the source manual and page",
"clinicalInput","clinicalSearch","clinicalForm","clinical-results","clinicalResults",
"giaSearch","runGia","searchHub","RESOURCE FINDER","clinical-shortcuts",
"gia-finder-intro","gia-find-card","query correction","queryCorrection",
"sourceIndex","source index","levenshtein","editDistance","fuzzy","similarity",
"normalized","normalizeQuery","tokenize","allResources","resourceIndex"
]
out=[]
for term in terms:
    ms=list(re.finditer(re.escape(term),s,re.I))
    if not ms: continue
    for m in ms[:8]:
        out.append({"term":term,"pos":m.start(),"excerpt":s[max(0,m.start()-3500):m.start()+9000]})
out.sort(key=lambda x:x["pos"])
Path("internal-audits/gia-search-logic.json").write_text(json.dumps({"hits":out},indent=2),encoding="utf-8")
print([(x["term"],x["pos"]) for x in out])
