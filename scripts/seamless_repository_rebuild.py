#!/usr/bin/env python3
from bs4 import BeautifulSoup
from pathlib import Path
import json, re, html as htmlmod

INDEX=Path("index.html")
text=INDEX.read_text(encoding="utf-8")
soup=BeautifulSoup(text,"html.parser")

def yr(title):
    years=re.findall(r"\b(?:19|20)\d{2}\b",title or "")
    return years[-1] if years else "Undated"

def rec(title,url,group,kind="PDF"):
    return {"title":title,"url":url,"group":group,"year":yr(title),"type":kind}

ABOUT=[
"The Research Data Repository was conceptualized in 2023 by the Strategic Information Component to systematically collect and collate published and unpublished studies and reports.",
"The repository supports access to HIV, STI and TB research from Jamaica and the wider Caribbean and also brings together capacity-building tools, national-level reports, and data-utilization Standard Operating Procedures and user guides for DHIS2 and TSIS2.",
"Research is organized across 15 thematic areas. Tuberculosis and Risk Communication are among the newer areas of focus. Recent published studies also support the continued development of Unveiling Hope, the research booklet highlighting HIV, STI and TB evidence, emerging trends and priority areas."
]
OBJECTIVES=[
"Coinfection and Communicable Diseases","Sexually Transmitted Infections","Stigma and Discrimination",
"Psychosocial Determinants and Effects of HIV/AIDS","Antiretroviral Drug Resistance","Antiretroviral Therapy Outcomes",
"Prevention of Mother-to-Child Transmission","Adolescent HIV/AIDS","Pediatric HIV/AIDS","Key and Vulnerable Populations",
"Knowledge, Attitudes, Behaviors, and Practices","Epidemiology of HIV in Jamaica","The National HIV Response",
"Tuberculosis Prevention and Control","Risk Communication"
]
AGENDA_CONTEXT=[
("Burden of disease","The agenda identifies an estimated HIV prevalence of 1.3% in Jamaica, with higher prevalence among key populations, and highlights the proportion of new diagnoses among persons aged 15–24 years together with gaps in retention on ART and viral suppression."),
("Populations of interest","MSM, FSW, TG, adolescents and youth aged 15–24, and sexually active males and females."),
("Existing policies and targets","Epidemic control and progress toward the 95–95–95 targets."),
("Level of urgency","Limited research capacity and research output to guide programme decisions make this research agenda urgent."),
("Time frame","5-year agenda.")
]
AGENDA_PRIORITIES=[
"Barriers/facilitators to universal access to care for PLHIV",
"Health information systems and data use for programme management",
"Sustainability of the HIV/STI/TB programme",
"The impact of violence, trauma and adverse childhood events on health of PLHIV and key and vulnerable populations",
"STI incidence, prevalence, and epidemiology",
"Ageing in PLHIV",
"HIV drug resistance",
"Reproductive health in persons living with HIV",
"Co-infections and communicable diseases in PLHIV",
"HIV prevention measures",
"Recency assays for HIV surveillance"
]

