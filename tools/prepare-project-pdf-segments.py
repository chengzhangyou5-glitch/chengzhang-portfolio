"""Bounded, resumable 3200px / Q92 continuous WebP export. No tile pyramid.

Requires PyMuPDF and Pillow. Serial child processes: page timeout 180s,
no-progress timeout 120s, whole run timeout 1200s. Progress and verified
segment records live under output/pdf-segments-export; product files are
published atomically. Existing verified images are reused, never re-encoded.
"""
from pathlib import Path
import argparse, datetime, hashlib, json, math, subprocess, sys, time
import pymupdf as fitz
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
WIDTH,QUALITY,METHOD,MAX_HEIGHT,BLEED=3200,92,4,4096,2
CORE_HEIGHT=MAX_HEIGHT-2*BLEED
VERSION='w3200-q92-s4096-v1'
SPEC={'width':WIDTH,'quality':QUALITY,'method':METHOD,'maxHeight':MAX_HEIGHT,'bleed':BLEED,'version':VERSION}

def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(data):return hashlib.sha256(data).hexdigest()
def atomic_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix('.tmp.json')
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');tmp.replace(path)
def log(path,data):
    data={'time':stamp(),**data};path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('a',encoding='utf8') as f:f.write(json.dumps(data,ensure_ascii=False)+'\n')
    print(json.dumps(data,ensure_ascii=False),flush=True)
def locations(project):
    source=ROOT/'assets/projects'/project/'project.pdf';source_hash=sha(source.read_bytes())
    destination=source.parent/'reader'/VERSION/source_hash
    state=ROOT/'output/pdf-segments-export'/project/source_hash
    prefix='/'+destination.relative_to(ROOT).as_posix()
    return source,source_hash,destination,state,prefix
def blueprint(page,number,page_offset):
    height=math.ceil(page.rect.height*WIDTH/page.rect.width)
    segments=[]
    for part,top in enumerate(range(0,height,CORE_HEIGHT),1):
        bottom=min(height,top+CORE_HEIGHT);image_top=max(0,top-BLEED);image_bottom=min(height,bottom+BLEED)
        segments.append({'page':number,'part':part,'width':WIDTH,'height':bottom-top,'top':page_offset+top,'imageTop':page_offset+image_top,'imageHeight':image_bottom-image_top,'localImageTop':image_top,'localImageBottom':image_bottom,'filename':f'page-{number:02d}-part-{part:02d}.webp'})
    return height,segments
def verified(record,path,expected,source_hash):
    if not record or record.get('sourceHash')!=source_hash or record.get('spec')!=SPEC or record.get('segment')!=expected or not path.exists():return False
    data=path.read_bytes()
    return len(data)==record.get('bytes') and sha(data)==record.get('sha256')

def export_page(project,number):
    source,source_hash,destination,state,prefix=locations(project)
    destination.mkdir(parents=True,exist_ok=True);doc=fitz.open(source)
    offset=sum(math.ceil(p.rect.height*WIDTH/p.rect.width) for p in list(doc)[:number-1])
    page=doc[number-1];height,segments=blueprint(page,number,offset);pending=[]
    progress=state/'progress.jsonl'
    for segment in segments:
        record_path=state/(segment['filename']+'.json')
        record=json.loads(record_path.read_text(encoding='utf8')) if record_path.exists() else None
        if verified(record,destination/segment['filename'],segment,source_hash):
            log(progress,{'phase':'reused','project':project,'page':number,'file':segment['filename']})
        else:pending.append(segment)
    if not pending:return
    log(progress,{'phase':'render-start','project':project,'page':number,'pixels':[WIDTH,height],'remaining':len(pending)})
    fitz.TOOLS.set_aa_level(8);scale=WIDTH/page.rect.width
    pix=page.get_displaylist().get_pixmap(matrix=fitz.Matrix(scale,scale),colorspace=fitz.csRGB,alpha=False)
    raster=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    if raster.size!=(WIDTH,height):raise ValueError('Unexpected raster dimensions: '+str(raster.size))
    log(progress,{'phase':'render-ready','project':project,'page':number})
    for segment in pending:
        path=destination/segment['filename'];temporary=path.with_suffix('.tmp.webp')
        raster.crop((0,segment['localImageTop'],WIDTH,segment['localImageBottom'])).save(temporary,'WEBP',quality=QUALITY,method=METHOD)
        with Image.open(temporary) as image:
            image.load()
            if image.size!=(WIDTH,segment['imageHeight']):raise ValueError('Segment dimensions invalid')
        data=temporary.read_bytes();temporary.replace(path)
        atomic_json(state/(segment['filename']+'.json'),{'sourceHash':source_hash,'spec':SPEC,'segment':segment,'bytes':len(data),'sha256':sha(data),'validatedAt':stamp()})
        log(progress,{'phase':'segment-ready','project':project,'page':number,'file':segment['filename'],'bytes':len(data)})
    doc.close()

