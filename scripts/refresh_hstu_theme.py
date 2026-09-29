#!/usr/bin/env python3
from pathlib import Path
import re

p=Path("index.html")
html=p.read_text(encoding="utf-8")

STYLE=r'''
<style id="hstu-theme-refresh-v1">
/*
 HSTU visual refresh — 29 Sep 2026
 Reduce green dominance; align greens to the official logo; remove yellow from
 the top band; use restrained green/red gradients for action controls; lighten Gia.
*/
:root{
  --hstu-logo-green:#65bd3a;
  --hstu-logo-green-mid:#4d9a3c;
  --hstu-logo-green-deep:#2f7538;
  --hstu-logo-green-soft:#f0f8ec;
  --hstu-logo-green-mist:#f7fbf5;
  --hstu-logo-red:#e51622;
  --hstu-logo-red-deep:#bd1822;
  --hstu-logo-red-soft:#fff1f2;
  --hstu-neutral-ink:#17231b;
  --hstu-action-gradient:linear-gradient(135deg,#2f7538 0%,#438d39 42%,#b6242d 72%,#d71920 100%);
  --hstu-action-gradient-hover:linear-gradient(135deg,#286832 0%,#397f34 40%,#a51f28 70%,#c9141e 100%);
}

/* Overall atmosphere: lighter, cleaner and less green-heavy. */
body{background:#f8faf7!important;color:var(--hstu-neutral-ink)}
.page-hero .subnote{
  background:var(--hstu-logo-green-soft)!important;
  border-color:#d5e9cb!important;
  color:#315f34!important;
}
.home-hero{
  background:
    radial-gradient(circle at 78% 16%,rgba(101,189,58,.13),transparent 34%),
    radial-gradient(circle at 18% 76%,rgba(229,22,34,.12),transparent 40%),
    linear-gradient(145deg,#080a09 0%,#151a16 58%,#172219 100%)!important;
}
.home-hero h1 span{
  background:linear-gradient(90deg,#fff 0%,#dff2d5 52%,#ff9aa0 78%,#fff 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  color:transparent!important;
}
.hstu-agenda-block{
  background:linear-gradient(135deg,#f5faf2 0%,#fff 68%,#fff5f5 100%)!important;
  border-color:#dcebd6!important;
}
.hstu-unveiling{
  background:linear-gradient(135deg,#eff8ea 0%,#fff 58%,#fff1f2 100%)!important;
  color:#203326!important;
  border:1px solid #d8e8d1!important;
  box-shadow:0 16px 42px rgba(44,91,50,.10)!important;
}
.hstu-unveiling a{color:#a51f28!important}
.hstu-research-topic-filters .hstu-research-filter.active{
  background:#315f34!important;
  border-color:#315f34!important;
}

/* Top band: red + green ONLY. No yellow/gold treatment. */
.proposal-banner{
  background:linear-gradient(100deg,#d71920 0%,#e51622 34%,#4d9a3c 66%,#65bd3a 100%)!important;
  color:#fff!important;
  border-bottom:1px solid rgba(94,26,29,.16)!important;
  text-shadow:0 1px 2px rgba(0,0,0,.18);
}
.proposal-banner strong,
.proposal-banner b{
  color:#fff!important;
  background:rgba(255,255,255,.14)!important;
  border:1px solid rgba(255,255,255,.22)!important;
  box-shadow:none!important;
}
.proposal-banner a{color:#fff!important;text-decoration-color:rgba(255,255,255,.72)!important}

/* Primary action language: premium green -> red gradient with white text. */
.hstu-profile-actions a,
.hstu-instagram-link,
.clinical-search button,
.gia-find-card button,
.gia-hub-actions button:not(.subtle),
.gia-hub-actions a:not(.subtle),
.gia-ref a,
.hstu-arcade-play,
button[data-service-mode].active,
.hstu-parity-more button,
.hstu-research-card-footer a.button,
.hstu-research-card-footer button{
  background:var(--hstu-action-gradient)!important;
  color:#fff!important;
  border-color:transparent!important;
  text-shadow:0 1px 2px rgba(0,0,0,.28);
  box-shadow:0 8px 22px rgba(87,48,43,.16)!important;
}
.hstu-profile-actions a:hover,
.hstu-instagram-link:hover,
.clinical-search button:hover,
.gia-find-card button:hover,
.gia-hub-actions button:not(.subtle):hover,
.gia-hub-actions a:not(.subtle):hover,
.gia-ref a:hover,
.hstu-arcade-play:hover,
button[data-service-mode].active:hover,
.hstu-parity-more button:hover,
.hstu-research-card-footer a.button:hover,
.hstu-research-card-footer button:hover{
  background:var(--hstu-action-gradient-hover)!important;
  color:#fff!important;
  transform:translateY(-1px);
}

/* Keep secondary controls quiet so the gradient remains intentional rather than noisy. */
.gia-hub-actions .subtle,
.clinical-shortcuts button,
.hstu-nav-dropdown button{
  background:#fff!important;
  color:#315f34!important;
  border-color:#dbe8d6!important;
  text-shadow:none!important;
  box-shadow:none!important;
}
.gia-hub-actions .subtle:hover,
.clinical-shortcuts button:hover,
.hstu-nav-dropdown button:hover,
.hstu-nav-dropdown button:focus{
  background:var(--hstu-logo-green-soft)!important;
  color:#28552d!important;
}

/* Gia: remove the large dark-green block. */
.clinical-panel{
  background:#fff!important;
  border-left:1px solid #e4ebe1;
}
.clinical-head{
  background:
    linear-gradient(112deg,#f2f8ee 0%,#fff 57%,#fff0f1 100%)!important;
  color:var(--hstu-neutral-ink)!important;
  border-bottom:1px solid #e3ebe0!important;
  box-shadow:inset 0 4px 0 0 var(--hstu-logo-green),inset 0 -1px 0 rgba(229,22,34,.05);
}
.clinical-head small{
  color:#9f1c25!important;
  letter-spacing:.11em!important;
}
.clinical-head h2{color:#1e3525!important}
.clinical-head p{color:#66746a!important}
.clinical-head .clinical-avatar{
  border:3px solid #fff!important;
  box-shadow:0 5px 16px rgba(43,80,48,.14)!important;
}
.clinical-close{
  background:#fff!important;
  color:#8f2027!important;
  border:1px solid #ead5d7!important;
  box-shadow:0 4px 13px rgba(92,47,49,.08)!important;
}
.clinical-close:hover{background:var(--hstu-logo-red-soft)!important}
.clinical-search-wrap{
  background:#fbfcfa!important;
  border-bottom-color:#e5ebe2!important;
}
.clinical-search input:focus{
  border-color:var(--hstu-logo-green)!important;
  box-shadow:0 0 0 3px rgba(101,189,58,.13)!important;
}
.clinical-results{background:#f7faf6!important}
.clinical-foot{background:#fff!important;border-top-color:#e4ebe1!important}
.clinical-foot b{color:#315f34!important}

/* Mobile Gia navigation remains high-contrast but now carries both brand colours. */
.clinical-mobile-nav{
  background:linear-gradient(110deg,#315f34 0%,#4d9a3c 48%,#bd1822 100%)!important;
  color:#fff!important;
}
.clinical-mobile-back,
.clinical-mobile-close{
  color:#fff!important;
  background:rgba(255,255,255,.13)!important;
  border-color:rgba(255,255,255,.30)!important;
}

/* Gia results: soft logo green, not dark blocks. */
.gia-answer-head,
.gia-hub-summary{
  background:linear-gradient(135deg,#f1f8ed 0%,#fff 72%,#fff5f5 100%)!important;
}
.gia-answer-head>span{color:#467e35!important}
.gia-answer-head h3,
.gia-hub-summary b{color:#25422c!important}
.gia-find-badge,
.gia-hub-badge{
  background:#edf7e8!important;
  color:#3f7333!important;
}
.gia-found-flash,
.gia-hub-flash{
  outline-color:rgba(229,22,34,.52)!important;
}

/* Maintain readable navigation and restrained brand hints. */
.hstu-nav-dropdown{border-color:#dbe8d6!important}
.nav-btn.manuals-nav{
  background:linear-gradient(135deg,rgba(101,189,58,.15),rgba(229,22,34,.10))!important;
}
.hstu-collage-brand-dot{
  background:var(--hstu-action-gradient)!important;
}

/* Mobile spacing and readability. */
@media(max-width:950px){
  .clinical-head{box-shadow:inset 0 3px 0 var(--hstu-logo-green)!important}
  .proposal-banner{padding:8px 12px!important}
}
@media(prefers-reduced-motion:reduce){
  .hstu-profile-actions a:hover,
  .clinical-search button:hover,
  .gia-find-card button:hover,
  .gia-hub-actions button:hover,
  .gia-hub-actions a:hover{transform:none!important}
}
</style>
'''

html=re.sub(r'<style id="hstu-theme-refresh-v1">.*?</style>','',html,flags=re.S|re.I)
if "</head>" not in html:
    raise SystemExit("Could not find </head>; refusing to patch index.html")
html=html.replace("</head>",STYLE+"\n</head>",1)
p.write_text(html,encoding="utf-8")
print("Injected HSTU visual refresh:", len(STYLE), "characters")
