from pathlib import Path
import re,json
s=Path("index.html").read_text(encoding="utf-8")
terms=["Gia","gia","resource finder","find a service","syphilis manual","cite the source","Staff Orders","search manuals","Levenshtein","fuzzy","similarity","normalize","spell","query"]
hits=[]
for term in terms:
    for m in re.finditer(re.escape(term),s,re.I):
        hits.append({"term":term,"pos":m.start(),"excerpt":s[max(0,m.start()-1200):m.start()+4200]})
# de-dupe excerpts by start area
hits=sorted(hits,key=lambda x:x["pos"])
ded=[]
last=-99999
for h in hits:
    if h["pos"]-last>1500:
        ded.append(h);last=h["pos"]
Path("internal-audits/gia-diagnostic.json").write_text(json.dumps({"length":len(s),"hits":ded[:60]},indent=2),encoding="utf-8")
print("hits",len(ded))
