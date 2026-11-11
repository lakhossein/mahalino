# Mahalino V0.24 — Engineering Excellence Specification
**Input:** `Mahalino/V0.23/Mahalino+V0.23.html` · **Output:** `Mahalino/V0.24/Mahalino+V0.24.html`
**Dominant objective:** runtime reliability + measurable performance + dedupe, with ZERO behavior change. Unlike V0.21–V0.23 (additive engines), this release is in-place refactoring via assert-per-replacement build replacements on the V0.23 source. Every change must preserve byte-identical observable behavior except: performance (faster), honest error surfacing (new, additive), and the dedupe (no-op by definition).

## R1 — cr() visible-only rendering (measurable performance)
V0.23 `cr()` (find `function cr()`) renders HIST into ALL THREE bodies (`#chatB`, `#fchB`, `#dashB`) on EVERY call — each pass = full `HIST.map` string build + `innerHTML` set + `a11yify` + scroll. Triple DOM work per message.
- Patch: inside the bodies loop, skip a body when it is not currently rendered-visible (`!b.el.offsetParent` — hidden `.view`/`.fchw` parents make offsetParent null). The scroll-to-chart + a11yify logic stays per-rendered-el.
- Correctness argument (verify each before finalizing): `toggleF(true)` (floating open) calls `cr()` ✓; `renderCurrent()` (any view switch incl. dash) calls `cr()` ✓ — so a surface is always freshly rendered when it becomes visible. Landing chatB is visible only when `CURRENT==='landing'` — verify `go('landing')` → renderCurrent → cr() ordering (it is: views toggled on BEFORE cr? check `go()` — `.view.on` set before renderCurrent → yes).
- Risk check: `renderChatMeta()` runs after the loop regardless (unchanged). Any code reading `dashB.innerHTML` while hidden? (grep `dashB` usages — cr() is the only writer per spec §4; confirm).
- Evidence required: a stub-harness timing comparison (mock HIST ×40, run old vs new body-loop logic ×100, report ms medians) IN THE REPORT, plus my live before/after measurement at verification.

## R2 — findH dedupe
Two identical `function findH(id)` definitions (~2907, ~2912). Remove the SECOND one (function declarations hoist; identical bodies; single definition is behavior-identical). Anchor must include enough context to delete exactly one.

## R3 — save() honest failure surfacing
Current: `function save(){try{localStorage.setItem(LSKEY,JSON.stringify(S))}catch(e){}}` — silent failure (quota/private mode).
- Patch: on catch → `console.error` the failure + ONE rate-limited honest toast «ذخیره‌سازی محلی ناموفق بود؛ تغییرات تا بازنشانی صفحه در همین نشست اعمال است.» (rate-limit ≥15 s via a module var; toast() exists). Never throw upward (callers are everywhere).

## R4 — delegation error boundaries
The dispatch listener (find the big `document.addEventListener('click',...)` with `closest('[data-cv]')` etc.) invokes `ACT[...](el,e)` / `CBACT[...](el)` / `ceVal(...)` directly — one throwing handler aborts the rest of that click's dispatch chain and surfaces an uncaught error.
- Patch: wrap each handler-invocation branch in try/catch: on error → console.error(handler name + error) + rate-limited toast «یک خطای غیرمنتظره رخ داد؛ وضعیت شما ذخیره است.» Keep the branch/return structure IDENTICAL otherwise.
- Also add (new code, inserted with the engine-marker technique right before the boot marker) a `window.addEventListener('error')` handler → console.error + the same rate-limited toast (max once per 15 s; never for scripted test re-dispatch). No global state changes.

## R5 — boot state guards
At boot (find the boot section `═══ ۲۲) راه‌اندازی ═══` region — insert BEFORE it via the marker replacement like V0.21–V0.23 did): defensive init `S.ui=S.ui||{}; if(!S.chats)S.chats=[];` (V0.22 keys) + try/catch around JSON parse of loaded state? — locate where `S` is loaded from localStorage (block #1, 163 chars — read it; if parse already guarded, note it and only add the key guards). Keep tiny.

## R6 — build script
`Mahalino/V0.24/build_v024.js` — same assert-per-replacement pattern; input V0.23 html; output `Mahalino/V0.24/Mahalino+V0.24.html`; version marker replacement + R1–R5 replacements + marker-anchored new-code insertion. All replacement snippets INLINE in the build script (no separate engine file needed this cycle — the new code is small).

## Constraints
ZERO observable behavior change (except perf + additive honest error surfaces). No renames, no reformatting beyond the specific replacements, no new features, no CSS. LF/UTF-8; each replacement asserts occurrence count; `node --check` the built output? (build writes HTML — the orchestrator runs extract-js-check). The build script itself must be valid Node (test by dry logic — do NOT run the build; do not create the output file).
Deliverables: `build_v024.js` + honest report (R1–R5 status, stub evidence for R1 timing + correctness arguments, any deliberate skips). Under 50 lines.
