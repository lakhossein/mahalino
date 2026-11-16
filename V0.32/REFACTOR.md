# V0.32 refactor record

Baseline: `353b8de20902f1f64977f022c8aff8bd2557354c`.
V0.31 tree: `220389ed276bcc7069b5aa69a1c36d2405438873`.

## Removed debt
- No dependency on a 1 MB historical V0.29 base or a 29 KB string-patch builder.
- 32 named legacy source sections replace an opaque inline application block.
- Explicit include manifest preserves the original script scope and execution order.
- Source text matches final display terminology; no global currency/credit rewrite.
- Pure assembler rejects missing, duplicate, cyclic, unused and malformed includes.
- Build validates generated script syntax before overwriting the output.
- --check verifies artifact freshness without modifying it.
- Independent V0.32 QA paths and state key, with read-only V0.31 migration.

## Behavioral boundary
The parity test compares every character of the complete generated HTML after
an explicit identity/migration allow-list. No feature, data set, CSS selector,
event handler, pricing rule, public runtime identifier or workflow is redesigned.
Binary assets reuse the original Git blobs.

## Remaining architecture
Global runtime state, historical wrappers and legacy CSS remain intentionally
compatible. Splitting those execution contracts or removing apparently redundant
overrides requires separate behavior-focused changes. No runtime speedup is claimed.

## Validation
Run `bash V0.32/qa/run-quality-gate.sh` for the full result. New checks cover
assembler errors, literal injection, syntax, complete artifact parity and storage
selection. Existing browser suites and coverage thresholds are retained.
