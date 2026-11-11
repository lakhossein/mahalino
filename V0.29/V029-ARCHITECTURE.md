# V0.29 — ARCHITECTURE (Phase 2 Deliverable)

**Base:** `Mahalino/V0.28/Mahalino+V0.28.html` (frozen, untouched)
**Build:** `build_v029.js` codemod → `Mahalino/V0.29/Mahalino+V0.29.html`
**Additions live in editable source files** injected at build time:

```
V0.29/
├── build_v029.js            # codemod: rep() surgical patches + block injection
├── src/v29.css              # new component styles (appended to <style>)
├── src/v29-core.js          # state, event bus, pricing, LLM adapter, helpers (E29)
├── src/v29-intel.js         # adaptive conversational engine + progressive profiling
├── src/v29-notifs.js        # notification service + center UI
├── src/v29-library.js       # library store, auto-save, tabs/cards, details
├── src/v29-projects.js      # projects + sidebar integration
├── src/v29-share.js         # sharing dialog, snapshots, revocation, export
├── src/v29-shell.js         # sidebar redesign + layout fixes + wiring/init
└── research/*.md            # LLM persona research transcripts (Phase 1)
```

## 1. Version layering
V0.29 continues the E-layer convention: all new code in namespace `E29` (modules: `E29.core`, `E29.intel`, `E29.notifs`, `E29.lib`, `E29.proj`, `E29.share`, `E29.shell`, `E29.pay`). Existing E21–E28 layers and the deterministic engine remain untouched except for documented, asserted `rep()` patches (sidebar renderer, state defaults, init, LSKEY, version markers).

## 2. State model (localStorage `mahalino_v29`, migrating from `mahalino_v18`)

New `S` collections (all defaulted, migrated, persisted via existing `save()`):

```js
S.profile   = { confirmed:{}, inferred:{}, stale:{}, log:[] }         // progressive profiling slots
S.notifs    = [ {id,uid,etype,title,msg,ts,read,priority,chatId,wfId,entityId,action,dedupKey} ]
S.library   = [ {id,title,type,summary,artifact,createdAt,updatedAt,status,
                 sourceChat,projectId,workflowId,entityId,txnId,tokenCost,
                 versions:[{ts,artifact,note}],sharing:{shared:false}} ]
S.projects  = [ {id,name,desc,instructions,color,icon,pinned,archived,createdAt,
                 chatIds:[],artifacts:[] } ]     // conversations reference projectId
S.shares    = [ {id,token,etype,title,snapshot,createdAt,revoked,expiresAt,views:[]} ]
S.chats[i].projectId                            // conversation → project link
S.prefs.notif = { inApp:true, browser:true, quiet:{on:false,from:22,to:8}, cats:{...} }
```

**Linkage invariants (spec §14):**
- Paid output → Library item carries `txnId` (unique transaction ID from `E29.pay`) + `tokenCost`.
- Library item ↔ source conversation via `sourceChat` (archived session id or live session).
- Contract library item ↔ `S.contracts` record via `entityId`.
- Notification deep-link → panel/view/conversation by `action` descriptor.
- Share snapshot is a frozen copy; revoking affects only `S.shares`.
- Workflow milestones snapshot `wfs` data into Library "In-Progress" item; resume restores exact state into the live flow.

## 3. Event architecture
`E29.core.bus = { on(evt,fn), emit(evt,payload) }` — synchronous, try/catch isolated.
Emitted events (sources → notification subscriptions):

| Event | Emitted by | Notification category |
|---|---|---|
| `wallet.topup/failed` | payment gateway | Financial |
| `token.deduct/refund` | `E29.pay` | Financial |
| `contract.draft/registered/status/terminated` | contract engine | Contract |
| `analysis.completed` (hood/valuation/investment/ai) | paid services | Analysis |
| `reminder.due/overdue` | `E28.remTick` hook | Reminder |
| `workflow.milestone/resume` | intel engine + lib | Workflow |
| `library.saved` | library store | — (badge refresh only) |

`E29.notifs.push(evt)` applies: user prefs filter → quiet hours → **dedupKey** (hash of etype+entityId+day or explicit) → persist → unread badge update → optional browser notification.

## 4. Token economy (`E29.pay`)
- Centralized pricing `E29.PRICING` (single source; mapped to existing `COSTS` where they overlap):
  `hood_detail`, `hood_compare`, `contract_draft`, `term_ai` (+ existing: detail, visit, valuation, legal, escrow, bid, stay).
