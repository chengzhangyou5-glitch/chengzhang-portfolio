"""Bounded, cached image derivatives; originals and SVG composition stay intact.

Contact input is a transparent browser render of each complete SVG at 3x.
Photos are read directly from the existing manifest. No PDF assets are touched.
"""
import argparse
import concurrent.futures
import hashlib
import json
import time
import os
import threading
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CONTACT = {'yellow-rays': 118, 'white-rays': 110, 'eyes': 60, 'curved-arrow': 100, 'blue-star': 60}
VERSION = 'display-webp-v1'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def derivative(source, destination, width, *, lossless, quality=92, method=6):
    destination.parent.mkdir(parents=True, exist_ok=True)
    signature = {'source': digest(source), 'width': width, 'lossless': lossless, 'quality': quality, 'version': VERSION}
    if method != 6:
        signature['encoderMethod'] = method
    stamp = destination.with_suffix('.webp.cache.json')
    if destination.exists() and stamp.exists():
        cached = json.loads(stamp.read_text('utf-8'))
        if cached.get('input') == signature and cached.get('output') == digest(destination):
            with Image.open(destination) as image:
                image.verify()
            return
    with Image.open(source) as image:
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        width = min(width, image.width)
        height = max(1, round(image.height * width / image.width))
        if image.size != (width, height):
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        temporary = destination.with_suffix('.webp.tmp')
        image.save(temporary, format='WEBP', lossless=lossless, quality=quality, method=method, exact=True)
    with Image.open(temporary) as image:
        image.verify()
    temporary.replace(destination)
    stamp.write_text(json.dumps({'input': signature, 'output': digest(destination)}), 'utf-8')

def photo(image):
    source = ROOT / image['src'].lstrip('/')
    variants = []
    with Image.open(source) as bitmap:
        native_width, native_height = bitmap.size
    covers = image['src'].startswith('/assets/works/')
    cover_max = min(native_width, image.get('maxWidth', native_width))
    widths = sorted(set(min(native_width, edge if covers else round(edge * native_width / max(native_width, native_height))) for edge in ((640, 1024, cover_max) if covers else (480, 768, 1024))))
    for width in widths:
        target = ROOT / ('assets/works/optimized' if covers else 'assets/personal-world/optimized') / f"{image['id']}-{width}w.webp"
        derivative(source, target, width, lossless=covers and width == native_width, method=4 if covers else 6)
        with Image.open(target) as bitmap:
            variants.append({'src': '/' + target.relative_to(ROOT).as_posix(), 'width': bitmap.width, 'height': bitmap.height, 'bytes': target.stat().st_size})
    return image['id'], {'sourceSha256': digest(source), 'variants': variants}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=['contact', 'world', 'covers'])
    parser.add_argument('--contact-renders', type=Path, default=ROOT / 'output/playwright/performance-optimization')
    args = parser.parse_args()
    started = time.monotonic()
    def deadline():
        print('ERROR: image export exceeded 210 seconds; exiting with cached resources intact.', flush=True)
        os._exit(124)
    guard = threading.Timer(210, deadline)
    guard.daemon = True
    guard.start()
    if args.stage == 'contact':
        result = {}
        prior_path = ROOT / 'assets/contact/decor/optimized/manifest.json'
        prior = json.loads(prior_path.read_text('utf-8')) if prior_path.exists() else {}
        for name, width in CONTACT.items():
            source = args.contact_renders / f'{name}-3x.png'
            svg_hash = digest(ROOT / 'assets/contact/decor' / f'{name}.svg')
            receipt = prior.get(name)
            if receipt and receipt['sourceSha256'] != svg_hash and receipt['renderSha256'] == digest(source):
                raise ValueError(f'{name}: SVG changed; render the complete current SVG before reusing its raster input.')
            # Never extract the embedded PNG: preserve the SVG crop/matrices.
            for scale in (1, 2, 3):
                target = ROOT / 'assets/contact/decor/optimized' / f'{name}-{scale}x.webp'
                derivative(source, target, width * scale, lossless=True)
            result[name] = {'sourceSha256': digest(ROOT / 'assets/contact/decor' / f'{name}.svg'), 'renderSha256': digest(source), 'baseWidth': width}
            print(f'contact {name}: complete', flush=True)
        destination = ROOT / 'assets/contact/decor/optimized/manifest.json'
    else:
        if args.stage == 'world':
            groups = json.loads((ROOT / 'assets/personal-world/content.json').read_text('utf-8-sig'))
            images = [image for group in groups for topic in group['topics'] for image in topic['images']]
        else:
            images = [{'id': name, 'src': f'/assets/works/{name}.png'} for name in ('canvasflow-preview', 'aigc-efficiency', 'fliggy-lele-run', 'lexin-health-app')]
            if (ROOT / 'assets/works/canvasflow-vibe-coding.png').exists():
                images.append({'id': 'canvasflow-vibe-coding', 'src': '/assets/works/canvasflow-vibe-coding.png', 'maxWidth': 1440})
        result = {}
        # Two workers bound memory; progress and a hard deadline prevent silent hangs.
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            pending = {pool.submit(photo, image): image['id'] for image in images}
            for future in concurrent.futures.as_completed(pending, timeout=180):
                key, value = future.result()
                result[key] = value
                print(f'{args.stage} {len(result)}/{len(images)} {key}', flush=True)
                if time.monotonic() - started > 180:
                    raise TimeoutError('Image export exceeded 180 seconds; completed resources are cached.')
        destination = ROOT / ('assets/personal-world/optimized.json' if args.stage == 'world' else 'assets/works/optimized.json')
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2), 'utf-8')
    print(json.dumps({'stage': args.stage, 'elapsedSeconds': round(time.monotonic()-started, 2), 'items': len(result)}), flush=True)
    guard.cancel()

if __name__ == '__main__':
    if os.environ.get('PORTFOLIO_IMAGE_WORKER_CHILD') == '1':
        main()
    else:
        # An external process deadline also covers a native encoder holding the GIL.
        try:
            worker = subprocess.run([sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]],
                env={**os.environ, 'PORTFOLIO_IMAGE_WORKER_CHILD': '1'}, timeout=215)
            raise SystemExit(worker.returncode)
        except subprocess.TimeoutExpired:
            print('ERROR: external 215s deadline reached; worker stopped, completed cache retained.', flush=True)
            raise SystemExit(124)
