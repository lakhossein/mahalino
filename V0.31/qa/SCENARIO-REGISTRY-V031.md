# V0.31 — Deterministic Conversation Scenario Registry

**Mode:** local JavaScript, rules only; no AI model, remote language service, invented live listings, payment side effect, or official contract registration.

**How it works:** Prompt suggestion → user edits or types into `#chatIn` → explicit send → exact normalized prompt/alias match → deterministic action or existing collector → assistant response → new stage-specific prompt suggestions. Unregistered free text passes unchanged to the existing engine. In-chat buttons never submit automatically; stale suggestions are rejected. The 25 registry entries cover navigable scenarios, not the separate 25 historical QA requirement IDs.

## Executable registry

| ID / scenario | Prompt to type in chat | Action and observable result | Required/used information | Next prompt IDs | Acceptance evidence |
|---|---|---|---|---|---|
| `rent` — جست‌وجوی رهن و اجاره | می‌خوام در تهران یه خونه رهن و اجاره پیدا کنم. | `discover:rent`: شروع کشف نیاز اجاره | `city`, `budget_dep`, `budget_rent`, `m2`, `rooms`, `hood` | `rent-budget`, `rent-area`, `rent-specs` | `guide-rent` |
| `rent-budget` — ثبت بودجهٔ اجاره | بودجه‌ام ۱.۲ میلیارد ودیعه و ۱۰ میلیون اجاره ماهانه است. | `native`: ثبت با پارسر مالی و درخواست تأیید | `budget_dep`, `budget_rent` | `rent-specs`, `rent-area`, `sample` | `guide-budget` |
| `rent-specs` — شرایط ملک | حداقل ۶۰ متر و یک خواب می‌خوام. | `native`: به‌روزرسانی قیود جست‌وجو | `m2`, `rooms` | `sample`, `rent-area`, `map` | `guide-specs` |
| `rent-area` — تمرکز بر محدودهٔ انقلاب | اول محله‌های اطراف انقلاب رو برای اجاره ارزیابی کن. | `compare`: مقایسهٔ شفاف دادهٔ نمونه، بدون تثبیت محله به‌عنوان شرط قطعی | `area_reference` | `compare`, `sample`, `map` | `guide-area` |
| `sample` — نمایش آگهی نمونه | با همین شرایط آگهی‌های نمونه رو نشون بده. | `sample`: کارت‌های صریحاً ساختگی از دادهٔ موجود | `budget_dep`, `budget_rent`, `m2`, `rooms`, `hood` | `rent-area`, `map`, `rent` | `guide-sample` |
| `buy` — جست‌وجوی خرید | می‌خوام برای خرید آپارتمان در تهران راهنمایی بشم. | `discover:buy`: شروع کشف نیاز خرید | `buy_budget`, `m2`, `rooms`, `hood` | `map`, `valuation`, `neighborhood` | `guide-buy` |
| `sell` — فروش ملک | می‌خوام ملکم رو بفروشم و قیمت مناسبش رو بررسی کنم. | `discover:sell`: شروع فرایند فروشنده | `prop_area`, `prop_rooms`, `ownership`, `expected_price` | `valuation`, `contracts`, `map` | `guide-sell` |
| `invest` — بررسی سرمایه‌گذاری | می‌خوام برای سرمایه‌گذاری در ملک گزینه‌ها رو بررسی کنم. | `discover:invest`: شروع فرایند سرمایه‌گذاری | `invest_capital`, `invest_horizon`, `invest_risk` | `neighborhood`, `map`, `valuation` | `guide-invest` |
| `landlord` — ثبت درخواست موجر | ملک خودم رو می‌خوام اجاره بدم. | `discover:landlord`: شروع فرایند موجر | `listing_intent`, `prop_area`, `ownership` | `contracts`, `services`, `map` | `guide-landlord` |
| `neighborhood` — تحلیل محله | می‌خوام محله‌های تهران رو از نظر قیمت و دسترسی مقایسه کنم. | `compare`: مقایسه با برچسب دادهٔ داخلی | `hood`, `area_reference` | `rent-area`, `map`, `sample` | `guide-neighborhood` |
| `compare` — مقایسهٔ قیمت محله‌ها | محله‌های اطراف انقلاب رو از نظر قیمت و دسترسی مقایسه کن. | `compare`: مقایسهٔ قابل ردیابی با دادهٔ نمونه | `area_reference` | `sample`, `map`, `rent` | `guide-compare` |
| `map` — نقشه داخل گفت‌وگو | نقشه محله‌ها رو همین‌جا نشون بده. | `map`: نقشهٔ موجود داخل چت | `hood` | `compare`, `sample`, `rent` | `guide-map` |
| `valuation` — تخمین نمونهٔ ارزش ملک | می‌خوام ارزش ملک رو با داده‌های نمونه تخمین بزنم. | `valuation`: فرم داخلی و تأیید هزینه پیش از اجرا | `hood`, `prop_area`, `prop_age` | `sell`, `neighborhood`, `contracts` | `guide-valuation` |
| `contracts` — مدیریت قرارداد | قراردادهای ذخیره‌شده رو داخل چت نشون بده. | `contracts`: فهرست قراردادهای واقعاً ذخیره‌شده | `contract_id` | `contract-start`, `termination`, `library` | `guide-contracts` |
| `contract-start` — شروع قرارداد اجاره | می‌خوام مسیر تنظیم قرارداد اجاره رو داخل چت شروع کنم. | `contract-start`: ورود به کشف نیاز و سپس مسیر قرارداد؛ بدون ثبت خودکار | `budget_dep`, `budget_rent`, `contract_details` | `contracts`, `rent-budget`, `rent` | `guide-contract-start` |
| `termination` — پیگیری فسخ | می‌خوام وضعیت فسخ قرارداد و چک‌لیست تسویه رو ببینم. | `termination`: چک‌لیست رایگان، بدون امضا یا فسخ خودکار | `contract_id` | `contracts`, `library` | `guide-termination` |
| `services` — پیش‌درخواست خدمات ملک | می‌خوام برای خدمات و تعمیرات ملک درخواست ثبت کنم. | `services`: پیش‌درخواست درون‌چتی، نه سفارش نهایی | `service_type`, `details` | `contracts`, `library` | `guide-services` |
| `guaranteed` — پیش‌درخواست اجارهٔ تضمینی | می‌خوام پیش‌درخواست اجارهٔ تضمینی رو ثبت کنم. | `guaranteed`: فرم پیش‌درخواست بدون ادعای تضمین | `address`, `prop_area` | `contracts`, `library` | `guide-guaranteed` |
| `saved` — ملک‌های ذخیره‌شده | ملک‌های ذخیره‌شده‌ام رو همین‌جا نشون بده. | `saved`: خلاصهٔ واقعی ذخیره‌های مرورگر در چت | none | `library`, `rent`, `buy` | `guide-saved` |
| `library` — گزارش‌های کتابخانه | گزارش‌ها و فایل‌های ذخیره‌شده‌ام رو در چت مرور کن. | `library`: خلاصهٔ واقعی آثار ذخیره‌شده در چت | none | `contracts`, `saved`, `valuation` | `guide-library` |
| `projects` — پروژه‌های فعلی | پروژه‌های فعلی من رو داخل چت خلاصه کن. | `projects`: فهرست پروژه‌های موجود بدون ساخت یا حذف | none | `library`, `saved`, `rent` | `guide-projects` |
| `reminder` — ایجاد یادآور در چت | فردا ساعت ۱۰ یادآوری کن که پیگیر بازدید ملک بشم. | `native`: تحویل به موتور یادآور فعلی، بدون ساخت خودکار توسط راهنما | `title`, `due` | `projects`, `rent`, `saved` | `guide-reminder` |
| `stay` — اقامت کوتاه‌مدت | می‌خوام اقامت کوتاه‌مدت رو بررسی کنم. | `flow:stay`: فلو داخلی موجود، در صورت نصب | `stay_dates`, `budget` | `services`, `map` | `guide-stay` |
| `build` — ساخت و مصالح | می‌خوام مسیر ساخت و مصالح رو بررسی کنم. | `flow:build`: فلو داخلی موجود، در صورت نصب | `project_type`, `budget` | `services`, `projects` | `guide-build` |
| `development` — پروژه‌های ساختمانی | می‌خوام پروژه‌های ساختمانی رو بررسی کنم. | `flow:mkt`: فلو داخلی موجود، در صورت نصب | `project_type`, `hood` | `invest`, `projects` | `guide-development` |

