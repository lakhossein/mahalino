# BUGFIX-REPORT — Mahalino+ V0.28

ریشه‌ها و اصلاحات ۱۲ مورد درخواستی (جزئیات تست در QA-REPORT).

| # | بهبود | ریشه | اصلاح پیاده‌شده |
|---|---|---|---|
| 1 | کارت‌های محله | `chatHoodCard` کارت فشرده با `<small>` تک‌خطی | بازنویسی به `.hcard`: هدر (تصویر/نام/نمره) + گرید ۶ سلول داده با برچسب/مقدار جدا + بلوک مکان‌ها + اکشن‌ها؛ CSS مستقل با توکن‌های Design System |
| 2 | فرم قرارداد خارج از چت | `ctr0.acts.open` → `d.step=7; go('rent')` | فرم‌های صفحه (conParty/conProp/conReview/conFinish) در حباب گفت‌وگو با `data-e28ctr` رندر می‌شوند؛ `conKind` wrap شد تا در landing هم kind درست باشد؛ ۷ هندلر ACT wrap شدند تا پس از اجرا `E28.ctrRefresh` حباب را از وضعیت `D.ctr` بازسازی کند؛ ورودی‌ها بین گام‌ها در state می‌مانند؛ پس از ثبت، پیام ادامهٔ فسخ |
| 3 | کندی اسلایدر | style راست روی هر event input؛ بدون preload؛ بدون ابعاد تصویر | rAF batching (`E28.baPaint` + گارد `_pv`)، pointer drag با setPointerCapture، preload هر دو تصویر، width/height/decoding=async، `contain:content`، `will-change:clip-path`، کیبورد (role=slider + ArrowLeft/Right) |
| 4 | وضعیت فسخ | `ACT.tpay` فقط `T.paid/done` می‌گذاشت؛ قرارداد signed می‌ماند | `E28.applyTermination(code)`: status→terminated (نمایش «فسخ‌شده»)، doc.status، statusTrail (تاریخچهٔ وضعیت قبلی)، terminatedAt، درخواست فسخ؛ گارد دوگانهٔ تکرار؛ عدم تغییر در فسخ ناتمام |
| 5 | کشف فلوها | ورودی‌ها فقط در منوهای قدیمی/متن راهنما بودند | `E28.discoverChips()` در پیام خوش‌آمد (۴ گروه) + `E28.welcomeSuggestions()` در ردیف بی‌فلو + مسیرهای آزاد «ثبت قرارداد»/«فسخ قرارداد» با هدایت به فرم/termq |
| 6 | اکشن‌های پیام | cr() فقط متن+چیپ می‌رندید | `E28.msgActs(m,ix)` — نوار شناور آیکونی؛ CBACT: mCopy (clipboard+fallback)، mEdit (بازگردانی متن+حذف)، mDel؛ نمایش هاور/لمس؛ Regenerate عمداً پیاده نشد |
| 7 | یادآور | مدل E25 (title/due/amt/done) بدون تشخیص خودکار/مدیریت کامل | مدل کامل + نرمال‌سازی بوت + `E28.remAuto` (نیت+زمان+ساعت+تکرار+شفاف‌سازی+تکراری‌گارد) + دفتر با فیلتر/انجام/تعویق/ویرایش/حذف + remTick در ppmTick + Notification (اجازه‌دار) + دورهٔ بعدی خودکار برای تکرارشونده‌ها |
| 8 | کامپوزر کوچک | `.cwr-in` 38px تک‌خطی با max 120px | کادر مستقل گرد با padding راحت؛ auto-grow تا ۲۰۰px؛ دکمه‌های ۴۰px؛ گارد IME در Enter |
| 9 | دکمه‌های ثابت پایین | `ctxSuggestions` ردیف همیشگی می‌ساخت | بازنویسی: فلو→خالی، خوش‌آمد→کشف، سایر صفحات→بازگشت؛ `host.hidden=!items.length` + CSS `[hidden]` |
| 10 | هاور تاریک | hover روی var(--bg)/surface-2 که در تاریک تقریباً همرنگ بود | توکن‌های --hov/--hov2/--sel در :root و [data-theme=dark]؛ اعمال روی ۱۰ کلاس تعاملی؛ تفکیک selected از hover |
| 11 | متن زائد | متن‌های توضیحی بلند در کیف/درگاه/بازیابی/تحلیل/بازار/فرم | ۹ جایگزینی فشرده‌سازی؛ برچسب‌های ضروری کوتاه ماندند («درگاه نمایشی»، «نمونهٔ نمایشی») |
| 12 | آیکون‌های ناهماهنگ | ICONS دست‌ساز + ایموجی 📌/📍 + E27_IC/E22.ICO جدا | دانلود رسمی Tabler outline (MIT) در assets/icons + build-time inliner؛ سه نگاشت آیکون یکجا Tabler شد؛ pin/pin-off؛ stroke 2 یکدست؛ بدون CDN |

## باگ‌های حین پیاده‌سازی (یافت و رفع شد)
- `E28.baPaint` در بلوک E27 قبل از تعریف E28 اجرا می‌شد → کل listenerهای اسلایدر در try می‌افتادند → انتقال تعریف به بلوک E28.
- regex عنوان یادآور: `\s` داخل template literal به `s` تبدیل می‌شد → دوباره‌نویسی با `\\s`.
- چیپ‌های `!trm28` از مسیر ceVal بی‌پاسخ می‌ماندند → دکمه‌های data-cba جایگزین شدند.
- گارد CE.f='gate' مانع نمایش پیشنهادهای خوش‌آمد می‌شد → چیپ‌های کشف مستقیماً داخل پیام gate.