NATIONAL_REPORTS=[
("Network of Seropositives J, Policy Plus H. The People Living with HIV Stigma Index: Jamaica. 2020","https://www.stigmaindex.org/wp-content/uploads/2020/06/Jamaica-SI-Report-2020.pdf","External"),
("Inter-American Development Bank. Women’s Health Survey 2016: Jamaica: Final Report. 2018","https://publications.iadb.org/en/womens-health-survey-2016-jamaica-final-report","External"),
("DHIS2 Prevention Database Annual Monitoring Report 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_3f80f0231b7c4e3f96c1d1f247d2eb51.pdf","PDF"),
("HIV Treatment Cascade Report 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_e8bb427890524e4eb4f181a5252b2b91.pdf","PDF"),
("HSTU Annual Report (2017)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_a2e0939746a94fda8650744b478d9c3e.pdf","PDF"),
("Jamaica Health & Lifestyle Survey 2017","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_726e0dd7ed5247a480fc88d29c268af2.pdf","PDF"),
("Jamaica Multiple Indicator Cluster Survey (MICS) 2022","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_32cf5fce0d294d38bc37f114cdb97df9.pdf","PDF"),
("Jamaica Survey of Living Conditions (2021)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_8ad5d4329efc43718ec95abf8b3f1ebf.pdf","PDF"),
("National AIDS Spending Assessment (NASA) Report (2015-2017)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_41e2a7f3aa334a26a0063d9525c6cea0.pdf","PDF"),
("National HIV Programme Report (2017)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_a2e0939746a94fda8650744b478d9c3e.pdf","PDF"),
("NCPI Report 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_4eeac0c75daf4f2f8e9872e311f86861.pdf","PDF"),
("NCPI Report 2024","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_e809e24019ea4156a36af7b272432e55.pdf","PDF"),
("PMTCT Annual Report (January to December 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_1d343e95846d406eb9b7a2e25ce23592.pdf","PDF"),
("SI Quarterly Report (March 2026)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_1479a1a62dc646c79c0da8c220455801.pdf","PDF"),
("SI Report (July 2026)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_089d438912ef4d23a90c6a211e3c9f05.pdf","PDF"),
("SI Annual Report 2025 (Submitted in May 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_91624b54be8d44dcbcbb63d6dd91db21.pdf","PDF"),
("SI Annual Report 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_4295db50ce3d463ea5b72e1c7287ecf6.pdf","PDF"),
("STI Bi-Annual Database Monitoring Report (January to June 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_ac05204be77a43d48aaa598686d13c44.pdf","PDF"),
("STI Bi-Annual Database Monitoring Report (July to December 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_cb05a673b0ac43d48b0ba8138e25164d.pdf","PDF"),
("STI Annual Database Monitoring Report (January to December 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_686eba28dc2f46d8bd58015d586ce1c8.pdf","PDF"),
("TB Annual Report (January to December 2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_428f44b7b0b64a1f87bc716e7135b508.pdf","PDF")
]
SURVEYS=[
("IBBS Study - FSW 2024","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_719c768ab64d4f1587e5bda30769d3d0.pdf"),
("IBBS Study - MSM & TG 2024","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_b71d11e41ac640609d5b9ad4f2cebf5f.pdf"),
("Integrated Bi-Behavioral Surveillance (IBBS) Surveys for Men who have sex with Men, Female Sex Workers and Transgender Women (2024)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_5b2796473da548c1848bff878b6f324f.pdf"),
("Knowledge, Attitude, Behaviour and Practice (KABP) Survey Terms of Reference (2021)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_214c146c40b84cac810622e89260c860.pdf"),
("Knowledge, Attitude, Behaviour and Practice (KABP) (2024)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_808940ad37ff4310a4482e2b16c4ca06.pdf"),
("The 876 Study: Integrated Biological and Behavioral Surveillance Survey with Population Size Estimation Among Men who have Sex with Men and Transgender Persons in Jamaica (2019)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_7b2be1720fc24132ac6bcfb19cf87e9b.pdf"),
("4th Generation Surveillance of Commercial Sex Workers, Female Patrons and Workers of Sites where Persons Meet Sex Partners or Participate in Sexual Activity in Jamaica (2017)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_e0e3718b9d5d4c2999bb124f3647785e.pdf"),
("2017 HIV/AIDS Knowledge, Attitudes and Behaviour Survey, Jamaica","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_e9863a4cd2464e59bd20be83416ef1db.pdf"),
("HIV/AIDS Knowledge, Attitudes and Behaviour Survey, Jamaica (2024)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9a00af4364d243b19f3cd6ad48d2d126.pdf")
]
SPECIAL=[
("Global AIDS Monitoring (GAM) 2024","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_a6fd1230b2ae4f42baa6dc20c3485a28.pdf"),
("JASL COVID-19 Response Grant Assessment 2023","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_368a50632f094415bbc8e8c7dbc87a51.pdf"),
("JASL Living Support Focus Group Report 2023","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_701051e9c915407eaa3ed2a439ab2a21.pdf"),
("Mystery Shopping Assessment Report 2026 Q2 (Final)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_be0da640263d48f8be133853c42b4c33.pdf"),
("Mystery Shopping Assessment Report 2026 Q3 (Final)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_7bba4c847eeb41b690a7d7d0c4e74f1a.pdf")
]
CAPACITY=[
("Training Report 2026","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_8fb5686d22a041839b74e7c9b4dbae9b.pdf"),
("Data-O-Rama - Microsoft EXCEL Training (Pivot Tables, Charts, Slicers & Dashboards)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_186d997de4a14bbea91242b65d64a6d9.pdf"),
("SPSS Training","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_c63a8eaeebfb4ff0b04ffe2914586ee1.pdf"),
("Monitoring and Evaluation of the HIV Cascade","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_86b718ddb6774860b84054a5957752ab.pdf"),
("HIV Services","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_232d4e48bfdb43dc84cad99fb3dd35ac.pdf"),
("Pharmacology and Pharmacotherapy of ARVs 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_4b1521a6445d44e3ba65329dba239ae7.pdf"),
("Opportunistic Infections 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_113095e952124786b4d63d78dafba366.pdf"),
("Engaging Key Populations - Support Services","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_0f65d83deb3a4d3492aa49e6ea346f13.pdf"),
("Preped and Ready to Go","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_4baa6a2f12c24c6dbaee2ec72b663244.pdf"),
("Human Rights in the Health Care Setting","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9c6bd60e58804d7e9bd7b1210fd30ba1.pdf"),
("Ageing PLHIV 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9e6b1d09515245948846c854a3614ddc.pdf")
]
DATA_AUDIT=[
("National Executive Summary - Data Quality Audit Report (2025)","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_430f7bf76e2d47dd86da527d9371805d.pdf","Data Audit Reports"),
("Prevention - North East Regional Health Authority Data Quality Audit Report 2026","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_15a7ae0cce5847008c9f8ec8c2d53176.pdf","Data Audit Reports"),
("Prevention - South East Regional Health Authority Data Quality Audit Report 2026","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_26171ce634e3407ab019aa823114b006.pdf","Data Audit Reports"),
("Prevention - Southern Regional Health Authority Data Quality Audit Report 2026","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_e236fc7ceb80486ca466bc77dd6ee8f7.pdf","Data Audit Reports"),
("Prevention - Western Regional Health Authority Data Quality Audit Report 2026","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9307151d33c84848bfb7d4144381ead9.pdf","Data Audit Reports"),
("DHIS2 Prevention Manual","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_b76482ee88cc4952a110ea8e803482fd.pdf","Data Systems Manuals & User Guides"),
("STI - CI - EMTCT Manual","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_cb9a47bb7218476da075cdf82cfe6f86.pdf","Data Systems Manuals & User Guides"),
("TB Manual","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_79c7ab8aca8f4850bb4901c9ebdc3c1d.pdf","Data Systems Manuals & User Guides"),
("TSIS2 Manual","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_8484c96c34774617831454d7e94f40d7.pdf","Data Systems Manuals & User Guides")
]
OPERATIONAL=[
("30 Years of Advancement and Challenges in Early HIV Diagnosis in Jamaica","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_44c0d25b3c4941c5b03d90fc5dddcde4.pdf"),
("Correcting the 2nd and 3rd 90s through Laboratory Surveillance","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_1306c4a299fe43418953073eff2e83f0.pdf"),
("Factors Associated with Very Late Presentation Among PLHIV in Southern Jamaica","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_b66e1bccc3224e7ea899354e0f243e32.pdf"),
("Factors Associated with Recurring Treatment Interruptions","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_973c7d998ca64bd6a42be2fe6d44ffc8.pdf"),
("HIVDR Study 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_6808f75f20314dcd8003183a0941fdae.pdf"),
("MOH NSP National Strategic Plan","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_542f8a625ae14a77ab07e43beb524030.pdf"),
("Mortality Patterns and Gaps in HIV Care: Insights from Jamaica 2021-2023","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_dfe9cc228be748f19117cba5e03e0bd4.pdf"),
("Operational Research Abstracts - HSTU Studies 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_d373932716a5460c845c3fda17fc3b9f.pdf"),
("PLHIV Retention in Care","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_a297e910f7374b659bccf31cc929274b.pdf"),
("Research Agenda for the National HIV Response","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_409718fa12944c45a238d6b5ac887662.pdf"),
("SRHA Risk Assessment Matrix Research 2025","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_c68f70f880414dd28fd37612302020b2.pdf")
]
PRESENTATIONS=[
("HIV Testing Presentation","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9c0f0d22003e4b859fa38f15a7413073.pdf"),
("TCS Annual Forum Poster 1","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_1f06dc50326b4836a2fdf20ac5a53369.pdf"),
("TCS Annual Forum Poster 2","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_9397627194fb4426b80cc8067aad32ad.pdf"),
("TCS Annual Forum Poster 3","https://2aef310d-9351-419e-9a0a-317bf599b4ac.filesusr.com/ugd/8a054d_f79974bc4057439f847eb7d1d9744fb6.pdf")
]
OFFICIAL=[
("HSTU Reports","https://hstu.moh.gov.jm/media/reports/"),
("HSTU Policy Papers","https://hstu.moh.gov.jm/media/policy-papers/"),
("HSTU Manuals","https://hstu.moh.gov.jm/media/manuals/"),
("HSTU Research","https://hstu.moh.gov.jm/media/research/"),
("HSTU Strategic Plans","https://hstu.moh.gov.jm/media/strategic-plans/")
]