## Coverage and constraints

- **Core flows** `rent`, `buy`, `sell`, `invest`, and `landlord` enter the existing discovery engine and retain its evidence-backed validation and required financial confirmations. `rent-budget` and `rent-specs` delegate parsing to the existing engine.
- **Neighborhood** comparisons and listing cards show ONLY the internal demonstration dataset. A location mentioned as an *area reference* is not silently converted into a mandatory exact-neighborhood filter. Access and drive-time claims cannot be inferred without verified data.
- **Operations** (`valuation`, `contracts`, `contract-start`, `termination`, `services`, `guaranteed`) delegate to existing guarded in-chat actions. The contract-start route first begins rental discovery; it does not sign a contract. Valuation still requires the existing explicit payment confirmation.
- **Personal data views** (`saved`, `library`, `projects`) show read-only summaries from persisted browser state. Project creation, advanced Library management, report sharing, archived chat management, and reminder editing remain separate pre-existing capabilities rather than falsely advertised in-chat operations.
- **Legacy in-chat workflows** (`stay`, `build`, `development`) are suggested only if their `SCRIPTS` entry is installed. The existing engine remains responsible for completion; this guidance layer never pretends a backend service is completed.
- **Reminder** text delegates to the current reminder parser and confirmation logic. Unsupported natural-language variants remain unsupported; the guide is not a language model.
- **Accessibility**: suggestions are buttons with an accessible group label, keyboard focus, and `input` events after prefill. They are never an auto-submit shortcut.
- **Context**: the guidance node is stored on the same per-chat context as the discovery engine. Cross-chat values must not be copied automatically.

## Historical QA traceability

The existing `qa/coverage-v031.json` contains **25 independently defined mandatory release requirements**. Their acceptance evidence remains binding. The new registry adds `qa/check-guidance.cjs` (action coverage, unique phrases, valid continuation references) and `qa/e2e-deterministic-guidance-v031.cjs` (real-browser prefill, parse, context switching, in-chat services, credit safety, truthful empty states). Both tests run as part of `qa/run-quality-gate.sh`. Do not equate counts of catalog entries with release requirement coverage.

**Known limit:** exact normalized prompts plus explicitly authored aliases are supported; arbitrary Persian wording is NOT understood. Full AI-like free-language routing, live market data, and backend integrations are intentionally outside V0.31.
