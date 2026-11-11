# FUNCTIONAL QA REPORT — V0.29

**Method:** automated Playwright E2E against the built HTML (real Chromium, fresh profile per run), plus interactive browser debugging. **Result: 30/30 passed.**

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Boot, E29 modules present, no startup errors | ✓ | `window.__BOOTED`, errbar empty |
| 2 | Quick login, 500 welcome tokens | ✓ | S.auth set |
| 3 | Sidebar structure: 3 utilities, grouped history, 5 footer rows | ✓ | DOM counts |
| 4 | New Chat & Search identical dimensions ≥42px | ✓ | 238×44.3 both |
| 5 | Chat: document cannot scroll; transcript scrolls | ✓ | scrollY=0 with overflow content; .ch-b scrollTop>0 |
| 6 | Natural request → adaptive collector (not questionnaire) | ✓ | collector active, budget question |
| 7 | Adaptive completion → profile card + hand-off | ✓ | profile confirmed slots |
| 8 | Hand-off to rent engine, hood result cards | ✓ | CE.f=rent, 12 cards |
| 9 | Paid analysis: cost confirmation card | ✓ | service/cost/balance |
| 10 | Analysis: −40 tokens, Library auto-save + txn + notification | ✓ | tokens 460, lib[0]=hood_analysis, txnId |
| 11 | Library panel: 7 tabs + card grid + search | ✓ | tabs=7, cards≥1 |
| 12 | Report detail: data + transaction rows | ✓ | kv=8 |
| 13 | Notification center: list/unread/prefs | ✓ | 3 unread, 6 category chips |
| 14 | Deep link opens library detail + marks read | ✓ | unread 3→2, panel=library |
| 15 | Project create + sidebar update | ✓ | 1 project, section rendered |
| 16 | Conversation → project; library linkage preserved | ✓ | projectId on chat + artifact |
| 17 | Visit booking (−20 tokens) | ✓ | tokens 440, req recorded |
| 18 | Contract bubble form opens in chat | ✓ | cl-name present |
| 19 | Contract finalize → 60-token confirmation | ✓ | cost card |
| 20 | Contract registered: −60 tokens, contract artifact saved | ✓ | tokens 380, lib includes contract |
| 21 | Termination applied + AI offer chip | ✓ | status=terminated |
| 22 | AI termination analysis: −80 tokens, ai_process artifact | ✓ | tokens 300, lib=4 |
| 23 | Share dialog: preview + sensitivity warning | ✓ | dialog + e29-shareprev |
| 24 | Share link created (`#s/<token>`) | ✓ | S.shares=1 |
| 25 | Snapshot renders read-only on token route | ✓ | frozen content page |
| 26 | Revoked link denied; original intact | ✓ | 'در دسترس نیست' |
| 27 | Collapsed sidebar: 64px rail, labels hidden, tooltips | ✓ | width=64 |
| 28 | Dark theme via data-theme + persisted | ✓ | S.ui.theme=dark |
| 29 | Reload persistence: library/projects/notifs/shares/profile | ✓ | all retained |
| 30 | No unexpected page errors | ✓ | only graceful external image placeholder 404s |

## Regression scope
All V0.28 flows exercised during the run: gate menu, market page, listings, visit smart-form, contract engine (parties/property/approve/finalize with national-ID + postal validation), requests ledger, wallet, reminders tick, sessions archive, theme.

## Known non-blocking observations
- External image placeholders (picsum) may 404 offline → handled by `onerror` removal (by design).
- Toast queue can stack several pills under rapid automated actions; fine at human pace.