def sort_items(items):
    return sorted(items,key=lambda r:(int(yr(r[0])) if yr(r[0]).isdigit() else 0,r[0]),reverse=True)

def card(title,url,group,kind="PDF",action="View resource"):
    return f'''<article class="hstu-refine-card hstu-parity-card"><span class="badge">{htmlmod.escape(yr(title))} · {htmlmod.escape(group)}</span><h3>{htmlmod.escape(title)}</h3><a href="{htmlmod.escape(url,quote=True)}" target="_blank" rel="noopener noreferrer">{htmlmod.escape(action)} ↗</a></article>'''

def group_html(title,items,preview=8,action="View resource"):
    items=sort_items(items)
    first=items[:preview]; rest=items[preview:]
    body=f'<section class="hstu-parity-group"><h2>{htmlmod.escape(title)}</h2><div class="hstu-refine-grid">' + ''.join(card(t,u,title,k if len(x)>2 else "PDF",action) for x in first for t,u,*tail in [x] for k in [tail[0] if tail else "PDF"]) + '</div>'
    if rest:
        body+=f'<details class="hstu-parity-more"><summary>View all {len(items)} {htmlmod.escape(title.lower())}</summary><div class="hstu-refine-grid">' + ''.join(card(t,u,title,k if len(x)>2 else "PDF",action) for x in rest for t,u,*tail in [x] for k in [tail[0] if tail else "PDF"]) + '</div></details>'
    return body+'</section>'

