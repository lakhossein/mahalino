# Mahalino V0.26 — Product Maturity Specification
**Input:** `Mahalino/V0.25/Mahalino+V0.25.html` · **Output:** `Mahalino/V0.26/Mahalino+V0.26.html`
**Dominant objective:** maturity hardening — accessibility (modal focus trap), data reliability (state shape repair + caps), security/privacy sweep (honest frontend-only findings), mobile verification of the new V0.22–V0.25 surfaces, and consistency fixes. Zero feature additions. Zero behavior change except the specific maturity fixes.

## M1 — Modal focus trap (a11y)
When a modal is open, Tab cycling must stay inside it (wrap to first/last focusable), and Escape already closes (verify). Implement by wrapping openModal/closeModal (E26 chain on E22's wrappers): on open, store the modal root; add a keydown listener (document-level, E26-owned, removed on close) that on Tab queries focusable elements inside the modal (a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])) and wraps. Do not break Shift+Tab. Verify attViewer (separate overlay) also traps or at least Escape-closes (already closes).

## M2 — Data reliability
- Boot shape repair (E26 init block before boot marker): ensure arrays are arrays — `S.chats,S.reminders,S.wfs,S.reqs,S.contracts,S.grt` (if present) — non-arrays reset to [] with one console.warn; `S.ui` object guard already exists (E24).
- `S.reminders` cap 50: on add beyond cap, drop oldest done-then-oldest with honest toast; `S.chats` cap already enforced by E22 (verify, don't duplicate).
- save() already surfaces failures (E24) — no change.

## M3 — Security/privacy sweep (honest, frontend-only)
- Audit EVERY place user-controlled text reaches innerHTML across E21–E25 engines + the original app's user-echo paths: attachment names (attchip/attcard/trayErr), session titles (sidebar + restore), reminder titles/due/amount (chat rows + profile card), CORR echo, slot-extract echo, svc/address prefill values. Verify esc()/qesc() coverage; fix any gap found (build replacement). Report each site checked.
- External links: grep for href= targets — any external http(s) links rendered? If found, ensure target="_blank" rel="noopener noreferrer"; if none rendered (S2 uses text), document that.
- localStorage: confirm no credentials/sensitive tokens stored (S contains auth name/phone — demo values only; document honestly). No new claims.
- Add `S.v=26` marker at save-time (harmless future-proofing; migration hook stub documented, not speculative).

## M4 — Mobile verification of new surfaces (verify + fix if broken)
At 375×700: sessions section in the drawer (long titles must ellipsis, not overflow), reminder rows in profile card, commission rcConfirm rows, attViewer, busy hint. Measure scrollWidth on landing/dash/profile with populated state. Fix overflow via minimal CSS-var-safe inline fixes ONLY where measured broken (existing utility classes first).

## M5 — Consistency spot-fixes
- grep for remaining `#fff`/`rgba(255,255,255` hardcoded backgrounds in NEW engine-injected markup (E21–E25) — must use vars; fix if any.
- Chart/monetary strings: ensure fa()/rial() used everywhere in new outputs (spot-check E23/E25 math outputs).

## Deliverables
`Mahalino/V0.26/build_v026.js` (assert-per-replacement, in-place pattern like V0.24; input V0.25; version marker + M1–M5 replacements; any new code inline under `var E26`) + honest audit report (M3 site-by-site table, M4 measurements, skips). Do NOT run the build.

## Acceptance (orchestrator verification)
1. Modal Tab-cycle trapped; Escape closes; no focus lost to background.
2. Corrupted-shape S repaired at boot without crash (stub test).
3. Reminder 50-cap drop with toast; chats cap intact.
4. XSS probe: attachment name / session title / reminder title containing `<img src=x onerror=alert(1)>` renders as TEXT everywhere.
5. 375px: no scrollWidth overflow on landing/dash/profile with populated sessions+reminders.
6. Full regression sweep (rent/GRT/converter/commission/reminders/dark/sessions/busy) green; 0 console errors.
