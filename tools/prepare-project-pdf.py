"""Prepare a real project PDF for normal document-flow reading, without a CDN.

Example: python tools/prepare-project-pdf.py --project-id lexin-health-app
    --source C:/path/portfolio.pdf --first 2 --last 16 --renderer C:/path/pdftoppm.exe
Only the selected chapter is copied; the source file is never changed.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from PIL import Image


def prepare(project_id, source, first, last, renderer, width=1600):
    allowed = {"canvasflow-art-preview", "aigc-design-efficiency", "fliggy-lele-run", "lexin-health-app"}
    if project_id not in allowed:
        raise ValueError("Unknown project id")
    root = Path(__file__).resolve().parent.parent
    directory = root / "assets" / "projects" / project_id
    directory.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(source))
    last = last or len(reader.pages)
    if not (1 <= first <= last <= len(reader.pages)):
        raise ValueError("Invalid chapter page range")
    writer = PdfWriter()
    for page in reader.pages[first - 1:last]:
        writer.add_page(page)
    pdf = directory / "project.pdf"
    with pdf.open("wb") as file:
        writer.write(file)
    pages = []
    with tempfile.TemporaryDirectory(prefix="portfolio-pdf-") as temporary:
        prefix = Path(temporary) / "page"
        subprocess.run([str(renderer), "-q", "-scale-to-x", str(width), "-scale-to-y", "-1", "-png", str(pdf), str(prefix)], check=True, capture_output=True)
        images = sorted(Path(temporary).glob("page-*.png"), key=lambda path: int(path.stem.split("-")[-1]))
        if len(images) != last - first + 1:
            raise ValueError("Incomplete PDF rasterization")
        for number, png in enumerate(images, 1):
            with Image.open(png) as image:
                image = image.convert("RGB")
                tiles = []
                for part, top in enumerate(range(0, image.height, 3072), 1):
                    tile = image.crop((0, top, image.width, min(top + 3072, image.height)))
                    filename = f"page-{number:02d}-{part:02d}.webp"
                    tile.save(directory / filename, "WEBP", quality=88, method=4)
                    tiles.append({"src": f"/assets/projects/{project_id}/{filename}", "width": tile.width, "height": tile.height})
                pages.append({"number": number, "sourcePage": first + number - 1, "width": image.width, "height": image.height, "tiles": tiles})
    (directory / "pages.json").write_text(json.dumps({"pages": pages}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{project_id}: {len(pages)} PDF pages, {sum(len(page['tiles']) for page in pages)} image tiles")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--first", type=int, default=1)
    parser.add_argument("--last", type=int)
    parser.add_argument("--renderer", type=Path, required=True)
    parser.add_argument("--width", type=int, default=1600)
    args = parser.parse_args()
    prepare(args.project_id, args.source, args.first, args.last, args.renderer, args.width)