def replace_children(node,fragment):
    node.clear()
    frag=BeautifulSoup(fragment,"html.parser")
    for child in list(frag.contents):
        node.append(child)

def remove_matching(section, selectors):
    for sel in selectors:
        for node in list(section.select(sel)):
            node.decompose()

# HOME — full About content integrated, no separate rebuild language.
home=soup.find(id="view-home")
intro=home.select_one(".hstu-repository-intro")
replace_children(intro, f'''
<div class="eyebrow">HSTU · Strategic Information</div>
<h2>About the Research Data Repository</h2>
<p>{htmlmod.escape(ABOUT[0])}</p>
<p>{htmlmod.escape(ABOUT[1])}</p>
<p>{htmlmod.escape(ABOUT[2])}</p>
<div class="hstu-about-statline"><b>15 research areas</b><span>plus Capacity Building, National and Special Reports, and Data Audit and Utilization.</span></div>
<div class="hstu-intro-links"><button data-view="research">Explore research →</button><button data-view="capacity">Capacity Building →</button><button data-view="reports">Reports →</button><button data-view="data-audit">Data Audit and Utilization →</button></div>
''')

# RESEARCH — preserve strategic-objective browser and add original research agenda + operational research.
research=soup.find(id="view-research")
hero=research.select_one(".page-hero p")
hero.string="Research from Jamaica and the wider Caribbean, organized across 15 Strategic Objectives. Browse recent studies first, search the collection, or explore the National HIV Programme Research Agenda and HSTU operational research."
agenda_html='<section class="wrap hstu-agenda-block"><div class="eyebrow">National HIV Programme</div><h2>Research Agenda</h2><div class="hstu-agenda-context">'
for label,val in AGENDA_CONTEXT:
    agenda_html+=f'<article><b>{htmlmod.escape(label)}</b><p>{htmlmod.escape(val)}</p></article>'
