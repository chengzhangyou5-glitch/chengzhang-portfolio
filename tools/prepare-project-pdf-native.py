"""Keep the existing native document-flow reader, replacing its source verbatim.

Render 3200px-wide Q92 WebP strips, with no overlapping pixels, from every PDF
page. Publish pages.json only after all images verify; keep prior PDF/manifest.
Dependencies: PyMuPDF and Pillow.
"""
from pathlib import Path
import argparse, hashlib, json, math, shutil
import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {'aigc-design-efficiency', 'fliggy-lele-run', 'lexin-health-app'}

def prepare(project_id, source, width=3200, quality=92):
    if project_id not in ALLOWED: raise ValueError('Unknown project')
    source = source.resolve()
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    directory = ROOT / 'assets/projects' / project_id
    images = directory / 'reader' / f'native-w{width}-q{quality}' / source_hash
    images.mkdir(parents=True, exist_ok=True)
    document = fitz.open(source)
    if document.is_encrypted or not len(document): raise ValueError('PDF is encrypted or empty')
    fitz.TOOLS.set_aa_level(8)
    pages, resources = [], []
    for number, page in enumerate(document, 1):
        scale = width / page.rect.width
        raster = page.get_displaylist().get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
        image = Image.frombytes('RGB', (raster.width, raster.height), raster.samples)
        if image.width != width: raise ValueError('Unexpected page width')
        tiles = []
        for part, top in enumerate(range(0, image.height, 4096), 1):
            tile = image.crop((0, top, width, min(top + 4096, image.height)))
            path = images / f'page-{number:02d}-{part:02d}.webp'
            tile.save(path, 'WEBP', quality=quality, method=4)
            with Image.open(path) as check:
                check.load()
                if check.size != tile.size: raise ValueError('Image verification failed')
            tiles.append({'src': '/' + path.relative_to(ROOT).as_posix(), 'width': tile.width, 'height': tile.height})
            resources.append({'path': path.name, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
            print(f'{project_id}: page {number}/{len(document)}, segment {part}', flush=True)
        if sum(tile['height'] for tile in tiles) != image.height: raise ValueError('Page coverage incomplete')
        pages.append({'number': number, 'sourcePage': number, 'width': image.width, 'height': image.height, 'tiles': tiles})
        image.close()
    backup = ROOT / 'output/pdf' / f'{project_id}-replacement' / 'previous'
    backup.mkdir(parents=True, exist_ok=True)
    for name in ['project.pdf', 'pages.json']:
        old = directory / name
        if old.exists() and not (backup / name).exists(): shutil.copyfile(old, backup / name)
    manifest = {'sourceSha256': source_hash, 'sourceFile': str(source), 'renderWidth': width, 'quality': quality, 'pages': pages}
    (images / 'resources.json').write_text(json.dumps(resources, indent=2), 'utf8')
    pdf_tmp = directory / 'project.new.pdf'; shutil.copyfile(source, pdf_tmp)
    if hashlib.sha256(pdf_tmp.read_bytes()).hexdigest() != source_hash: raise ValueError('Copied PDF differs from source')
    pages_tmp = directory / 'pages.new.json'; pages_tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), 'utf8')
    pdf_tmp.replace(directory / 'project.pdf'); pages_tmp.replace(directory / 'pages.json')
    document.close()
    print(json.dumps({'project': project_id, 'pages': len(pages), 'segments': len(resources), 'sha256': source_hash, 'bytes': source.stat().st_size}), flush=True)
    return manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-id', required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--width', type=int, default=3200)
    parser.add_argument('--quality', type=int, default=92)
    args = parser.parse_args()
    prepare(args.project_id, args.source, args.width, args.quality)
