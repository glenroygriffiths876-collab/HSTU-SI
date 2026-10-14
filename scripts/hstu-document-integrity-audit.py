#!/usr/bin/env python3
"""Read-only complete hosted PDF/preview integrity audit.
Does not rewrite titles, documents, previews or the website.
Artifacts: docs/hstu-document-integrity-audit.json & .csv.
"""
from __future__ import annotations
import csv
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
import fitz
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT/"pdf-library.json").read_text(encoding="utf-8"))
out_dir=ROOT/"docs"
out_dir.mkdir(exist_ok=True)
entries=list(manifest["by_url"].items())
cases={
 "089d438912ef4d23a90c6a211e3c9f05": ("SI Report (July 2026)",55,("july", "2026")),
 "1479a1a62dc646c79c0da8c220455801": ("SI Quarterly Report (March 2026)",61,("march", "2026")),
 "be0da640263d48f8be133853c42b4c33": ("Mystery Shopping Assessment Report 2026 Q2 (Final)",16,("mystery", "shopping", "2026")),
}
result=[]
screens=[]
failures=[]
review=[]
seen_pdf={}
seen_preview={}
def contained(rel,extension):
    if not isinstance(rel,str) or not re.fullmatch(r"(documents/pdf-library|media/pdf-previews)/[a-z0-9_.-]+"+re.escape(extension),rel,re.I):
        raise ValueError("Invalid repository file path: "+str(rel))
    f=(ROOT/rel).resolve()
    if not f.is_relative_to(ROOT.resolve()):
        raise ValueError("Path escaped repository root: "+rel)
    return f
def scaled_arr(im):
    im=ImageOps.exif_transpose(im).convert("RGB")
    # Preserve aspect ratio, like the source PDF preview generation; white matte.
    im=ImageOps.pad(im,(184,238),color=(255,255,255),method=Image.Resampling.LANCZOS)
    return np.asarray(im.convert("L"),dtype=np.float32).reshape(-1)
def similarity(a,b):
    # Mean-centered cosine image similarity; unlike an absolute-white match,
    # different mostly-white research covers do not receive a false near-1.
    a=a-np.mean(a)
    b=b-np.mean(b)
    denom=np.linalg.norm(a)*np.linalg.norm(b)
    return float(np.dot(a,b)/denom) if denom>0 else 0.0
