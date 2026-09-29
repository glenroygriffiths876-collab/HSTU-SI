#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,html

INDEX=Path("index.html")
soup=BeautifulSoup(INDEX.read_text(encoding="utf-8"),"html.parser")

ABOUT_PARAS=[
"The Research Data Repository was conceptualized in 2023 by the Strategic Information Component with the aim of systematically collecting and collating published and unpublished studies and reports.",
"The repository serves as a vital resource for navigating the expansive landscape of HIV/STI/TB research conducted in Jamaica and the wider Caribbean. As the repository continues to evolve, its scope has expanded beyond research studies and reports to incorporate additional resources, including capacity-building tools, national-level reports, and data utilization Standard Operating Procedures (SOPs)/User Guides for the DHIS2 and TSIS2 databases.",
"The repository currently contains approximately 200 studies, systematically organized across 15 thematic areas, including 7 high-priority and 15 priority areas. The most recently added areas are Tuberculosis (TB) and Risk Communication, both designated as high-priority areas.",
"The published studies recently added to the data repository will also be included in volume 2 of Unveiling Hope, the research booklet that compiles and highlights studies surrounding HIV, STIs, and TB. This expansion will further strengthen the booklet’s value as a consolidated resource, showcasing recent research findings, emerging trends, and key areas of focus within HIV/STI/TB research."
]

# ---------- GLOBAL META ----------
if soup.title:
    soup.title.string="HSTU Research Data Repository & Resource Centre | HIV, STI & TB"
for meta in soup.find_all("meta"):
    if meta.get("name")=="description":
        meta["content"]="HSTU Research Data Repository for HIV, STI and TB research from Jamaica and the wider Caribbean, with reports, capacity-building tools, data-utilization resources and service information."

# ---------- HOME ----------
home=soup.find(id="view-home")
if home:
    hero=home.select_one(".home-hero") or home.select_one(".page-hero") or home.find(["section","div"])
    if hero:
        h1=hero.find("h1")
        if h1:
            h1.clear()
            h1.append("Evidence. Research. Strategic Information. ")
            span=soup.new_tag("span"); span.string="One trusted repository."
            h1.append(span)
        p=hero.find("p")
        if p:
            p.string="The HSTU Research Data Repository brings together HIV, STI and TB research from Jamaica and the wider Caribbean, alongside reports, capacity-building resources and data-utilization tools."

    # Build/refresh purpose section and place immediately after hero.
    purpose=soup.find(id="repository-purpose")
    if purpose: purpose.decompose()
    purpose_html=f"""
    <section id="repository-purpose" class="wrap hstu-purpose-section">
      <div class="hstu-purpose-shell">
        <div class="hstu-purpose-copy">
          <div class="eyebrow">Strategic Information · HSTU</div>
          <h2>About the Research Data Repository</h2>
          <p>{html.escape(ABOUT_PARAS[0])}</p>
          <p>{html.escape(ABOUT_PARAS[1])}</p>
          <div class="hstu-purpose-actions">
            <button type="button" data-view="research">Explore Research</button>
            <button type="button" data-view="reports">View Reports</button>
            <button type="button" data-view="data-audit">Data Audit &amp; Utilization</button>
          </div>
        </div>
        <div class="hstu-purpose-facts" aria-label="Repository scope">
          <article><b>Research Data Repository</b><span>Published + unpublished evidence</span></article>
          <article><b>Jamaica + Wider Caribbean</b><span>Regional HIV/STI/TB research</span></article>
          <article><b>15 Thematic Research Areas</b><span>Including TB and Risk Communication</span></article>
          <article><b>Research · Reports · Capacity Building · Data Utilization</b><span>One connected evidence environment</span></article>
        </div>
      </div>
      <details class="hstu-purpose-more">
        <summary>Read more about the repository</summary>
        <div class="hstu-purpose-more-copy">
          <p>{html.escape(ABOUT_PARAS[2])}</p>
          <p>{html.escape(ABOUT_PARAS[3])}</p>
        </div>
      </details>
    </section>
    """
    purpose=BeautifulSoup(purpose_html,"html.parser").find("section")
    if hero:
        hero.insert_after(purpose)
    else:
        home.insert(0,purpose)

    # Remove older About/repository intro blocks so the purpose is not duplicated at the bottom.
    for old in list(home.select(".hstu-repository-intro")):
        if not old.find_parent(id="repository-purpose"): old.decompose()

