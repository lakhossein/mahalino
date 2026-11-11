# Mahalino+ V0.30 — development and release

V0.30 remains the current version number. Changes to its source modules must be
reflected in the generated `Mahalino+V0.30.html` by running:

```sh
node V0.30/build_v030.js
```

The builder uses the predecessor file in `V0.29/` when the full repository is
available; a standalone V0.30 package can use the identical bundled snapshot
in `V0.30/base/`. The complete `assets/` folder and the two IRANSansX fallback
fonts must accompany the HTML. `node_modules/` is **not** a release asset.

## Mandatory acceptance gate

```sh
npm ci --prefix V0.30/qa
V0.30/qa/node_modules/.bin/playwright install --with-deps chromium
bash V0.30/qa/run-quality-gate.sh
```

The gate verifies syntax, reproducibility, required resources, release-coverage
mapping, real Chromium smoke/functional/conversational/regression/acceptance
tests, and their failure handling. **Never interpret skipped, missing, or
inconclusive checks as passes.** Every suite and the coverage gate must exit 0
before this version can be published. The GitHub Pages workflow depends on the
same gate; use the `Browser acceptance and reproducible build` check as a
required status check in GitHub branch protection/rulesets to also block merges.

## Scope and security limitations

This is a **demonstration**, not a production real-estate transaction service:

- Authentication, one-time passwords, balances, signatures and stored records
  are simulations in browser-local storage. A shared browser is not a secure
  multi-user environment. Do not enter real identity or payment data.
- Example listing/market metrics are not independently verified current prices.
- Some guided requests stop at explicitly labelled drafts because the backend
  for official registration, identity verification, document analysis, or
  provider fulfilment is not present.
- With explicit consent, optional postcode/identity lookups can send the
  supplied value to a configured endpoint or an external geocoding service.
- A successful **demo quality gate** cannot certify production-grade identity,
  authorization, payment settlement, or legally binding contracts. Those need
  real services and a separate production acceptance process.

Do not overwrite or discard old versions when updating V0.30. Preserve the
audit evidence and test output in the GitHub Actions artifacts.