- **`E29.pay.ask(key, desc, onConfirm)`** — renders a cost-confirmation card in chat (service name, token cost, current balance) with confirm/cancel chips. Execution only after explicit confirm → `spend()` → unique `txnId = 'TXN-'+ts+'-'+rand` recorded in `S.log` → on failure/cancel: refund path + `token.refund` event.
- Duplicate-deduction guard: in-flight transaction registry.
- Balance check before confirmation; low-balance notification (`<10%` of typical service cost).

## 5. Adaptive conversational intelligence (`E29.intel`)
- **Slot-filling frames** per workflow (rent, buy, sell, hood_analysis, valuation, invest, contract, termination, payment) derived from the persona matrix: ordered slots `{id, ask, required, conditionalOn, parser, priority}`.
- **Progressive profile** `S.profile` with confirmed/inferred/stale separation; extraction rules from free text (budget/area/rooms/household/occupation keywords via existing Persian parsers + new patterns).
- **Flow interception:** before a workflow's fixed SCRIPT steps launch, `E29.intel.collect(wf)` runs: greeting + **one meaningful question at a time**, accepting info in any order, no repeats, corrections rewrite slots, contradiction detection prompts confirmation.
- **Persona adaptation:** persona classifier (household, occupation, motivation signals) selects the question set variant + tone from `research/*.md` decision points. 63 personas mapped to behavior archetypes × parameterized slots (genuinely different question sequences per persona group).
- **Previous-info confirmation (Workstream B):** on relevant slot collection, prior values (profile/past flows) surface as "پارسه گفتی X — هنوز معتبره؟" with confirm/change/skip options.
- **Hand-off:** when required slots complete → existing SCRIPTS flow resumes at the right step with `data` injected; financial/contract validation remains deterministic (`ceVal`).
- **LLM adapter:** `E29.core.llm = { endpoint:null, enabled:false, complete(history) }` — no fabrication; runtime is deterministic unless a real endpoint is configured.

## 6. UI systems
- **Shell (sidebar):** rewritten `renderSidebar()` — primary actions (New Chat / Search, identical 42px geometry), utilities (Library, Reminders, Notifications + unread badge), Projects section (new/pinned/recent, expand-collapse), history (pinned + grouped recent), account footer. Collapsed = icon rail (`body.sidefold`) with tooltips; never migrates controls into chat header. Mobile: existing drawer pattern preserved.
- **Panels:** `E29.shell.panel(kind)` — single slide-over overlay (Library / Notifications / Reminders manager / Project detail). Tabs filter one underlying dataset; card grids use shared `.e29-` classes built on existing tokens; empty/loading/error states included. Back-navigation preserves filters.
- **Library cards:** grid of `.e29-card`; contract cards open full contract detail (parties, terms, financials, versions, transactions, actions) in the panel; reports open rendered artifact.
- **Share dialog:** `.e29-modal` pattern (backdrop + dialog) with title/type/preview/scope/expiration/copy/native share. Snapshots read-only; revocation stops access; hash route `#s/<token>` renders read-only snapshot view; export-to-file fallback (real limitation documented: no backend → no public authenticated links).

## 7. Layout fixes (chat scrolling)
- Chat view: `html,body` constrained; `.app` becomes fixed-height grid for chat context; transcript + sidebar internal scroll (`min-height:0`, `overscroll-behavior:contain`); composer/topbar fixed; remove any 640px min-height influence; mobile uses `100dvh` + visual-viewport listener.
- Legacy page views keep current behavior unless they exhibit the bug (verified in browser during QA).

## 8. Build injection points (asserted anchors in V0.28 output)
1. `<title>` + version strings → V0.29.
2. `var LSKEY='mahalino_v18'` → `'mahalino_v29'` + prepend to `LSCHAIN` (migration).
3. After `if(S.sub===undefined){S.sub=null}` → inject E29 state defaults.
4. `function renderSidebar(){...}` whole body → E29.shell implementation.
5. End of `<style>` block → inject `src/v29.css`.
6. Before `/* ═══ ۲۲) راه‌اندازی ═══ */` init IIFE → inject all `src/v29-*.js` concatenated; init gains `E29.init()` call.
7. Targeted text cleanup reps (spec §13) — enumerated individually.

Every patch uses `rep(old,new,1)` (or counted) so the build fails loudly on drift.
