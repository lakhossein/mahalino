# V0.29 — AUDIT AND RESEARCH (Phase 1 Deliverable)

**Date:** 2026-11-08
**Baseline inspected:** `Mahalino/V0.28/Mahalino+V0.28.html` (13,756 lines, ~974KB) + `build_v028.js`
**Design reference inspected:** `Mahalino/V0.21/agentC-design-system.css` (1,421 lines) + full explorer HTML

---

## 1. Architecture Audit

### 1.1 Build model
- Each version is a **patch-codemod** over the previous version's HTML: `build_v028.js` reads `V0.27/Mahalino+V0.27.html` read-only and applies asserted string replacements (`rep(old,new,expect)` aborts unless an anchor matches exactly N times), then writes the new HTML and inlines Tabler SVGs from `assets/icons/`.
- **V0.29 recipe:** copy V0.28 → `V0.29/`, write `build_v029.js` with `SRC_FILE = V0.28/Mahalino+V0.28.html`, `OUT_FILE = V0.29/Mahalino+V0.29.html`. All `rep()` anchors must be taken from the **V0.28 output** (Persian strings). Large additions are injected as appended blocks (new CSS at the end of the style block, new JS as new version-layer modules before `</body>`).
- Version-layer module pattern already exists: `E21` (sessions/attachments/corrections), `E22` (theme/chat archive), `E23`–`E26` (toasts/guards), `E28` (chat UX/contract bubble/reminders). V0.29 adds `E29.*` namespaces.
- V0.28 remains untouched. V0.29 is an independent folder.

### 1.2 Data layer
- **Purely client-side.** Single localStorage key `mahalino_v18` holding entire state `S`; migration chain `mahalino_v18 → v16 → v15`.
- Key `S` fields: `auth, tokens, wallet, log (token ledger), wlog (wallet ledger), reqs, wfs (workflow instances), active, contracts, reviews, nprj (marketplace projects), ui, svcOrders, svcAudit, grt, grtAudit, grtReserve, sub, prof, reminders, chats (archived sessions), scratch`.
- Optional backend hooks are **null stubs** ("demo/local"). Real external calls: only geocoding (photon + nominatim). **No LLM API exists at runtime.**
- **V0.29 persistence plan:** bump key to `mahalino_v29` with migration from `mahalino_v18`. New collections: `S.notifs`, `S.library`, `S.projects`, `S.shares`, `S.persona` (progressive profile), plus linkage fields. All persisted in localStorage — durable locally, no cross-device sync (documented limitation).

### 1.3 Design system status
- V0.28 embeds one `<style>` block (lines 11–2604): tokens `:root` with teal brand `--brand:#0f766e`, dark theme via `[data-theme="dark"]` on `<html>`, RTL via `body{direction:rtl}` + logical properties.
- The V0.21 Agent C design system (`.ds-*` families — buttons, fields, cards, badges, modals, tabs, messages, sidebar, composer) is **present in V0.28 CSS as a dormant layer** (lines 1940–2216) but **no live DOM element uses it** — the live shell uses legacy `.app/.side/.view` classes. The `.ds-*` tokens were adapted to V0.28's palette.
- **Decision:** reuse live V0.28 component patterns (they ARE the shipped approved identity, used through V0.22–V0.28) and **extend with ds-style component classes where genuinely missing** (Library cards grid, tabs, notification list, share dialog, project groups) — styled with existing tokens (`--brand`, `--surface-2`, `--radius-*`, `--sh-*`, IRANSansX stack, RTL logical properties). No second visual identity is introduced.
- Typography note: the V0.21 CSS declares Yekan Bakh FaNum; the shipped V0.22–V0.28 app declares IRANSansX (woff2 bundled). We preserve the shipped app typography (IRANSansX) to avoid re-introducing a visual change; fonts are preserved in `V0.29/`.

---

## 2. Layout / Scrolling Audit

- App shell: `header.topbar` (~52px) → `main#main > .app#appwrap` grid `260px minmax(0,1fr)`, sidebar sticky, body `min-height:100vh` → **document-level scrolling on page views**.
- Chat view (landing): `.ch-main` `height:calc(100vh - 52px)` flex column; transcript `.ch-b{flex:1;overflow-y:auto}`; composer `.cwr` pinned. **Internal scrolling exists for the transcript.**
- The `min-height:640px` from the spec exists only inside the **dead `.ds-chat-app` layer** (`height:100dvh;min-height:640px`) — it affects nothing today.
- **V0.29 fix plan:** verify in real browser at multiple viewport sizes; enforce `html,body{height:100%;overflow:hidden}` only for the chat view context, keep document scroll for legacy page views only where the design expects it; ensure transcript/sidebar scroll independently with `min-height:0` chains and `overscroll-behavior:contain`; test mobile keyboard behavior with `100dvh`.

---

## 3. Conversational Engine Audit

