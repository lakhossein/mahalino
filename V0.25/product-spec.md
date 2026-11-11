# Mahalino V0.25 — Real-Estate Product Expansion Specification
**Input:** `Mahalino/V0.24/Mahalino+V0.24.html` · **Output:** `Mahalino/V0.25/Mahalino+V0.25.html`
**Dominant objective:** close the two research-verified feasible-local product gaps (commission calculator §7 row 4; due-date reminder ledger from the CRM workflow convergence §1/§5/§6) + deliver the remaining feasible research scenarios (S5 rent-increase education, S6 agent-handoff brief, S10 investment sanity). Everything rule-based, no backend claims, no fabricated numbers, page wizards stay authoritative.

## F1 — Commission calculator (chat)
- Triggers: «کمیسیون», «حق کمیسیون», «کمیسیون اجاره چقدره», «کمیسیون فروش/مبایعه» (+ money).
- Model (labeled **تعرفهٔ رایج بازار** — NOT official): rent deal → total ≈ ۵۰٪ یک ماه اجاره، معمولاً نصف‌نیم (هر طرف ≈ ۲۵٪); sale deal (مبایعه) → هر طرف ≈ ۰/۵٪ مبلغ معامله. Formula shown explicitly; note: «تعرفهٔ رایج بازار است — مرجع رسمی نیست؛ توافق طرفین و تعرفهٔ اتحادیهٔ مشاوران املاک محل ملاک است. محلی‌نو عدد رسمی اعلام نمی‌کند.»
- Two calculators: money+اجاره/رهن → rent-commission rows (rcConfirm-style: کمیسیون کل/سهم مالک/سهم مستأجر, via fa()/rial); money+خرید/فروش/مبایعه → sale-commission rows. Bare «کمیسیون» → explainer + ask which deal type (clarification, keep parsed money in E25.temp if present).
- Additive to E23 dispatcher: fires only under E21.noFlow(); excludes established phrases; no shadowing (test «کمیسیون» alone and with money).

## F2 — Reminder ledger (دفتر یادآور چک و تعهدات) — the second verified gap
- State: `S.reminders=[{id:'RM-…',title,due:'YYYY-MM-DD',amt:null|number,done:false}]` (persisted; init guard in engine).
- Chat intents: «یادآور» / «دفتر یادآور» / «چک» + verb → mini-flow like the svc hand-off: list (sorted by due asc, undone first; each row title + fa(date) + days-remaining «۳ روز مانده / امروز / ۲ روز گذشته» via rial/fa) + chips «افزودن یادآور» / «حذف…» (data-cba list). Add mini-flow: title (text) → due (E21.dateFromText-style parsing: امروز/فردا/پس‌فردا/جمعه/ISO; else honest re-ask) → amount (optional; «-» skips; parseMoneyFA) → confirm → save + honest note «یادآور فقط در همین مرورگر ذخیره می‌شود؛ هشدار پیامکی/زنگ نیازمند سرویس خارجی است و در این نسخه وجود ندارد.» Mark done («انجام شد» on a row chip); delete with confirm.
- Page surface: a «دفتر یادآور» card in the profile overview tab (wrap the profile-overview renderer; card lists reminders + «افزودن از گفت‌وگو» button data-view="landing" or direct chips). Reuse .card/.panel-list/.btn classes; dark-mode safe (vars only).
- Overdue styling: subtle (var(--danger) text on the days label) — CSS vars only.

## F3 — Rent-increase education (research §8 S5)
- Triggers: «افزایش اجاره», «سقف افزایش اجاره», «اجاره سال بعد».
- Response: explains the statutory-cap mechanism honestly: «سقف افزایش اجارهٔ مسکن در شهر تهران هر سال با مصوبهٔ شورای شهر اعلام می‌شود؛ منابع عمومی به سقف‌هایی تا ۲۵٪ اشاره کرده‌اند اما عدد دقیق سالِ جاری را باید از منابع رسمی بررسی کنید — این توضیح، مشاورهٔ حقوقی نیست.» + chips (محاسبهٔ کمیسیون، شروع اجاره). NO invented current-year number.

## F4 — Investment sanity check (research §8 S10)
- Triggers: «پولم رو ملک بذارم یا طلا», «بهتره بخرم یا سرمایه‌گذاری», «سود ملک».
- Response: Mahalino shows historical aggregate trends only (rcLine offer chip: «روند قیمت محله‌ها» → data-cq="بازار محله‌ها") + an honest refusal to predict: «هیچ‌کس — و هیچ ابزاری — نمی‌تواند آینده را تضمین کند؛ من دادهٔ گذشته را نش می‌دهم و توصیه نمی‌کنم.» + a short decision checklist (rcTable: افق زمانی، نقدشوندگی، ریسک، هزینه‌های نگهداری، تنوع). Rule-based, no valuation.

## F5 — Agent-handoff brief (research §8 S6)
- Triggers: «با مشاور حرف بزنم», «معرفی مشاور/بنگاه».
- Response: collects nothing silently — renders an honest summary of current context (CTX slots + active flows via wfRunning) as a «خلاصهٔ درخواست شما» rcConfirm block (copyable text note: «این خلاصه را می‌توانید کپی کنید و به هر مشاوری بدهید؛ محلینو در این نسخه به مشاور واقعی وصل نمی‌شود — ادعای تأییدشدهٔ مشاوری وجود ندارد.») + chips to existing modules (ثبت بازدید → rent flow day-step hint; سفارش خدمت → svc hand-off). Never claims verified partners.

## Architecture
- Engine `v025-product.js` (E25 namespace) inserted before the boot marker; wraps only (ceSend outermost chain, profile-overview renderer, E21.dateFromText reuse — do NOT redefine; reuse via direct call since insertion is after E21). F2 add/del/done handlers as ACT.* / CBACT.* additions picked up by the existing delegation. Build `build_v025.js` = 3 structural reps (marker + engine) reading V0.24 → writing V0.25. No CSS file needed (vars + existing classes); if a tiny dark-safe CSS delta is unavoidable, inline it in the engine via a one-time <style> injection? NO — keep zero CSS; use existing utility classes only.
- Guards: F1/F3/F4/F5 matchers fire only `E21.noFlow()`; exclude all established phrases (reuse E23's exclusion discipline); S7-style normalizer untouched.

## Acceptance
1. Browser-verified: each intent ×2 phrasings, math correct (50%/25% and 0.5% arithmetic via fa/rial), reminders add/list/done/delete/persist/reload, profile card renders in light+dark, no shadowing of established intents, 0 console errors.
2. Regression: rent slider flow, GRT hand-off, conversion (V0.23), sessions/dark/busy (V0.22), error boundary (V0.24 forced-throw toast), persistence.
