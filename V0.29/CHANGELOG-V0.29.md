# CHANGELOG — Mahalino+ V0.29

**Base:** V0.28 (untouched) · **Build:** `build_v029.js` codemod (14 asserted patches + injected sources) · **Date:** 2026-11-08

## Workstream A — Adaptive Conversational Intelligence
- Natural-language flow starts: «می‌خوام خونه اجاره کنم» opens an adaptive collector, not a fixed questionnaire.
- Adaptive slot-filling engine (`E29.intel`): one meaningful question at a time, answers accepted in any order, skips («بدون سقف»، «مهم نیست»)، ambiguity handling.
- Progressive profiling `S.profile` (confirmed/inferred/stale) + in-chat profile card with per-slot «اصلاح».
- Persona classification (student/family/couple/roommates/retiree/relocating/professional/firsttime/upgrader/investor) driving question order and importance defaults.
- 63 personas researched via LLM agents → `research/*.md` (189 transcripts, decision points).
- Clean hand-off to the deterministic engine (no re-asking): budget/deposit/household/rooms/area/age/preferences injected, jump to results.
- Previous-info confirmation: «دفعهٔ پیش بودجه‌تان را X گفته بودید — هنوز معتبر است؟» (همان است / تغییر کرده).
- LLM adapter `E29.llm` present but disabled (no fabricated runtime integration — documented).

## Workstream B — Previous Conversation Context
- Profile + prior values confirmed before reuse (confirm/change pattern), stale values tracked.

## Workstream C — Token Economy
- Centralized pricing additions: `hood_detail 40`, `hood_compare 40`, `contract_draft 60`, `term_ai 80` (+ existing COSTS).
- Pre-execution confirmation card (service, cost, balance) in chat or modal; explicit pay/cancel.
- Unique transaction IDs (`TXN-…`) on every deduction, recorded in ledger with service id.
- Refund on failure/cancel; low-balance notification; in-flight duplicate guard.
- spend() now emits `token.deduct` / `wallet.low` events.

## Workstream D — Notification Center
- Event bus + persistent `S.notifs`; categories: ملک/قرارداد/مالی/تحلیل/یادآور/گردش کار.
- Sidebar utility with unread badge; slide-over center: filters, read/unread, mark-all, delete, clear.
- Deep links open the exact context (library item, wallet, reminders).
- Dedup keys prevent duplicates; preferences per category, browser notifications (permission-gated), quiet hours.

## Workstream E — Library
- Auto-save of every successful token-paid output (hood analysis, contract, AI termination analysis) with artifact + txn linkage.
- 7 tabs over one dataset (All/Contracts/Hood analysis/Valuation&Investment/AI/Other/In-Progress), search, card grid.
- Contract cards → full contract detail (parties, terms, versions, transaction, PDF); report detail; AI-process detail.
- In-progress workflow milestones auto-saved with progress bar + exact resume.
- Item actions: open, PDF, rename, delete (source conversation/contract preserved), share, txn view, open original chat.

## Workstream F — Projects
- Create/rename/pin/archive/delete with color dot; instructions per project.
- Move conversations in/out (sidebar groups + detail panel); library artifacts follow the project.
- Deleting a project never deletes conversations or artifacts.

## Workstream G — Sidebar
- New IA: primary actions (New Chat / Search, identical 238×44px), utilities (Library/Reminders/Notifications+badge), Projects section (expand/collapse, pinned), grouped history, account footer (+ share links manager).
- Collapsed = 64px icon rail with tooltips; labels/projects/titles hidden; expand control inside the sidebar; nothing migrates into the chat header.

## Chat Layout Fix
- Fixed viewport shell for chat (`html:has(body.widemain){overflow:hidden}`, `100dvh`); transcript + sidebar scroll internally; composer/topbar fixed; verified programmatically (document cannot scroll).

## Workstream H — Sharing
- Share entire conversation, single assistant response, or a library artifact — with exact preview + sensitivity warning for contracts/financial content.
- Read-only snapshots with unpredictable tokens (`#s/<token>`), 30-day expiry, revoke, explicit snapshot update, view counts.
- Honest limitation: client-side app → in-app snapshot link + standalone HTML export + native share; no public authenticated links (documented in dialog and spec).

## Workstream I — Production Text
- Removed technical copy-paste instructions from boot fallback messages; kept legal/security notices.

## Preservation
- All V0.28 flows (rent/buy/invest/market/build/stay/grt/svc/map/sub/profile), reminders, sessions, attachments, contract engine, wallet — verified by 30/30 automated E2E checks.