# ---------- RESEARCH ----------
research=soup.find(id="view-research")
if research:
    hero=research.select_one(".page-hero")
    if hero:
        h1=hero.find("h1")
        if h1: h1.string="HIV/STI/TB Research"
        p=hero.find("p")
        if p: p.string="Explore published and unpublished HIV, STI and TB research from Jamaica and the wider Caribbean, organized across 15 Strategic Objectives."
    # Add purpose line before filters if absent.
    existing=research.select_one(".hstu-research-purpose-note")
    if existing: existing.decompose()
    controls=research.select_one(".hstu-refine-controls")
    note=BeautifulSoup("""
    <div class="wrap hstu-research-purpose-note">
      <b>The core repository collection</b>
      <span>Search by title, author, year, location or Strategic Objective. Recent studies are shown first, with the full collection available through View All.</span>
    </div>""","html.parser").div
    if controls: controls.insert_before(note)

# ---------- SECTION INTRODUCTIONS ----------
intro_map={
 "view-capacity":"As the Research Data Repository evolved, its scope expanded to include capacity-building tools that support HIV/STI/TB programme implementation, research, monitoring and data use.",
 "view-reports":"The repository also provides access to national-level and special reports that complement the HIV/STI/TB research evidence base.",
 "view-data-audit":"Data-utilization resources include SOPs, manuals and user guides supporting DHIS2, TSIS2, data quality and evidence-informed programme management.",
 "view-resources":"Supporting resources include presentations, posters, external learning links and knowledge tools that complement the Research Data Repository.",
 "view-gallery":"Programme campaign and activity imagery supporting the wider HSTU knowledge and communication environment.",
 "view-services":"Service-location information supports users who need to connect evidence and programme guidance with HIV/STI/TB services across Jamaica."
}
for vid,copy in intro_map.items():
    sec=soup.find(id=vid)
    if not sec: continue
    hero=sec.select_one(".page-hero")
    if hero:
        p=hero.find("p")
        if p: p.string=copy

# ---------- UNVEILING HOPE ----------
if research:
    old=research.find(id="unveiling-hope")
    if old: old.decompose()
    block=BeautifulSoup("""
    <section id="unveiling-hope" class="wrap hstu-unveiling">
      <div class="eyebrow">Research Publication</div>
      <h2>Unveiling Hope</h2>
      <p>Recently added published research contributes to the continuing development of <em>Unveiling Hope</em>, the HIV/STI/TB research booklet that compiles research findings, emerging trends and priority areas.</p>
    </section>""","html.parser").section
    # place before operational research if possible
    op=None
    for h in research.find_all(["h2","h3"]):
        if "Operational Research" in h.get_text(" ",strip=True):
            op=h.find_parent("section") or h.parent
            break
    if op: op.insert_before(block)
    else: research.append(block)

# ---------- GIA COPY ALIGNMENT ----------
head=soup.select_one(".clinical-head-copy")
if head:
    sm=head.find("small")
    h2=head.find("h2")
    p=head.find("p")
    if sm: sm.string="GIA · REPOSITORY SEARCH"
    if h2: h2.string="Hi, I’m Gia 👋🏾"
    if p: p.string="Search the HSTU Research Data Repository and Resource Centre — research, reports, capacity-building materials, data resources, services and more. Partial words and misspellings are okay."
welcome=soup.select_one(".guide-welcome")
if welcome:
    h=welcome.find(["h2","h3"])
    p=welcome.find("p")
    if h: h.string="Hi, I’m Gia 👋🏾"
    if p: p.string="I can help you search the HSTU Research Data Repository and Resource Centre. Find research, reports, capacity-building materials, data resources, services and more — even if you only remember part of the title or misspell a word."

# ---------- PUBLIC LANGUAGE CLEANUP ----------
banned_replacements=[
 ("Recovered J-MERG","HSTU"),
 ("J-MERG","HSTU"),
 ("legacy repository","Research Data Repository"),
 ("legacy resource","resource"),
 ("recovered entries","studies"),
 ("recovered records","research records"),
 ("reconstructed in this build","available in this repository"),
 ("source repository","Research Data Repository"),
 ("old repository","Research Data Repository"),
 ("original site","repository"),
 ("migration","development")
]
for node in list(soup.find_all(string=True)):
    if node.parent and node.parent.name in {"script","style","code","pre","textarea"}: continue
    v=str(node); n=v
    for a,b in banned_replacements: n=n.replace(a,b)
    if n!=v: node.replace_with(n)