agenda_html+='</div><h3>Research agenda priorities</h3><ol class="hstu-agenda-list">'+''.join(f'<li>{htmlmod.escape(x)}</li>' for x in AGENDA_PRIORITIES)+'</ol></section>'
controls=research.select_one(".hstu-refine-controls")
controls.insert_before(BeautifulSoup(agenda_html,"html.parser"))
research.append(BeautifulSoup(group_html("Operational Research",[(t,u,"PDF") for t,u in OPERATIONAL],6,"View document"),"html.parser"))

# CAPACITY BUILDING — retain current bundled manuals and official MOHW references, replace old duplicate archive blocks with clean programme materials.
capacity=soup.find(id="view-capacity")
remove_matching(capacity,[".jmerg-collection-title",".jmerg-mini-grid",".hstu-audit-collection"])
capacity_hero=capacity.select_one(".page-hero p")
capacity_hero.string="Manuals, user-focused learning materials and professional development resources for HIV, STI and TB programme staff. Recent materials are prioritized, with the full collection available below."
capacity.append(BeautifulSoup(group_html("Programme Training & Technical Learning",[(t,u,"PDF") for t,u in CAPACITY],6,"Open material"),"html.parser"))

# REPORTS — exact national, survey/study and special-report collections from the previous repository.
reports=soup.find(id="view-reports")
replace_children(reports,f'''
<div class="wrap page-hero"><div class="eyebrow">HSTU · Strategic Information</div><h1>Reports</h1><p>National programme reports, national surveys and studies, and special reports. Recent documents appear first; use View All to open the complete collection.</p></div>
<div class="wrap hstu-parity-sections">
{group_html("National Reports",NATIONAL_REPORTS,8,"View report")}
{group_html("National Surveys & Studies",[(t,u,"PDF") for t,u in SURVEYS],6,"View study")}
{group_html("Special Reports",[(t,u,"PDF") for t,u in SPECIAL],5,"View report")}
</div>
''')

# DATA AUDIT AND UTILIZATION — audit reports + database/user guides only here.
data=soup.find(id="view-data-audit")
audit_items=[(t,u,"PDF") for t,u,g in DATA_AUDIT if g=="Data Audit Reports"]
guide_items=[(t,u,"PDF") for t,u,g in DATA_AUDIT if g!="Data Audit Reports"]
replace_children(data,f'''
<div class="wrap page-hero"><div class="eyebrow">HSTU · Strategic Information</div><h1>Data Audit and Utilization</h1><p>Data quality audit reports, database manuals and user guides supporting DHIS2, TSIS2 and programme data use.</p></div>
<div class="wrap hstu-parity-sections">
{group_html("Data Quality Audit Reports",audit_items,5,"View report")}
{group_html("Data Systems Manuals & User Guides",guide_items,4,"Open guide")}
</div>
''')

