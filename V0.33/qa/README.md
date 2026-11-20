# V0.33 release acceptance gate

The HTML preview is an interactive demonstration. The quality gate covers its
actual JavaScript and browser behavior, not a hypothetical production backend.
An external API, official contract registry, cross-device share service, or live
payment processor cannot be certified by browser tests against this static HTML.

## Run locally

From the repository root:

```bash
npm ci --prefix V0.33/qa
V0.33/qa/node_modules/.bin/playwright install chromium
bash V0.33/qa/run-quality-gate.sh
```

The script checks JS syntax, reproducible build output, starts an HTTP server,
executes every browser suite, and returns nonzero if **any** suite fails. Logs,
screenshots, and structured JSON are saved to `V0.33/qa/results/`.

## Runtime contract review

V0.32 retains `docs/validation/runtime-dependencies.json` as its reviewed
snapshot. V0.33 reconstructs its own reviewed inventory from that unchanged
snapshot plus `V0.33/qa/fixtures/runtime-dependencies-delta.json`, then compares
the complete inventory (including module slots/files, imports with owners,
exports, writes, includes and load order) for exact equality.

Run `node V0.33/qa/runtime-contracts.cjs --review-delta` to inspect any drift
relative to the reviewed V0.33 inventory. Empty `modules` means no dependency
drift. The command only reports; updating the fixture requires manual review.

## Suites and intended scope

| Suite | Coverage |
|---|---|
| `smoke-v032.js` | Initial boot, guest landing, selected payments, sidebar, flow continuity |
| `e2e-functional.js` | Rental, visits, contracts, paid neighborhood analysis, library, projects, reminders, buy/sell/investment paths |
| `e2e-conversational.js` | Imperfect Persian phrasing, multi-fact messages, contradictions, skips, persona changes, handoff |
| `v032-browser-regressions.cjs` | Currency range, hard floor filter, callback-only paid service, asset HTTP status, five viewport widths, keyboard Enter, duplicated landing header |
| `e2e-acceptance-v032.cjs` | Unit boundaries, rental hard filters, total purchase budget, 10 paid + 2 explicitly free demonstrations, idempotent/cancellable/refundable payments, persisted state, listing/chat provenance, landlord/investment/seller variants, contract status |
| `e2e-scenarios-v032.cjs` | Stateful long conversation and report shares, standalone export, print/PDF, reload+resume, interrupted real debit, committed sliders, active+archived projects, termination status |
| `e2e-deterministic-guidance-v032.cjs` | Rule-only scenario prompts: user-confirmed prefill, parser handoff, context preservation, in-chat service actions, valuation credit safety and empty-state honesty |
| `check-guidance.cjs` | Machine-readable checks of 25 preview registry entries, normalized phrase uniqueness and valid action transitions |
| `e2e-full-journeys-v032.cjs` | Continuous rental discovery through visit/contract/termination; purchase contract/escrow/delivery; seller agreement/contract/status; personalized investment/save/tracking; all ten paid tariffs; PDF file sharing; Browser-operated UI: free-form and recurring reminder creation/edit/complete/reload; project+archived chat; Library workflow resume across categories; money-slider commit, Back/edit and historical lock; full in-chat contract, 60-Bana confirmation and termination through settlement; native PDF print; hard-vs-soft ranking; interactive in-chat Leaflet map |

| `e2e-emptying-slider.cjs` | Physical before/after slider endpoints, captions, keyboard and pointer behavior |
| `e2e-criteria-v033.cjs` | Continue with current rent/buy criteria and zero-result criterion edits |
| `e2e-library-controls.cjs` | Library artifact controls, account settings navigation and sharing behavior |
| `e2e-independent-services-v033.cjs` | Independent service directory, contract creation/tours and workflow isolation |

All tests run in real Chromium, without mocking the application code. H18 stubs only the operating-system Web Share boundary and verifies the actual selected PDF bytes, cancellation and unsupported-browser fallback. H17 exercises the common payment engine for every paid tariff with synthetic delivery callbacks; domain journeys separately verify delivered artifacts and requests. Assertions
must check actual effects; the previous false-negative `C.2` expected 2 billion
**rials** after the user stated 2 billion **tomans**, and is corrected.

The machine-readable traceability matrix is `coverage-v032.json`. The release
script executes `check-coverage.cjs` after the browser suites. It refuses a
release if **any** of the 25 mandatory §19.1 scenarios remains `partial` or
`missing`, has no executable assertion, or its mapped assertions have failed.
The matrix maps all 25 requirements to executable assertions. Missing evidence or a failed assertion still blocks release.

## Publication protection

- `.github/workflows/mahalino-v032-quality-gate.yml` runs on relevant PRs,
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

## Independent priority audit coverage (§7/§8)

`priority-audit-coverage-v032.json` enumerates all 125 current §7 rows and
25 §8 scenarios. The merged rental budget retains both legacy IDs; the new
rental persona and all 13 retired invb/invr rows are included. This supplements
the historical 25-requirement `coverage-v032.json` and its existing checker.

The inventory starts **unverified**. Source handler references and target
transitions are contracts to verify, not claims of runtime coverage.
The extended release gate intentionally fails until assertion-bearing UI
evidence is mapped. Do not mark rows automated merely because older suites pass.

Run the validator's isolated fixtures with:
`node --test V0.33/qa/check-priority-audit.test.cjs`.
These fixtures are never browser coverage and never go into the evidence report.

Browser harnesses must write `$QA_RESULTS_DIR/priority-audit-evidence.json`:
```json
{
  "schemaVersion": 1,
  "revision": "<GITHUB_SHA or actual tested git HEAD>",
  "tests": [{
    "id": "<unique actual browser test ID>",
    "result": "PASS",
    "surface": "browser-ui",
    "covers": ["scenario:rent"],
    "phases": ["visible", "hidden", "composer-prefill", "composer-send", "success", "empty-data", "cancel", "resume"],
    "assertions": [{"name": "<actual asserted behavior>", "pass": true}],
    "trace": [{"state": "<observed state>", "action": "<actual UI input>", "next_state": "<observed next state>"}]
  }]
}
```

Each mapped test must pass, include passing assertions and observed transitions,
and explicitly cover the row. Use `step:<flow>:<legacy_step_id>` for steps and
`scenario:<scenario_id>` for scenarios. IDs are namespaced; test counts and
the guide registry's historical test labels are not sufficient evidence.

Required phases:
- Optional needs: answer, skip, edit, service-terminal, reload.
- Service/gate rows: success, empty-data, cancel, resume.
- Retired rows: route-absent plus a documented retirement reason.
- Scenarios: visible, hidden, composer-prefill, composer-send, success,
  empty-data, cancel, resume.

Assertions can span several browser tests mapped to the same row. Missing data
may end in an explicit missing prerequisite or stated inability; it may not
substitute for the successful path with suitable data. Clicking a prompt must
only prefill the composer; send it explicitly before asserting handler effects.
Reports from another revision, missing tests, duplicate evidence IDs, VM-only
checks, failed assertions and incomplete traces all block approval.

The checker writes `priority-audit-results.json` with per-row gaps, returns
nonzero on any gap, and is included in `run-quality-gate.sh` after the existing
§19.1 checker. Existing browser suites still run before the extended gate.
