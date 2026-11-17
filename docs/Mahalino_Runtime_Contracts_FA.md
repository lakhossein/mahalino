# قراردادهای اجرا و نگهداری ۰.۳۲

## مرز فعال و تاریخی

V0.32 نسخهٔ فعال است. V0.1 تا V0.31 snapshotهای تاریخی‌اند؛ منبع فلو، متن، asset و HTML آنها تغییر نمی‌کند. QA تاریخی برای جلوگیری از regression نگه داشته می‌شود و با QA فعال یکی نمی‌شود. node_modules ورودی بازتولیدپذیر npm است و در Git نگهداری نمی‌شود؛ desktop.ini metadata سیستم عامل است. حذف این دو گروه تاریخچهٔ Git را بازنویسی نمی‌کند. استثنای QA تاریخی فقط به‌روزرسانی hash در check-release-identity نسخهٔ ۰.۳۱ پس از همین پاک‌سازی است؛ دروازهٔ hash حذف نشده است. تست مستقل تغییر runtime تاریخی را ممنوع می‌کند.

بسته‌های ۰.۳۰، ۰.۳۱ و ۰.۳۲ «source قابل ساخت» هستند؛ README، entry سازنده و کدهای وابسته همراه‌اند. بسته‌های قدیمی‌تر runtime-archive هستند. package-manifest.json فهرست دقیق و hash فایل‌ها را دارد؛ ZIP با آن تطبیق داده می‌شود. خروجی قبلی تا پایان ساخت و verify در staging حفظ می‌شود؛ rename نهایی محلی با backup/rollback است، نه ادعای تراکنش اتمی هنگام قطع برق یا deployment اتمی سرویس خارجی.

## مرز داده و API

| مالک | API و مصرف‌کننده | قرارداد |
|---|---|---|
| legacy/utilities.js | S، save()؛ مصرف همهٔ فلوها | boot فقط می‌خواند؛ save نتیجهٔ boolean دارد؛ recovery پیش از overwrite؛ reset نسخه‌ای؛ عدم نوشتن state قدیمی |
| v32-payment.js | E30.pay.begin/go/cancel/refund/recover؛ مصرف shell و dispatch | پرداخت پیش از callback باید durable باشد؛ debit/refund ناموفق rollback در حافظه؛ callback خارجی با localStorage تراکنش مشترک ندارد |
| v32-core.js | pricing، label، price | تعرفهٔ صریح و ثابت؛ ماژول payment پس از تعریف تعرفه درج می‌شود |
| v32-shell.js | E30.init و paidActionRegistry | فقط یک نصب؛ ۱۳ مسیر پولی صریح، بدون بررسی متن تابع؛ guard سپس UX/guide/turns |
| v32-ux.js | E30.uxInit | نصب library سپس sharing سپس project سپس reminder سپس valuation؛ تکرار نصب handler را عوض نمی‌کند |
| legacy/sharing.js | E29.share و E29.safeSharedHTML | snapshot فقط‌خواندنی؛ نمایش و export از sanitizer مشترک می‌گذرند؛ event/action، script، active SVG و scheme اجرایی حذف می‌شوند |
| legacy/error-handler.js | MahalinoDiagnostics.report | حداکثر ۵۰ رخداد شامل code/time/cause-enum/kind؛ بدون reason، message، stack یا متن کاربر |
| legacy/core.js | E29.llm | غیرفعال؛ فعال‌سازی فقط configure صریح؛ status/schema/timeout و callback یک‌بار؛ هدایت همچنان rule-based |

ترتیب فایل‌ها در build-manifest.json و includeهای application.js به‌صورت ماشینی کنترل می‌شود. payment از core به فایل مستقل استخراج شده، ولی هنوز به S/save و APIهای مشترک وابسته است؛ این استخراج ادعای حذف namespace سازگاری نیست؛ هر export/import و write در قرارداد scope-aware ثبت و با gate مقایسه می‌شود.

## همزمانی و شکست

در مرورگر دارای Web Locks، فقط یک تب مالک writer است؛ تب دوم اجازهٔ save/reset ندارد و باید تب اول را ببندد و reload کند. lock تا پایان عمر تب نگه داشته می‌شود. در مرورگر فاقد Web Locks، مقایسهٔ snapshot و storage event از overwrite ترتیبی جلوگیری می‌کند؛ تضمین اتمی برای race دقیق همزمان در این fallback نداریم. merge خودکار موجودی و journal ممنوع است.

saveهای بدون تغییر setItem ندارند؛ JSON.stringify هنوز همگام است. benchmark-state.cjs دادهٔ مصنوعی ۱۰۰، ۱۰۰۰ و ۱۰۰۰۰ پیام و p50/p95 میزبان را اندازه می‌گیرد؛ این شواهد، اندازه‌گیری موبایل یا long-task UI نیست. انتقال storage به IndexedDB/ذخیرهٔ تفاضلی و شکستن همهٔ globalها به API مستقل، کار معماری با تست‌های بیشتر باقی می‌ماند.

## ترتیب wrapperها و محدودیت خطا

پرداخت در زمان بارگذاری تعریف می‌شود؛ closeModal پرداخت، روی تابع عمومی نصب می‌شود؛ wrapperهای legacy سپس E30.init و وصلهٔ composer نصب می‌شوند؛ E30.uxInit handlerهای sharing/project/reminder را نهایی می‌کند. نام handlerهای پولی از registry، نتیجهٔ نصب از legacyPayGuarded و idempotency از تست مرورگر قابل بررسی است. حذف wrapperهای تاریخی بدون characterization مجاز نیست.

گزارش Promise عمومی و شکست E28 boot اضافه شده است. هر catch مدیریت‌شده با شناسهٔ محل و cause از enum محدود ثبت می‌شود؛ fallbackها non-blocking باقی می‌مانند و خطاهای لازم با kind=fault پیام قابل مشاهده دارند. قرارداد scope-aware برای imports/exports/writes و loadOrder در runtime-dependencies.json ثبت و دقیقاً تست می‌شود؛ namespace سازگاری همچنان عمومی است.
