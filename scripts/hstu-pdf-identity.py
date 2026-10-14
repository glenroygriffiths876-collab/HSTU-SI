#!/usr/bin/env python3
"""HSTU local PDF identity QA. Does not edit site content or files."""
import collections, hashlib, json, pathlib, re, subprocess, datetime

root=pathlib.Path('.')
manifest=json.loads((root/'pdf-library.json').read_text(encoding='utf-8'))
repository=json.loads((root/'repository-content.json').read_text(encoding='utf-8'))
labels=collections.defaultdict(set)
def walk(x):
    if isinstance(x,dict):
        if isinstance(x.get('url'),str) and isinstance(x.get('title'),str):
            labels[x['url']].add(x['title'])
        for v in x.values():walk(v)
    elif isinstance(x,list):
        for v in x:walk(v)
walk(repository)
ignore={'the','of','and','in','at','on','a','an','for','to','from','with','by','jamaica','jamaican','hiv','sti','tb',
        'year','report','reports','manual','national','programme','training','presentation','study','data','2025','2026'}
norm=lambda x:re.findall(r'[a-z0-9]+',str(x).lower())
def important(text):
    return [x for x in norm(text) if len(x)>2 and x not in ignore]
results=[]
sha_map=collections.defaultdict(list)
for url,item in manifest.get('by_url',{}).items():
    rel=item.get('local')
    if not rel:continue
    path=root/rel
    record={'local':rel,'source':url,'titles':sorted(labels.get(url,[])),'size':None,
            'pages':None,'text_chars':0,'title_word_score':None,'errors':[]}
    if not path.is_file():
        record['errors'].append('Missing source PDF')
        results.append(record);continue
    raw=path.read_bytes()
    record['size']=len(raw)
    record['sha256']=hashlib.sha256(raw).hexdigest()
    sha_map[record['sha256']].append(record)
    if not raw.startswith(b'%PDF-'):record['errors'].append('Not a PDF header')
    if len(raw)<1000:record['errors'].append('Suspiciously small PDF')
    try:
        info=subprocess.run(['pdfinfo',str(path)],capture_output=True,text=True,timeout=10)
        pages=re.search(r'^Pages:\s*(\d+)',info.stdout,re.M)
        if info.returncode or not pages:record['errors'].append('PDF cannot be parsed by pdfinfo')
        else:record['pages']=int(pages.group(1))
    except Exception as e:record['errors'].append('PDF info: '+str(e))
    try:
        cover=subprocess.run(['pdftotext','-f','1','-l','3','-layout',str(path),'-'],
            capture_output=True,text=True,errors='replace',timeout=20)
        if cover.returncode==0:
            t=' '.join(cover.stdout.split())
            record['text_chars']=len(t)
            record['first_text_excerpt']=t[:230]
            if record['titles'] and len(t)>100:
                words=set(important(t))
                scores=[]
                for title in record['titles']:
                    k=important(title)
                    if k:scores.append(sum(x in words for x in k)/len(k))
                if scores:record['title_word_score']=round(max(scores),3)
        else:record['errors'].append('pdftotext failed')
    except Exception as e:record['errors'].append('PDF text extraction: '+str(e))
    results.append(record)

duplicate_bytes=[]
for sha,items in sha_map.items():
    if len(items)>1:
        duplicate_bytes.append({'sha':sha,'records':[{'local':x['local'],'titles':x['titles'],'cover_excerpt':x.get('first_text_excerpt'),'title_word_score':x['title_word_score']} for x in items]})

strong=[x for x in results if x['title_word_score'] is not None and x['title_word_score']<0.25
        and len(important(' '.join(x['titles'])))>=3]
unreadable=[x for x in results if x['text_chars']<100]
critical=[x for x in results if x['errors']]
summary={
 'result':'PASS' if not critical and not strong and not duplicate_bytes else 'REVIEW_REQUIRED',
 'generated':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'total_hosted_pdfs':len(results),'structural_failures':len(critical),
 'low_title_similarity':len(strong),'no_meaningful_extractable_text':len(unreadable),
 'duplicate_content_groups':len(duplicate_bytes),
 'strong_mismatch_candidates':[{'titles':x['titles'],'file':x['local'],'score':x['title_word_score'],
                                'cover_excerpt':x.get('first_text_excerpt')} for x in strong],
 'duplicate_bytes':duplicate_bytes,
 'report_cover_identity':[
    {'file':x['local'],
     'titles':x['titles'],
     'pages':x['pages'],
     'first_text_excerpt':x.get('first_text_excerpt'),
     'sha256':x.get('sha256')}
    for x in results if ('089d438912ef4d23a90c6a211e3c9f05' in x['local'] or
                         '1479a1a62dc646c79c0da8c220455801' in x['local'])],
 'structural_errors':[{'file':x['local'],'errors':x['errors']} for x in critical],
 'unreadable_pdfs':[{'file':x['local'],'titles':x['titles']} for x in unreadable],
 'caution':'Automated title-text similarity is a screening tool, not human validation of identity. Image-only PDFs can lack extractable text.'
}
out=root/'docs/hstu-pdf-identity-audit.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print('IDENTITY SUMMARY',json.dumps({k:v for k,v in summary.items() if isinstance(v,(int,str))},indent=2))
for x in strong[:20]:print('POTENTIAL WRONG DOCUMENT',x['titles'],x['local'],x['title_word_score'],x.get('first_text_excerpt'))
for dup in duplicate_bytes:print('DUPLICATE CONTENT',json.dumps(dup))
if critical:raise SystemExit('Critical PDF corruption/structure problems found')
