# SIDEBAR NAVIGATION SPEC — V0.29

## Expanded structure (RTL — sidebar right, per design system)
1. **Primary actions**: گفت‌وگوی جدید (primary) + جست‌وجو در گفت‌وگوها — identical geometry **238×44.3px** (≥42px rule), same padding/radius/icon box/alignment.
2. **ابزارها**: کتابخانه / یادآورها (overdue badge) / اعلان‌ها (unread badge) — each opens its slide-over panel.
3. **پروژه‌ها**: + جدید, pinned first, expandable groups (chevron), nested chat rows, readable names.
4. **گفت‌وگوهای پیشین**: pinned group + day-grouped recent (existing E27 list, pin/search preserved; search input opens via the Search action and focuses).
5. **Account footer**: theme, کیف پول (balance inline), لینک‌های اشتراک‌گذاری, حساب کاربری (name + token balance), تنظیمات و حساب. No duplicated navigation.

## Collapsed state (body.sidefold)
- **64px icon rail** in place; labels/project names/titles/badges hidden; items centered.
- Tooltips via `[data-tip]::after` on hover; fold/expand control remains inside the rail.
- New Chat, Search, Library, Reminders, Notifications, Projects, History, Account all reachable.
- **Nothing moves into the chat header** — the workspace simply widens (`grid-template-columns:64px minmax(0,1fr)`).
- State persisted (`mahalino_sidefold`, existing mechanism).

## Mobile (≤980px)
- Existing drawer pattern (hamburger → overlay drawer from RTL side) preserved with the new structure; conversation stays usable; background scroll locked by the drawer overlay. Desktop rail is never forced onto mobile.

## Consistency
- Uses existing tokens only (`--brand/--surface/--line/--r-*/--sh`), IRANSansX stack, RTL logical properties; verified light+dark screenshots.