# RESOURCES — keep the existing live learning directory; add official HSTU links and presentations/posters, remove old archive/rebuild blocks.
resources=soup.find(id="view-resources")
remove_matching(resources,[".jmerg-collection-title",".jmerg-mini-grid",".hstu-audit-collection"])
res_hero=resources.select_one(".page-hero p")
res_hero.string="Learning links, official HSTU media collections, presentations and posters. Jamaica-first learning is prioritized, with Caribbean and international resources clearly identified."
official_html='<section class="wrap hstu-parity-group"><h2>Official HSTU Collections</h2><div class="hstu-refine-grid">'+''.join(card(t,u,"Official HSTU Link","Official Link","Open collection") for t,u in OFFICIAL)+'</div></section>'
pp_html='<section class="wrap hstu-parity-group"><h2>Presentations & Posters</h2><div class="hstu-refine-grid">'+''.join(card(t,u,"Presentations & Posters","PDF","View document") for t,u in PRESENTATIONS)+'</div></section>'
resources.append(BeautifulSoup(official_html+pp_html,"html.parser"))
pdfpost=resources.select_one(".hstu-pdf-posters")
if pdfpost:
    h=pdfpost.find(["h1","h2","h3"])
    if h: h.string="Campaign Presentations & Print Assets"
    p=pdfpost.find("p")
    if p: p.string="Selected HSTU campaign presentation and print files."

# GALLERY — campaign imagery only. Posters live under Resources.
gallery=soup.find(id="view-gallery")
remove_matching(gallery,[".jmerg-collection-title",".jmerg-poster-strip"])
note=gallery.select_one(".hstu-gallery-note")
if note: note.string="Explore HIV, STI, TB and PrEP campaign images from the HST Health Living media collection."

# Remove public rebuild/provenance language everywhere outside script/style/code.
repls=[
("Recovered J-MERG","HSTU"),("J-MERG","HSTU"),("legacy resource","resource"),("legacy repository","research repository"),
("Legacy technical reference","Technical reference"),("Recovered",""),("recovered",""),("reconstructed","catalogued"),
("original repository","Research Data Repository"),("source repository","Research Data Repository")
]
for node in list(soup.find_all(string=True)):
    if node.parent and node.parent.name in {"script","style","code","pre","textarea"}: continue
    val=str(node)
    new=val
    for a,b in repls: new=new.replace(a,b)
    new=re.sub(r"\s{2,}"," ",new)
    if new!=val: node.replace_with(new)

# New compact styling for agenda and grouped collections.
old=soup.find(id="hstu-parity-css")
if old: old.decompose()
style=soup.new_tag("style",id="hstu-parity-css")
style.string="""
.hstu-parity-sections,.hstu-parity-group,.hstu-agenda-block{padding-top:18px;padding-bottom:34px}
.hstu-parity-group>h2,.hstu-agenda-block>h2{margin:0 0 18px}
.hstu-parity-more{margin-top:18px;border:1px solid rgba(23,57,43,.14);border-radius:16px;background:#fff;padding:12px 16px}
.hstu-parity-more summary{cursor:pointer;font-weight:800;color:#08713b}
.hstu-parity-more[open] summary{margin-bottom:18px}
.hstu-agenda-block{margin-top:18px;background:linear-gradient(135deg,#f6fbf8,#fff);border:1px solid rgba(8,113,59,.14);border-radius:24px;padding-left:24px;padding-right:24px}
.hstu-agenda-context{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:18px 0 24px}
.hstu-agenda-context article{background:#fff;border:1px solid rgba(23,57,43,.1);border-radius:14px;padding:14px}
.hstu-agenda-context p{margin:.45rem 0 0;font-size:.9rem;line-height:1.5}
.hstu-agenda-list{columns:2;column-gap:34px;margin:12px 0 0;padding-left:22px}
.hstu-agenda-list li{break-inside:avoid;margin:0 0 10px;padding-left:4px}
.hstu-about-statline{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0}
.hstu-about-statline b{color:#08713b}
.hstu-parity-card a{display:inline-flex;margin-top:auto;font-weight:800;color:#08713b;text-decoration:none}
@media(max-width:900px){.hstu-agenda-context{grid-template-columns:1fr 1fr}.hstu-agenda-list{columns:1}}
@media(max-width:600px){.hstu-agenda-context{grid-template-columns:1fr}.hstu-agenda-block{padding-left:16px;padding-right:16px}}
"""
soup.head.append(style)

