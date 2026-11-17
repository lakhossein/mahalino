# Mahalino+

Versioned archives and shareable previews of the Mahalino+ real-estate assistant.

## Preview and download

The public gallery is intended to be available at **https://lakhossein.github.io/mahalino/** after GitHub Pages is enabled under **Settings → Pages → Build and deployment → Source: GitHub Actions** and the first deployment succeeds.

Each version has a direct preview link and a downloadable ZIP, for example:

- [V0.32 preview](https://lakhossein.github.io/mahalino/v0.32/) — active release
- [V0.31 preview](https://lakhossein.github.io/mahalino/v0.31/)
- [V0.30 preview](https://lakhossein.github.io/mahalino/v0.30/)
- [V0.29 preview](https://lakhossein.github.io/mahalino/v0.29/)
- [V0.28 preview](https://lakhossein.github.io/mahalino/v0.28/)

Extract a version ZIP, then open `index.html` locally. Network-dependent features, if any, may require connectivity.

## Structure

| Path | Purpose |
| --- | --- |
| `V0.1/` ... `V0.31/` | Historical version archives |
| `V0.32/` | Active independent release; source, deterministic builder and QA |
| `docs/Mahalino_Remediation_Plan_FA.md` | Audit remediation plan and validation limits |
| `previews/index.template.html` | Gallery page source |
| `scripts/build_previews.py` | Builds browser previews and ZIP downloads |
| `.github/workflows/pages.yml` | Automated publication from `main` |
| `build/pages/` | Generated output; never committed |

## Local preview

Python 3 is sufficient to package the checked-in HTML:

```bash
python3 scripts/build_previews.py --check
python3 -m http.server 8000 --directory build/pages
```

Open `http://localhost:8000`. The generator never modifies archived versions. Source packages for V0.30–V0.32 include their builder and README, and every ZIP has a verified file manifest. Packaging stages and verifies the complete gallery before replacing previous output. It omits development dependencies, QA fixtures, research notes, screenshots, Windows metadata files and build scripts from the public distribution while retaining runtime assets and source paths. See [runtime and archive contracts](docs/Mahalino_Runtime_Contracts_FA.md).

For a new release add a folder named `V0.NN` with the main `Mahalino+V0.NN.html` and its assets. A push to `main` triggers an updated gallery, direct URL and downloadable ZIP. The build validates packaging and entry-point presence, **not** the functionality of all scenarios; V0.30, V0.31 and V0.32 each have required Chromium/browser/build quality gates before Pages publication. Pull requests run validation without deploying. Audit-row coverage is distinct from source line/branch coverage.

## Active V0.32 build and tests

Use Node.js 24 for source assembly and QA:

```bash
node V0.32/build_v032.js
node V0.32/build_v032.js --check
npm ci --prefix V0.32/qa
V0.32/qa/node_modules/.bin/playwright install --with-deps chromium
bash V0.32/qa/run-quality-gate.sh
```

See [V0.32 instructions](V0.32/README.md) and the [remediation plan](docs/Mahalino_Remediation_Plan_FA.md). Runtime uses `mahalino_v32`; predecessor data is read only for migration. The explicit reset clears only V0.32 and leaves an empty current-version state so earlier data is not imported again. Shared, unversioned preferences and databases remain intact.

## V0.31 migration

The V0.30 directory has been restored byte-for-byte to the tree preceding commit `179a6d4`. The guided-UI change is maintained exclusively in self-contained `V0.31/`, with its own HTML, bundled base, build script, fonts/Leaflet assets, source and QA. For rebuild: `node V0.31/build_v031.js`. For testing: `bash V0.31/qa/run-quality-gate.sh` after `npm ci --prefix V0.31/qa` and installing Playwright Chromium.