- 100% deterministic scripted engine: `SCRIPTS` table (per-flow step arrays) driven by `ceStep/ceVal`; Persian parsers (`parseMoneyFA`, `parseCountFA`, `parseRangeFA`, `parseMoneyRangeFA`); chip buttons (`data-cf`, `data-cq`, `data-cba`), keyword jumps, correction support (`E21.corr`), session resume (`E21.maybeResume`), out-of-scope fallback with topic chips.
- Flow map: `gate` menu, `rent` (budget→priorities→neighborhoods→listings→visit→contract→termination), `buy` (budget→neighborhoods→listings→legal(paid)→escrow(paid)), `invb`/`invr` investments, `mkt` marketplace, `build` construction orders, `stay` accommodation, `grt` guaranteed rent, `svc` property services, contract engine with statuses and in-chat termination.
- **No runtime LLM.** Per spec §4.5: build an **extensible LLM adapter** (`E29.llm` — pluggable endpoint, disabled by default), implement researched scenarios in the deterministic engine, honest fallbacks. Research was performed with LLM agents (see §5); runtime capability is deterministic — clearly distinguished.

---

## 4. Token Economy Audit

- `COSTS = {detail:10, visit:20, valuation:40, legal:100, contract:0, escrow:150, bid:20, stay:30}`; `spend()/earn()`; wallet (rial) + `wlog`; token ledger `log`; subscriptions (پایه 1500 tokens, حرفه‌ای 4000, سازمانی 12000); welcome bonus 500 tokens.
- Gaps vs V0.29 spec: no pre-execution cost confirmation dialog (generic insufficient-funds modal only); no refund policy; no per-transaction ID linkage to outputs; no low-balance notification; contract drafting currently priced 0.
- **V0.29 plan:** centralized `E29.PRICING` (single source, mapped from existing COSTS + new services: detailed neighborhood analysis, contract draft generation, AI termination analysis); confirmation card before each paid execution; unique transaction IDs; refund-on-failure; duplicate-deduction guards; transactions linked to Library artifacts.

---

## 5. LLM Persona Research (in progress → delivered in `research/`)

Conducted by specialized LLM agents (Persona/Rental/Purchase/Sales/Owner/Neighborhood/Valuation/Investment/Contract/Termination/Payment), each simulating real multi-turn Persian conversations per Workflow × Persona with 3 experiments (success, incomplete/ambiguous, preference change). Outputs:

| File | Workstreams | Personas |
|---|---|---|
| `research/persona-rental-purchase.md` | Rental, Purchase | 16 |
| `research/persona-sales-owner.md` | Sales, Ownership | 12 |
| `research/persona-neighborhood-valuation-investment.md` | Neighborhood, Valuation, Investment | 18 |
| `research/persona-contract-termination-payment.md` | Contract, Termination, Payment | 17 |

Total: **63 personas × 3 transcripts**, each with persona definition, motivation, priorities, initial approach, ask/avoid questions, required/optional info field IDs, conditional questions, alternative paths, completion criteria, recovery scenarios, and `[decision point]` annotations for engine branching.

**Runtime honesty rule:** transcripts = research artifacts. The deterministic engine implements their decision points; the `E29.llm` adapter stays off unless a real endpoint is configured.

---

## 6. Feature Gap Matrix → V0.29 Workstreams

| Workstream | V0.28 status | V0.29 target |
|---|---|---|
| Adaptive conversational intelligence | Fixed scripted questionnaires, per-flow only | Natural adaptive questions, progressive profiling, persona coverage (63 personas), previous-info confirmation |
| Notifications | Toasts (E24) + browser notifications for reminders only | Event-based Notification Center: persistent store, categories, unread badge, deep links, dedup, preferences |
| Library | None | Auto-save all token-paid outputs; tabbed card grid; contract/report detail views; in-progress workflows; version history |
| Projects | Only marketplace "projects" (unrelated) | ChatGPT-style projects: groups of conversations + instructions + related library artifacts |
| Sidebar | Flat: fold, new chat, search, session list, footer (theme/wallet/account) | ChatGPT-style IA: primary actions, utilities (Library/Reminders/Notifications), Projects section, pinned/recent history, account area; identical New Chat/Search dimensions; icon-rail collapsed state with tooltips |
| Chat layout | Transcript internal scroll OK; document-level scroll contexts remain; `640px` dead min-height | Fixed viewport shell for chat; independent scroll areas; mobile keyboard handling |
| Sharing | None (share icon unused) | Preview → confirm → share snapshots (conversation/response/library artifact); snapshot store + revocation; honest fallback (no backend → snapshot export + in-app snapshot link) with documented limitation |
| Token economy | COSTS + spend() | Pricing config, pre-execution confirmation, transaction IDs, refunds, linkage to Library |
| Production text | Some technical/demo wording | Cleanup pass §13 |

## 7. Risks
1. Monolithic patch-chain build → mitigate with small unique anchors + appended blocks only.
2. localStorage growth (library artifacts) → cap + size guard + user-facing delete.
3. No backend → sharing uses in-app snapshots + export; no public secure links (documented per spec §12.7).
4. Persona engine complexity → matrix-driven table, deterministic scoring, chip-first UX.