# Write a structured internal content catalogue for future maintenance.
catalog={
 "generated":"2026-09-29",
 "about":{"paragraphs":ABOUT,"researchAreas":OBJECTIVES},
 "researchAgenda":{"context":[{"label":a,"text":b} for a,b in AGENDA_CONTEXT],"priorities":AGENDA_PRIORITIES},
 "capacityBuilding":[rec(t,u,"Programme Training & Technical Learning") for t,u in CAPACITY],
 "reports":{
   "national":[rec(t,u,"National Reports",k) for t,u,k in NATIONAL_REPORTS],
   "nationalSurveysStudies":[rec(t,u,"National Surveys & Studies") for t,u in SURVEYS],
   "special":[rec(t,u,"Special Reports") for t,u in SPECIAL]},
 "dataAudit":[rec(t,u,g) for t,u,g in DATA_AUDIT],
 "operationalResearch":[rec(t,u,"Operational Research") for t,u in OPERATIONAL],
 "resources":{"presentationsPosters":[rec(t,u,"Presentations & Posters") for t,u in PRESENTATIONS],
              "officialLinks":[rec(t,u,"Official HSTU Link","Official Link") for t,u in OFFICIAL]}
}
Path("repository-content.json").write_text(json.dumps(catalog,indent=2,ensure_ascii=False),encoding="utf-8")

# Ensure only one current parity style and save HTML.
INDEX.write_text(str(soup),encoding="utf-8")

# Public-facing QA.
check=BeautifulSoup(INDEX.read_text(encoding="utf-8"),"html.parser")
for x in check(["script","style","code","pre","textarea"]): x.decompose()
visible=" ".join(check.stripped_strings)
for banned in ["J-MERG","legacy resource","Recovered J-MERG","reconstructed in this build"]:
    if banned.lower() in visible.lower():
        raise SystemExit(f"Public wording QA failed: {banned}")
for required in ["view-home","view-research","view-capacity","view-reports","view-data-audit","view-gallery","view-resources","view-services"]:
    if not check.find(id=required):
        raise SystemExit(f"Missing required section: {required}")

audit=f"""# HSTU Resource Centre Content Parity Audit — 29 September 2026

Public source pages reviewed: 22/22.

## Content represented in the HSTU Resource Centre
- 15 Strategic Objective research areas, with the recovered research catalogue loaded separately.
- National HIV Programme Research Agenda: 11 priorities plus agenda context.
- Operational Research documents: {len(OPERATIONAL)}.
- Capacity Building programme training/technical materials: {len(CAPACITY)} in addition to the existing bundled manual library and live MOHW references.
- National Reports: {len(NATIONAL_REPORTS)}.
- National Surveys & Studies: {len(SURVEYS)}.
- Special Reports: {len(SPECIAL)}.
- Data Audit and Utilization resources: {len(DATA_AUDIT)}.
- Presentations & Posters: {len(PRESENTATIONS)}.
- Official HSTU external collections: {len(OFFICIAL)}.
- About/repository purpose is integrated into Home.
- Gallery retains campaign imagery; presentation/poster documents are housed under Resources.

Public wording does not describe the site as a migration, recovery or legacy rebuild. Source provenance remains internal.
"""
Path("internal-audits/CONTENT_PARITY_AUDIT_2026-09-29.md").parent.mkdir(parents=True,exist_ok=True)
Path("internal-audits/CONTENT_PARITY_AUDIT_2026-09-29.md").write_text(audit,encoding="utf-8")
print("Seamless repository rebuild applied.")
