"""Reuse verified native 3200px WebP pages in the shared continuous reader.

No PDF replacement, resizing or image re-encoding. Retain pages.json for the
original document-flow reader and publish an additional continuous manifest.
"""
import argparse, hashlib, json, math
from pathlib import Path
import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def adapt(project):
    if project not in {'aigc-design-efficiency', 'fliggy-lele-run', 'lexin-health-app'}:
        raise ValueError('Unsupported native project')
    directory = ROOT / 'assets/projects' / project
    native = json.loads((directory / 'pages.json').read_text('utf8'))
    source_hash = hashlib.sha256((directory / 'project.pdf').read_bytes()).hexdigest()
    if source_hash != native['sourceSha256'] or native['renderWidth'] != 3200 or native['quality'] != 92:
        raise ValueError('Native source/version mismatch')
    doc = fitz.open(directory / 'project.pdf')
    if doc.is_encrypted or len(doc) != len(native['pages']):
        raise ValueError('Incomplete native document')
    resource_directory = (ROOT / native['pages'][0]['tiles'][0]['src'].lstrip('/')).parent
    records = json.loads((resource_directory / 'resources.json').read_text('utf8'))
    resource_map = {r['path']: r for r in records}
    pages, segments, used = [], [], set()
    offset = 0
    for number, (page, original) in enumerate(zip(native['pages'], doc), 1):
        if page['number'] != number or page['width'] != 3200 or abs(page['height'] - original.rect.height * 3200 / original.rect.width) > 1:
            raise ValueError('Page order/proportion mismatch')
        local = 0
        for part, tile in enumerate(page['tiles'], 1):
            image_path = ROOT / tile['src'].lstrip('/')
            if image_path.parent != resource_directory or not image_path.is_relative_to(directory):
                raise ValueError('Mixed resource versions')
            data = image_path.read_bytes(); record = resource_map[image_path.name]
            if len(data) != record['bytes'] or hashlib.sha256(data).hexdigest() != record['sha256']:
                raise ValueError('Image checksum mismatch')
            with Image.open(image_path) as image:
                image.load()
                if image.size != (tile['width'], tile['height']) or image.width != 3200 or not 0 < image.height <= 4096:
                    raise ValueError('Invalid image dimensions')
            segments.append({'page': number, 'part': part, 'width': 3200, 'height': tile['height'], 'top': offset + local, 'imageTop': offset + local, 'imageHeight': tile['height'], 'src': tile['src']})
            used.add(image_path.name); local += tile['height']
        if local != page['height']: raise ValueError('Page coverage incomplete')
        pages.append({'number': number, 'width': 3200, 'height': local, 'offset': offset, 'sourceWidth': original.rect.width, 'sourceHeight': original.rect.height})
        offset += local
    if used != set(resource_map): raise ValueError('Resource coverage mismatch')
    manifest = {'schemaVersion': 1, 'kind': 'continuous-webp', 'sha256': source_hash, 'sourceUrl': f'/assets/projects/{project}/project.pdf', 'spec': {'width': 3200, 'quality': 92, 'method': 4, 'maxHeight': 4096, 'bleed': 0, 'version': 'native-w3200-q92'}, 'maxWidth': 3200, 'totalHeight': offset, 'pages': pages, 'segments': segments, 'resolutionPolicy': {'maxCssZoom': 7680/3200}, 'staticResources': {'complete': True, 'files': len(records), 'bytes': sum(r['bytes'] for r in records)}, 'sourcePolicy': 'Reuse verified native images verbatim; no re-encoding.'}
    output = resource_directory / 'manifest.json'
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', 'utf8')
    doc.close()
    print(json.dumps({'project': project, 'pages': len(pages), 'images': len(segments), 'height': offset, 'sha256': source_hash, 'manifest': output.relative_to(ROOT).as_posix()}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--project-id', required=True)
    adapt(parser.parse_args().project_id)
