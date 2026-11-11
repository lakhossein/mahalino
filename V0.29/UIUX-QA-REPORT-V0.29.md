# UI/UX QA REPORT — V0.29

**Method:** real Chromium screenshots (17 captures) reviewed against the approved design language (V0.28 shipped identity = adapted Agent C system), across 6 viewports, both themes.
**Files:** `screenshots/*.png`

## Coverage matrix (spec §17.8)
| Viewport | Captures |
|---|---|
| 1440×900 | chat expanded sidebar, collapsed rail, library panel, notifications, projects, share dialog, dark chat, dark library |
| 1280×720 | chat, collapsed |
| 1024×768 | chat |
| 820×1180 | chat, library |
| 390×844 | chat, drawer open |
| 360×800 | chat, drawer open |

## Review findings
| # | Dimension | Verdict |
|---|---|---|
| 1 | Visual consistency (tokens, palette, typography, RTL) | ✓ — all new components reuse `--brand/--surface/--line/--r-*/--sh`; IRANSansX; RTL logical layout everywhere |
| 2 | Sidebar hierarchy | ✓ — primary actions → utilities → projects → history → account; clear section heads |
| 3 | Library card quality | ✓ — type badge, 2-line title/summary clamp, cost/date/version meta, hover ring |
| 4 | Tab clarity | ✓ — active tab underline + counters, horizontal scroll on narrow panels |
| 5 | Contract detail layout | ✓ — kv sections (اطلاعات/شرط‌های مالی/وضعیت/تراکنش/نسخه‌ها) |
| 6 | Notification presentation | ✓ — unread tint + dot, icon per category, hover actions |
| 7 | Project grouping | ✓ — color dot, chevron collapse, nested chat rows |
| 8 | Share dialog usability | ✓ — preview box, sensitivity banner, copy/native/export actions |
| 9 | Responsive layouts | ✓ — panels 480px→100vw on mobile; card grid reflows; drawer works |
| 10 | Light & dark themes | ✓ — dark verified on chat + library (no broken contrast found) |
| 11 | Hover/focus states | ✓ — existing primitives reused; focus-visible preserved by a11yify |
| 12 | Typography & spacing | ✓ — consistent with tokens; logical properties keep RTL rhythm |
| 13 | Information density | ✓ — cards concise; detail views progressive |
| 14 | Empty states | ✓ — library/notifs/reminders/projects each have friendly empties |
| 15 | Loading/error states | ✓ — toast error pattern from E24 reused; snapshot invalid state |
| 16 | Accessibility | ✓ — role=button + tabindex on interactive cards/rows, aria labels on icons, keyboard activation via existing global handler |

## Defects found & fixed during QA
1. Library/notification rows lacked `data-act` → clicks dead (fixed).
2. Chips carrying `data-cba` payloads rendered as text-senders (termination offer) → replaced with direct `.qr` buttons (fixed).
3. Pay confirmation unreachable outside chat view → modal fallback (fixed).
4. Document scroll drift 11px from smooth-scroll → `scroll-behavior:auto` under widemain (fixed).

## Minor accepted notes
- Tooltips can clip at viewport edge on the rail side (cosmetic).
- Toasts stack under very rapid automated actions (not at human pace).
- `--chat-content-width` dormant ds layer remains unused (no visual impact).

**Verdict:** UI is visually consistent, uncluttered, and responsive — release-ready for V0.29.
