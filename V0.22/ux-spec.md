# Mahalino V0.22 — UX Excellence Specification
**Input:** `Mahalino/V0.21/Mahalino+V0.21.html` (released 2026-11-05) · **Output:** `Mahalino/V0.22/Mahalino+V0.22.html`
**Dominant objective:** measurable usability improvement without redesigning approved visuals or touching business logic. Rule zero carries over: nothing removed or degraded; new code wraps existing functions (engine pattern), delegation attributes only, honesty labels everywhere.

## 1. Scope (5 workstreams)

### W1 — Dark mode (largest visible gap; Agent C dark tokens ship dormant in V0.21)
- `S.ui.theme` ∈ null|'light'|'dark', persisted via save(); applied at boot and on toggle by setting `data-theme` on `document.documentElement` (the Agent C dark block `[data-theme="dark"]` then activates all tokens).
- Toggle control ① sidebar header (icon button, aria-label «حالت تاریک/روشن», title same) ② account → settings tab row («حالت نمایش» with دو گزینه).
- All new/updated surfaces must be checked in dark: sidebar, landing chat, composer (.cwr), tray chips, slider, confirm panels, cards, tables/charts (rcLine SVG / rcBars / rcDonut — if any hardcoded light-only colors, patch via CSS var usage), modals, attViewer backdrop, toasts, map (Leaflet tiles stay light — acceptable, note it).
- NO application-code claims; purely visual. Acceptance: toggle on 15 views without broken contrast; persists across reload; light default unchanged for existing users (null → light).

### W2 — Conversation history manager (master prompt §13 gap: search history, pin, grouping)
- `S.chats` (persisted): array of `{id:'CH-…', title, ts, pinned:false, hist:[…trimmed ≤60]}` capped at 12 non-pinned (oldest dropped, honest toast).
- Archive on `ACT.chatNew` when current HIST contains ≥2 user messages (before reset); title = first user message trimmed to 40 chars.
- Sidebar section «گفت‌وگوهای پیشین» (below وضعیت شما): pinned group first («📌 سنجاق‌شده»), then rest by ts desc; item = title + relative time + actions (pin toggle / delete with small confirm modal reusing existing modal pattern).
- Text filter input at section top («جست‌وجو در تاریخچه…») filtering by title substring (normFa both sides).
- Restore: `HIST = session.hist.slice()`; cr() on all surfaces; CE untouched; one bot note appended live (not into the restored HIST): «گفت‌وگوی پیشین بازیابی شد؛ فلوهای در جریان از «درخواست‌های من» ادامه می‌یابند.» — honest: sessions store messages only, not flow cursors.
- Same session cannot be double-archived (ts guard); current live conversation is NOT stored until chatNew.
- Acceptance: archive/restore/pin/delete/search/cap/persistence all work; multi-flow state unaffected; localStorage size sane.

### W3 — Composer feedback during blocking ops (known-limitation #5)
- While a modal is open (gateway payment, svc order, any `openModal`), the 3 send buttons show disabled state and textareas get `readonly` + hint «در حال پردازش…» via `.cwr.sendbusy` class (CSS); cleared on closeModal.
- Wrap `openModal`/`closeModal` (E22 flag + DOM update); must not break modal behavior.
- Acceptance: opening gateway disables composers; closing re-enables; Enter during busy does nothing.

### W4 — Focus management (keyboard-only usability)
- After a send from any surface, refocus that surface's textarea (if still connected) — via the existing ceSendWithAtt/ceSend wrappers.
- `openModal` stores `document.activeElement`; `closeModal` restores focus to it.
- Acceptance: keyboard-only walkthrough — send → type next → send without mouse.

### W5 — Micro-polish
- `#toast-root` gets `aria-live="polite"` (build or engine one-liner).
- Visible `:focus-visible` ring on `.cwr-send`/`.cwr-att` (already in Agent C CSS — verify only).
- Nothing else: no new features, no page redesigns.

## 2. Architecture constraints (same as V0.21)
- Engine file `v022-ux.js` inserted verbatim before the boot marker in the built V0.21 HTML; wraps existing functions only (renderSidebar, ACT.chatNew, openModal, closeModal, ceSendWithAtt wrappers already exist — chain carefully, save-original pattern). Namespace `E22`.
- CSS delta `v022-ux.css` injected after the Agent C CSS block (build replaces the V0.19 CSS marker again).
- Sidebar DOM additions post-process the rendered sidebar (wrap renderSidebar, then inject section + attach via existing delegation: `data-act` values `sessOpen/sessPin/sessDel`, `data-sess` ids; modal confirm via existing ACT modal patterns).
- Persistence only in existing `S` object via save(); sessions are full HIST copies (already trimmed ≤60) — no new storage keys beyond `S.chats`.
- LF endings, UTF-8, no `</script>` sequence, `node --check` clean, no inline onclick, a11yify-compatible markup (role/tabindex for non-buttons), all strings Persian, numbers via fa().
- Multi-flow safety and honesty constraints carry over verbatim.

## 3. Acceptance criteria (release gates for V0.22)
1. Dark toggle: 15 views, reload persistence, spot contrast pass, light default intact.
2. Sessions: archive on chatNew (≥2 user msgs), restore renders, pin exempt from 12-cap, delete confirmed, filter works, survives reload.
3. Composer busy state during gateway modal; re-enabled after.
4. Keyboard-only: send→refocus, modal focus restore.
5. Full regression: V0.21 QA-R rows still pass (spot: rent/buy/contracts/wallet/multi-flow/persistence).
