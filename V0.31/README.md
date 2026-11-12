# محلینو+ — نسخهٔ ۰.۳۱

این نسخه ادامهٔ توسعهٔ نسخهٔ ۰.۳۰ است و اصلاحات گفت‌وگوی پیشنهادی، کارت بودجهٔ ودیعه/اجاره، سایدبار، کتابخانهٔ تمام‌صفحه، تاریخ یادآورها و واحد اعتبار «کلید» را شامل می‌شود.

## استقلال پوشه و منشأ

- پوشهٔ `V0.30` در این تغییر دقیقاً به وضعیت قبل از کامیت `179a6d4` برگردانده شده است؛ تغییرات مزبور فقط در این پوشه قرار دارند.
- فایل نهایی: `Mahalino+V0.31.html`.
- سازندهٔ `build_v031.js` فقط فایل `base/Mahalino+V0.29.html` و منابع `src/v31-*.js` و `src/v31*.css` **در همین پوشه** را می‌خواند.
- همهٔ منابع اجرایی (تصاویر، فونت‌ها، Leaflet و آیکون‌ها) در `assets/` و ریشهٔ همین پوشه نگهداری می‌شوند.
- برای حفظ داده‌های محلی، کلید جدید `mahalino_v31` است و به‌صورت یک‌طرفه داده‌های موجود از `mahalino_v30` یا نسخه‌های قدیمی‌تر قابل واردکردن‌اند؛ ۰.۳۱ کلید نسخهٔ ۰.۳۰ را بازنویسی نمی‌کند.
- موتور داخلی برای سازگاری هنوز نام `E30` دارد، ولی نسخهٔ نمایشی `0.31` گزارش می‌شود.

## ساخت مستقل

```sh
node V0.31/build_v031.js
```

برای آزمودن استقلال، تنها پوشهٔ `V0.31` را به یک مسیر جدا منتقل و فرمان `node build_v031.js` را اجرا کنید.

## دروازهٔ الزامی انتشار

```sh
npm ci --prefix V0.31/qa
V0.31/qa/node_modules/.bin/playwright install --with-deps chromium
bash V0.31/qa/run-quality-gate.sh
```

تمام آزمون‌های نسخه، بررسی ۲۵ الزام، آزمون مستقل سناریوهای جدید، تطابق خروجی با سازنده و وجود منابع محلی باید موفق باشند. فایل‌های `node_modules` جزو وابستگی اجرایی وب نیستند و فقط با `package-lock.json` برای آزمون نصب می‌شوند.

## محدودهٔ عملکرد

این نسخه یک نمونهٔ نمایشی است. احراز هویت، پرداخت و ثبت قرارداد، سرویس عملیاتی رسمی ندارند و داده‌های بازار نمونه‌ای‌اند؛ آزمون موفق مرورگر به معنی صحت حقوقی یا اتصال واقعی به ارائه‌دهندگان نیست.

## Deterministic guided prompt journeys (no AI)

The in-chat guide in `src/v31-guidance.js` is a curated, rule-based registry of 25 preview scenarios and 53 exact/alias Persian prompts. It offers stage-sensitive prompts after applicable assistant messages, lets the user **prefill and edit** the chat composer, and executes only registered actions or the existing guarded flows when explicitly sent. All listing comparisons are labeled synthetic; no AI API or live backend is called. The design and scenario acceptance matrix are documented in `qa/SCENARIO-REGISTRY-V031.md`. The acceptance script includes deterministic-registry and real-browser tests; the existing 25 mandatory QA journeys remain binding.
