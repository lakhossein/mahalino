#!/usr/bin/env python3
"""Package archived V0.* prototypes as shareable GitHub Pages previews and ZIPs.

Original version folders are read-only inputs. Runtime/build dependency gates
for V0.30 and V0.31 are enforced by their separate GitHub Actions workflows.
"""
from __future__ import annotations

import argparse
import html
import re
import shutil
import tempfile
import json
import hashlib
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "build" / "pages"
VERSION_PATTERN = re.compile(r"V0\.(\d+)$")
EXCLUDED_DIRS = {"node_modules", "qa", "research", "screenshots", "__pycache__", ".git"}
EXCLUDED_FILES = {"desktop.ini", ".ds_store", "thumbs.db", "package.json", "package-lock.json"}


def versions() -> list[tuple[int, Path]]:
    found = []
    for folder in ROOT.iterdir():
        if folder.is_dir() and (match := VERSION_PATTERN.fullmatch(folder.name)):
            found.append((int(match.group(1)), folder))
    return sorted(found, reverse=True)


def entry_file(folder: Path) -> Path:
    usual = folder / f"Mahalino+{folder.name}.html"
    if usual.is_file():
        return usual
    candidates = list(folder.glob("Mahalino+*.html"))
    if len(candidates) == 1:
        return candidates[0]
    raise ValueError(f"Cannot select the version entry HTML in {folder}")


def exclude(directory: str, names: list[str]) -> set[str]:
    ignored = set()
    version_root = Path(directory).name
    retained_builder = {"V0.30": "build_v030.js", "V0.31": "build_v031.js", "V0.32": "build_v032.js", "V0.33": "build_v033.js"}.get(version_root)
    for name in names:
        path = Path(directory) / name
        lower = name.lower()
        if path.is_symlink():
            ignored.add(name)
        elif path.is_dir() and (lower in EXCLUDED_DIRS or lower.startswith(".")):
            ignored.add(name)
        elif path.is_file() and (
            lower in EXCLUDED_FILES
            or (lower.endswith((".md", ".ps1", ".cmd", ".log")) and not (retained_builder and lower == "readme.md"))
            or (lower.startswith("build_v0") and not (retained_builder and lower == retained_builder))
        ):
            ignored.add(name)
    return ignored


def create_zip(directory: Path, zip_path: Path) -> None:
    with ZipFile(zip_path, "w", ZIP_DEFLATED, compresslevel=8) as bundle:
        for file in sorted(directory.rglob("*")):
            if file.is_file():
                bundle.write(file, file.relative_to(directory).as_posix())


def version_card(number: int, is_latest: bool) -> str:
    slug = f"v0.{number}"
    badge = '<span class="latest">آخرین نسخه</span>' if is_latest else ""
    return (
        '<article class="version-card">'
        f'<div class="card-head"><h2 dir="ltr">Mahalino+ V0.{number}</h2>{badge}</div>'
        '<p>پیش‌نمایش تعاملی و نسخهٔ قابل دانلود</p><div class="actions">'
        f'<a class="view" href="./{html.escape(slug)}/">مشاهده نسخه</a>'
        f'<a class="download" href="./downloads/mahalino-{slug}.zip" download>دانلود ZIP</a>'
        '</div></article>'
    )


def populate(output: Path) -> list[int]:
    items = versions()
    if not items:
        raise RuntimeError("No V0.* directories found")
    # Only this exact generated directory is replaced; version archives are never changed.
    output.mkdir(parents=True, exist_ok=True)
    (output / ".nojekyll").touch()
    downloads = output / "downloads"
    downloads.mkdir()

    for number, folder in items:
        slug = f"v0.{number}"
        target = output / slug
        shutil.copytree(folder, target, ignore=exclude)
        shutil.copy2(entry_file(folder), target / "index.html")
        manifest = {"kind": "rebuildable-source" if number in (30, 31, 32, 33) else "runtime-archive",
                    "files": {p.relative_to(target).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                              for p in sorted(target.rglob("*")) if p.is_file()}}
        (target / "package-manifest.json").write_text(json.dumps(manifest, sort_keys=True), encoding="utf-8")
        create_zip(target, downloads / f"mahalino-{slug}.zip")

    template = (ROOT / "previews" / "index.template.html").read_text(encoding="utf-8")
    cards = "\n".join(version_card(number, i == 0) for i, (number, _) in enumerate(items))
    landing = template.replace("{{VERSION_CARDS}}", cards).replace("{{VERSION_COUNT}}", str(len(items)))
    (output / "index.html").write_text(landing, encoding="utf-8")
    return [number for number, _ in items]


def verify(numbers: list[int], output: Path | None = None) -> None:
    output = output or OUTPUT
    assert (output / "index.html").is_file()
    for number in numbers:
        slug = f"v0.{number}"
        html_file = output / slug / "index.html"
        zip_file = output / "downloads" / f"mahalino-{slug}.zip"
        assert html_file.is_file() and html_file.stat().st_size > 0
        assert zip_file.is_file() and zip_file.stat().st_size > 0
        with ZipFile(zip_file) as bundle:
            assert bundle.testzip() is None
            assert "index.html" in bundle.namelist()
            manifest = json.loads(bundle.read("package-manifest.json"))
            assert set(bundle.namelist()) == set(manifest["files"]) | {"package-manifest.json"}
            for name, digest in manifest["files"].items():
                assert hashlib.sha256(bundle.read(name)).hexdigest() == digest
            if number in (30, 31, 32, 33):
                assert f"build_v0{number}.js" in manifest["files"] and "README.md" in manifest["files"]
        class ResourceParser(HTMLParser):
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                value = attrs.get("src") if tag in ("script", "img") else attrs.get("href") if tag == "link" else None
                if not value or value.startswith(("#", "data:", "blob:", "//")) or urlsplit(value).scheme:
                    return
                relative = unquote(urlsplit(value).path)
                asset = (html_file.parent / relative).resolve()
                assert asset.is_relative_to(html_file.parent.resolve()) and asset.is_file() and asset.stat().st_size, value
        ResourceParser().feed(html_file.read_text(encoding="utf-8"))
    print(f"Verified {len(numbers)} HTML entry points and ZIP archives")


def build() -> list[int]:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".pages-stage-", dir=OUTPUT.parent))
    backup = OUTPUT.parent / ".pages-previous"
    try:
        numbers = populate(stage)
        verify(numbers, stage)
        if backup.exists():
            raise RuntimeError("Previous publication backup exists; inspect it before rebuilding")
        if OUTPUT.exists():
            OUTPUT.rename(backup)
        try:
            stage.rename(OUTPUT)
        except BaseException:
            if backup.exists():
                backup.rename(OUTPUT)
            raise
        if backup.exists():
            shutil.rmtree(backup)
        return numbers
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check generated entry points and ZIP integrity")
    arguments = parser.parse_args()
    numbers = build()
    if arguments.check:
        verify(numbers)
    print(f"Built {len(numbers)} previews in {OUTPUT}")


if __name__ == "__main__":
    main()