# ---------- STYLES ----------
old=soup.find(id="hstu-purpose-alignment-v1")
if old: old.decompose()
style=soup.new_tag("style",id="hstu-purpose-alignment-v1")
style.string="""
.hstu-purpose-section{padding-top:26px;padding-bottom:26px}
.hstu-purpose-shell{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:24px;align-items:stretch}
.hstu-purpose-copy,.hstu-purpose-facts{background:#fff;border:1px solid rgba(18,91,54,.13);border-radius:26px;box-shadow:0 18px 45px rgba(18,61,40,.07)}
.hstu-purpose-copy{padding:28px}.hstu-purpose-copy h2{margin:6px 0 14px;font-size:clamp(27px,3vw,42px);letter-spacing:-.035em}.hstu-purpose-copy p{line-height:1.7;color:#56665d}
.hstu-purpose-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.hstu-purpose-actions button{border:0;border-radius:999px;background:#0b713d;color:#fff;padding:11px 14px;font-weight:850;cursor:pointer}.hstu-purpose-actions button:nth-child(n+2){background:#eef6f1;color:#155d39}
.hstu-purpose-facts{padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:11px}.hstu-purpose-facts article{padding:16px;border-radius:18px;background:linear-gradient(135deg,#f4faf6,#fff);border:1px solid #e3ede6}.hstu-purpose-facts b{display:block;color:#0b713d;font-size:13px;line-height:1.25}.hstu-purpose-facts span{display:block;margin-top:4px;color:#718078;font-size:11px;line-height:1.4}
.hstu-purpose-more{margin-top:14px;border:1px solid #dfe9e2;border-radius:18px;background:#fff;padding:13px 16px}.hstu-purpose-more summary{cursor:pointer;font-weight:850;color:#173d2a}.hstu-purpose-more-copy{padding-top:11px}.hstu-purpose-more-copy p{color:#5b6a61;line-height:1.68}
.hstu-research-purpose-note{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid #dce9e0;background:#f7fbf8;border-radius:16px;margin-bottom:14px}.hstu-research-purpose-note b{color:#0b713d;white-space:nowrap}.hstu-research-purpose-note span{color:#637169;line-height:1.5}
.hstu-unveiling{margin-top:22px;margin-bottom:28px;padding:22px 24px;border-radius:22px;background:linear-gradient(135deg,#0d2217,#173b28);color:#fff;box-shadow:0 16px 42px rgba(8,45,27,.14)}.hstu-unveiling h2{margin:6px 0 8px}.hstu-unveiling p{margin:0;color:#dcebe1;line-height:1.65;max-width:900px}
@media(max-width:900px){.hstu-purpose-shell{grid-template-columns:1fr}.hstu-purpose-facts{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.hstu-purpose-copy{padding:20px}.hstu-purpose-facts{grid-template-columns:1fr}.hstu-research-purpose-note{display:grid}.hstu-purpose-actions{display:grid}.hstu-purpose-actions button{width:100%}}
"""
soup.head.append(style)

# ---------- UPDATE STRUCTURED CONTENT ----------
rp=Path("repository-content.json")
if rp.exists():
    data=json.loads(rp.read_text(encoding="utf-8"))
else: data={}
data.setdefault("about",{})
data["about"]["paragraphs"]=ABOUT_PARAS
data["about"]["purpose"]="The HSTU Resource Centre is the digital home of the Research Data Repository and its supporting HIV/STI/TB strategic-information resources."
data["about"]["primaryFunction"]="Systematically collect, collate and provide access to published and unpublished HIV/STI/TB studies and reports from Jamaica and the wider Caribbean."
data["about"]["supportingScope"]=["Capacity Building","National and Special Reports","Data Audit and Utilization","DHIS2 and TSIS2 SOPs/User Guides","Presentations and Posters","Service information"]
rp.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding="utf-8")

INDEX.write_text(str(soup),encoding="utf-8")
print("Purpose alignment applied.")