def stop_process(process):
    if process.poll() is not None:return
    process.kill()
    try:process.wait(timeout=5)
    except subprocess.TimeoutExpired:raise RuntimeError('Export child did not exit')

def run_project(project,deadline,page_timeout=180,idle_timeout=120):
    source,source_hash,destination,state,prefix=locations(project);state.mkdir(parents=True,exist_ok=True)
    progress=state/'progress.jsonl';doc=fitz.open(source);page_count=len(doc)
    for number in range(1,page_count+1):
        if time.monotonic()>deadline:raise TimeoutError('Overall 1200s export budget exceeded')
        log(progress,{'phase':'page-start','project':project,'page':number,'pages':page_count})
        with (state/f'page-{number:02d}-process.log').open('ab') as output:
            process=subprocess.Popen([sys.executable,'-u',str(Path(__file__).resolve()),'--project',project,'--page',str(number)],cwd=ROOT,stdout=output,stderr=subprocess.STDOUT)
            started=time.monotonic();last_progress=started;last_size=progress.stat().st_size
            try:
                while process.poll() is None:
                    now=time.monotonic();size=progress.stat().st_size
                    if size!=last_size:last_progress=now;last_size=size
                    if now>deadline:raise TimeoutError('Overall export timeout')
                    if now-started>page_timeout:raise TimeoutError(f'{project} page {number}: {page_timeout}s timeout')
                    if now-last_progress>idle_timeout:raise TimeoutError(f'{project} page {number}: no progress for {idle_timeout}s')
                    time.sleep(.5)
                if process.returncode:raise RuntimeError(f'{project} page {number}: child failed; see '+str(state/f'page-{number:02d}-process.log'))
            except BaseException:
                stop_process(process);raise
        log(progress,{'phase':'page-complete','project':project,'page':number,'seconds':round(time.monotonic()-started,2)})
    offset=0;all_segments=[];pages=[];records=[]
    for number,page in enumerate(doc,1):
        height,segments=blueprint(page,number,offset)
        pages.append({'number':number,'width':WIDTH,'height':height,'offset':offset,'sourceWidth':page.rect.width,'sourceHeight':page.rect.height})
        for segment in segments:
            record=json.loads((state/(segment['filename']+'.json')).read_text(encoding='utf8'))
            if not verified(record,destination/segment['filename'],segment,source_hash):raise ValueError('Final segment verification failed')
            all_segments.append({k:v for k,v in segment.items() if not k.startswith('local') and k!='filename'}|{'src':prefix+'/'+segment['filename']})
            records.append({'path':segment['filename'],'bytes':record['bytes'],'sha256':record['sha256'],'width':WIDTH,'height':segment['imageHeight']})
        offset+=height
    manifest={'schemaVersion':1,'kind':'continuous-webp','sha256':source_hash,'sourceUrl':'/assets/projects/'+project+'/project.pdf','spec':SPEC,'maxWidth':WIDTH,'totalHeight':offset,'pages':pages,'segments':all_segments,'resolutionPolicy':{'maxCssZoom':7680/WIDTH},'staticResources':{'complete':True,'files':len(records),'bytes':sum(r['bytes'] for r in records)}}
    atomic_json(destination/'resources.json',records);atomic_json(destination/'manifest.json',manifest)
    log(progress,{'phase':'project-complete','project':project,'images':len(records),'bytes':manifest['staticResources']['bytes'],'manifest':prefix+'/manifest.json'})
    doc.close();return manifest

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project',choices=['canvasflow-art-preview','fliggy-lele-run','lexin-health-app','both'],default='both');parser.add_argument('--page',type=int)
    args=parser.parse_args()
    if args.page:export_page(args.project,args.page);return
    started=time.monotonic();projects=['fliggy-lele-run','lexin-health-app'] if args.project=='both' else [args.project]
    try:
        for project in projects:run_project(project,started+1200)
    except BaseException as error:
        log(ROOT/'output/pdf-segments-export/errors.jsonl',{'phase':'failed','error':str(error),'elapsed':round(time.monotonic()-started,2)})
        raise
    print(json.dumps({'phase':'all-complete','elapsed':round(time.monotonic()-started,2)}),flush=True)

if __name__=='__main__':main()
