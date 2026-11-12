# Mahalino+

Versioned archives and shareable previews of the Mahalino+ real-estate assistant.

## Preview and download

The public gallery is intended to be available at **https://lakhossein.github.io/mahalino/** after GitHub Pages is enabled under **Settings → Pages → Build and deployment → Source: GitHub Actions** and the first deployment succeeds.

Each version has a direct preview link and a downloadable ZIP, for example:

- [V0.31 preview](https://lakhossein.github.io/mahalino/v0.31/)
- [V0.30 preview](https://lakhossein.github.io/mahalino/v0.30/)
- [V0.29 preview](https://lakhossein.github.io/mahalino/v0.29/)
- [V0.28 preview](https://lakhossein.github.io/mahalino/v0.28/)

Extract a version ZIP, then open `index.html` locally. Network-dependent features, if any, may require connectivity.

## Structure

| Path | Purpose |
| --- | --- |
| `V0.1/` ... `V0.31/` | Unchanged original version archives |
| `previews/index.template.html` | Gallery page source |
| `scripts/build_previews.py` | Builds browser previews and ZIP downloads |
| `.github/workflows/pages.yml` | Automated publication from `main` |
| `build/pages/` | Generated output; never committed |

## Local preview

Python 3 is the only build dependency:

```bash
python3 scripts/build_previews.py --check
python3 -m http.server 8000 --directory build/pages
```

Open `http://localhost:8000`. The generator never modifies archived versions. It omits development dependencies, QA fixtures, research notes, screenshots, Windows metadata files and build scripts from the public distribution while retaining runtime assets and source paths.

For a new release add a folder named `V0.NN` with the main `Mahalino+V0.NN.html` and its assets. A push to `main` triggers an updated gallery, direct URL and downloadable ZIP. The build validates packaging and entry-point presence, **not** the functionality of all scenarios; V0.30 and V0.31 have separate required Chromium/browser/build quality gates before Pages publication.

## V0.31 migration

The V0.30 directory has been restored byte-for-byte to the tree preceding commit `179a6d4`. The guided-UI change is maintained exclusively in self-contained `V0.31/`, with its own HTML, bundled base, build script, fonts/Leaflet assets, source and QA. For rebuild: `node V0.31/build_v031.js`. For testing: `bash V0.31/qa/run-quality-gate.sh` after `npm ci --prefix V0.31/qa` and installing Playwright Chromium.
