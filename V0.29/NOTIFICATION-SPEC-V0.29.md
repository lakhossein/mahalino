# NOTIFICATION SPEC — V0.29

## Store
`S.notifs[]` (≤120, newest first):
```js
{ id:'NT-…', etype, cat, title, msg, ts, read, priority,
  chatId, wfId, entityId, action:{kind:'library'|'wallet'|'reminders', target}, dedupKey }
```

## Event sources (bus: `E29.core.bus`)
| Event | Producer | Category |
|---|---|---|
| token.deduct / token.refund / wallet.low | E29.pay / spend() | مالی |
| library.saved | E29.lib | گردش کار |
| contract.status (registered/terminated) | conFinalize / applyTermination wrap | قرارداد |
| analysis.completed | hood_detail / term_ai | تحلیل |
| workflow.milestone | E29.intel.maybeMilestone | گردش کار |
| reminder.due | E28.remTick wrap (≤1h past due) | یادآور |

Not notified: ordinary chat messages (per spec).

## Dedup
`dedupKey` default = `etype|target|date` (day-granular). Duplicates silently dropped.

## UI (slide-over panel)
- Sidebar entry with unread badge (count of read=false).
- Tabs: همه / ۶ دسته. Rows: icon, title, message, timestamp+category, unread dot.
- Row actions: mark read, delete. Footer: خواندن همه، پاک‌کردن همه.
- Row click → deep link: library item → Library panel detail; wallet → account wallet tab; reminders → reminders panel; marks read.
- Preferences section (chips): per-category on/off, browser notifications toggle (requests `Notification.requestPermission()`; disabled on denial), quiet hours toggle (22–08 default; in-app + browser suppressed during quiet hours; no external delivery claimed — none exists).

## Persistence & honesty
- Stored in `S` → survives reload (verified).
- Browser notifications only when permission=granted; nothing claimed beyond in-app + browser.