for source,item in entries:
    row={"source_url":source,"status":item.get("status"),"local":item.get("local"),
         "preview":item.get("preview"),"bytes_in_manifest":item.get("bytes"),
         "sha256":"","pdf_pages":0,"preview_sha256":"","cover_similarity":None,
         "nearest_preview_source":"","nearest_preview_similarity":None,
         "cover_excerpt":"","identity_label":"","errors":[],"warnings":[]}
    if not source.startswith("https://"):
        row["warnings"].append("Legacy non-HTTPS source (check redirect and accessibility before changing)")
    if item.get("source")!=source:
        row["errors"].append("Manifest source does not match lookup key")
    if not item.get("local"):
        if item.get("status")!="external": row["errors"].append("Missing local PDF")
        row["warnings"].append("External source cannot be content-certified without retrieving original")
        result.append(row)
        continue
    try:
        file=contained(row["local"],".pdf")
        cover=contained(row["preview"],".webp")
        if not file.is_file() or not cover.is_file():
            raise FileNotFoundError(f"Missing PDF/preview: {file.exists()}, {cover.exists()}")
        pdfbytes=file.read_bytes()
        if not pdfbytes.startswith(b"%PDF-"):
            row["errors"].append("Local file is not PDF binary")
        row["sha256"]=hashlib.sha256(pdfbytes).hexdigest()
        if row["sha256"] in seen_pdf:
            row["warnings"].append("Duplicate PDF bytes under a second source URL (verify whether this is an unused alias): "+seen_pdf[row["sha256"]])
        seen_pdf[row["sha256"]]=row["local"]
        if item.get("bytes")!=len(pdfbytes):
            row["errors"].append(f"Manifest byte count {item.get('bytes')} differs from file {len(pdfbytes)}")
        imagebytes=cover.read_bytes()
        row["preview_sha256"]=hashlib.sha256(imagebytes).hexdigest()
        if row["preview_sha256"] in seen_preview:
            row["warnings"].append("Identical preview bytes: "+seen_preview[row["preview_sha256"]])
        seen_preview[row["preview_sha256"]]=row["preview"]
        pdf=fitz.open(file)
        row["pdf_pages"]=len(pdf)
        if len(pdf)<1: raise ValueError("No pages in PDF")
        first=pdf[0]
        pix=first.get_pixmap(matrix=fitz.Matrix(0.43,0.43),colorspace=fitz.csRGB,alpha=False)
        sourceimage=Image.frombytes("RGB",(pix.width,pix.height),pix.samples)
        previewimage=Image.open(cover)
        previewimage.load()
        if previewimage.width<80 or previewimage.height<80: row["errors"].append("Preview is too small")
        if previewimage.format!="WEBP": row["errors"].append("Preview not WebP")
        row["cover_excerpt"]=" ".join(first.get_text().split())[:400]
        source_sig=scaled_arr(sourceimage)
        # Some official manuals use a two-page jacket for their cover preview
        # (front cover on the RIGHT, back cover on the LEFT).
        # Compare the actual PDF page with the whole preview AND each half.
        width,height=previewimage.size
        crops=[previewimage]
        if width>=1.25*height:
            crops.extend([previewimage.crop((0,0,width//2,height)),
                          previewimage.crop((width//2,0,width,height))])
        cover_sigs=[scaled_arr(im) for im in crops]
        screens.append({"row":row,"source_sig":source_sig,"cover_sigs":cover_sigs})
        for term,(title,pages,keywords) in cases.items():
            if term in row["local"]:
                row["identity_label"]=title
                if row["pdf_pages"]!=pages:row["errors"].append(f"Expected {pages} pages for {title}, got {row['pdf_pages']}")
                pages_text=" ".join(pdf[i].get_text() for i in range(min(3,len(pdf)))).lower()
                missed=[w for w in keywords if w not in pages_text]
                if missed:row["warnings"].append("Cover text missing expected keywords "+",".join(missed))
        pdf.close()
    except Exception as error:
        row["errors"].append(type(error).__name__+": "+str(error)[:300])
    result.append(row)
# Full cross-match: does a preview look more like a different PDF's first page?
for x in screens:
    own=x["row"]
    sims=sorted(
        ((max(similarity(cover_sig,p["source_sig"]) for cover_sig in x["cover_sigs"]),
          p["row"]["local"]) for p in screens),
        reverse=True)
    current=next((v for v,local in sims if local==own["local"]),None)
    best=sims[0]
    own["cover_similarity"]=round(current,5) if current is not None else None
    own["nearest_preview_source"]=best[1]
    own["nearest_preview_similarity"]=round(best[0],5)
    # Strong independent evidence that wrong PDF was used for cover:
    # another document visually matches much better and very closely.
    if best[1]!=own["local"] and best[0]>0.83 and best[0]-current>0.16:
        own["errors"].append("High-confidence WRONG preview: another PDF cover matches better: "+best[1])
    elif current<0.62 or (best[1]!=own["local"] and best[0]-current>0.11):
        own["warnings"].append("Preview needs manual visual confirmation; similarity "+str(round(current,3))+
                               " best candidate "+best[1])
    if own["errors"]:failures.append({"local":own["local"],"errors":own["errors"]})
    if own["warnings"]:review.append({"local":own["local"],"warnings":own["warnings"]})
for x in result:
    if x["errors"] and not x["local"]:failures.append({"source":x["source_url"],"errors":x["errors"]})
    if x["warnings"] and not x["local"]:review.append({"source":x["source_url"],"warnings":x["warnings"]})
report={
 "generated_utc":datetime.now(timezone.utc).isoformat(),
 "result":"FAIL" if failures else ("REVIEW_REQUIRED" if review else "PASS"),
 "total_manifest_records":len(entries),
 "hosted_pdfs":sum(bool(x["local"]) for x in result),
 "external_sources":sum(not x["local"] for x in result),
 "verified_first_pages":len(screens),
 "errors":failures,
 "warnings":review,
 "documents":result,
 "limits":"Similarity checks detect wrong previews but do not substantively validate all report content. External sources require separate permission/link review."
}
(out_dir/"hstu-document-integrity-audit.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
fields=("source_url","status","local","preview","sha256","preview_sha256","pdf_pages","cover_similarity",
        "nearest_preview_source","nearest_preview_similarity","identity_label","errors","warnings")
with (out_dir/"hstu-document-integrity-audit.csv").open("w",newline="",encoding="utf-8") as f:
    writer=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");writer.writeheader()
    for row in result:writer.writerow({**row,"errors":" | ".join(row["errors"]),"warnings":" | ".join(row["warnings"])})
print(json.dumps({k:v for k,v in report.items() if k!="documents"},indent=2)[:18000])
if failures:raise SystemExit("Integrity validation failed: "+str(len(failures))+" hard errors")
