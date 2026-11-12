# V0.31 release acceptance gate

The HTML preview is an interactive demonstration. The quality gate covers its
actual JavaScript and browser behavior, not a hypothetical production backend.
An external API, official contract registry, cross-device share service, or live
payment processor cannot be certified by browser tests against this static HTML.

## Run locally

From the repository root:

```bash
npm ci --prefix V0.31/qa
V0.31/qa/node_modules/.bin/playwright install chromium
bash V0.31/qa/run-quality-gate.sh
```

The script checks JS syntax, reproducible build output, starts an HTTP server,
executes every browser suite, and returns nonzero if **any** suite fails. Logs,
screenshots, and structured JSON are saved to `V0.31/qa/results/`.

## Suites and intended scope

| Suite | Coverage |
|---|---|
| `smoke-v031.js` | Initial boot, guest landing, selected payments, sidebar, flow continuity |
| `e2e-functional.js` | Rental, visits, contracts, paid neighborhood analysis, library, projects, reminders, buy/sell/investment paths |
| `e2e-conversational.js` | Imperfect Persian phrasing, multi-fact messages, contradictions, skips, persona changes, handoff |
| `v031-browser-regressions.cjs` | Currency range, hard floor filter, callback-only paid service, asset HTTP status, five viewport widths, keyboard Enter, duplicated landing header |
| `e2e-acceptance-v031.cjs` | Unit boundaries, rental hard filters, total purchase budget, 10 paid + 2 explicitly free demonstrations, idempotent/cancellable/refundable payments, persisted state, listing/chat provenance, landlord/investment/seller variants, contract status |
| `e2e-scenarios-v031.cjs` | Stateful long conversation and report shares, standalone export, print/PDF, reload+resume, interrupted real debit, committed sliders, active+archived projects, termination status |
| `e2e-full-journeys-v031.cjs` | Continuous rental discovery through visit/contract/termination; purchase contract/escrow/delivery; seller agreement/contract/status; personalized investment/save/tracking; all ten paid tariffs; PDF file sharing; Browser-operated UI: free-form and recurring reminder creation/edit/complete/reload; project+archived chat; Library workflow resume across categories; money-slider commit, Back/edit and historical lock; full in-chat contract, 60-Bana confirmation and termination through settlement; native PDF print; hard-vs-soft ranking; interactive in-chat Leaflet map |

All tests run in real Chromium, without mocking the application code. H18 stubs only the operating-system Web Share boundary and verifies the actual selected PDF bytes, cancellation and unsupported-browser fallback. H17 exercises the common payment engine for every paid tariff with synthetic delivery callbacks; domain journeys separately verify delivered artifacts and requests. Assertions
must check actual effects; the previous false-negative `C.2` expected 2 billion
**rials** after the user stated 2 billion **tomans**, and is corrected.

The machine-readable traceability matrix is `coverage-v031.json`. The release
script executes `check-coverage.cjs` after the browser suites. It refuses a
release if **any** of the 25 mandatory §19.1 scenarios remains `partial` or
`missing`, has no executable assertion, or its mapped assertions have failed.
The matrix maps all 25 requirements to executable assertions. Missing evidence or a failed assertion still blocks release.

## Publication protection

- `.github/workflows/mahalino-v031-quality-gate.yml` runs on relevant PRs,
  pushes and manual dispatch.
- `.github/workflows/pages.yml` depends on that reusable gate. If **one**
  assertion fails, the Pages deployment is skipped.
- To prevent untested changes from being merged or directly pushed to `main`,
  a repository administrator must configure a GitHub **Ruleset** (or branch
  protection): require the status check named **Browser acceptance and
  reproducible build**, require PR review, and disable bypass for the target
  branch. This cannot be guaranteed by a YAML file alone.
- Keep user data, secrets, authentication cookies and real transactions out of
  test fixtures. The static demonstration uses synthetic data.

## Coverage boundary

The historical §19 list has 25 requested scenarios; these suites expand coverage
substantially but **assertion count is not coverage percentage**. In particular,
official Iranian registries, actual PSP charging, document signature validity,
external share links, live market data and cross-device identity are external
integrations not present in this static artifact. A release needs separate
integration tests once those services exist. Individual assertions that fail
must be fixed in the product or in an objectively incorrect test expectation;
do not change them merely to obtain a green check.
