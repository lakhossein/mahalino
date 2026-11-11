# ARCHITECTURE — Mahalino+ V0.27

## شکل کلی
تک‌فایل HTML (HTML + CSS + JS درون‌خطی، RTL، فونت Yekan Bakh FaNum محلی) که از `V0.26` با `build_v027.js` (الگوی assert-per-replacement) ساخته می‌شود. موتورهای لایه‌ای قبلی حفظ شده‌اند: E21 (پیوست‌ها/اجزا/زمینه)، E22 (تم/تاریخچه)، E23 (سناریوهای مستقل)، E24 (اعتمادپذیری)، E25 (کمیسیون/یادآور/…)، E26 (تلهٔ فوکوس/ترمیم داده) — و لایهٔ جدید **E27**.

## وضعیت حذف مسیرها (Routes)
| مسیر/صفحه قبلی | وضعیت در V0.27 | جایگزین |
|---|---|---|
| `#v-home` (صفحهٔ اصلی) | **حذف کامل** (VIEWS + view shell + CSS مرتبط عملاً بی‌مرجع) | منوی گفت‌وگویی `gate` |
| `#v-dash` (داشبورد + چت داک) | **حذف کامل** | مودال `E27.reqModal` + گفت‌وگو |
| چت شناور `#fchw` + FAB | **حذف کامل** | فضای گفت‌وگوی اصلی |
| فوتر ناوبری | **حذف کامل** | سایدبار + گفت‌وگو |
| آکاردئون فلوها در سایدبار | **حذف** | شروع فلو از گفت‌وگو (`ceSmart`/chips) |
| کامپوزرهای fch/dash | **حذف** | تک‌کامپوزر `#chatCwr` |
| صفحات rent/buy/invest/mkt/build/stay/grt/svc/map/profile | نگه‌داشته‌شده به‌عنوان سطح ثانویه — **فقط از درون گفت‌وگو** باز می‌شوند؛ از ناوبری حذف شدند | `ceSmart`، هنداف E21، `ceStart` |

## فضاهای اصلی (Workspace)
۱. **سایدبار** (`renderSidebar` بازنویسی): گفت‌وگوی جدید، جست‌وجو (عنوان + متن پیام‌ها)، تاریخچهٔ گروه‌بندی‌شده، سنجاق/تغییر‌نام/حذف، جمع‌کردن (`body.sidefold`)، تم/کیف‌پول/حساب/تنظیمات.
۲. **فضای گفت‌وگو** (`VIEWS.landing`): `#chatB` + پیشنهادها + تک‌کامپوزر. همهٔ قابلیت‌ها از همین‌جا در دسترس‌اند.
۳. `go(v)` با گارد: `home|dash → landing`.

## لایهٔ E27 (جدید)
- `E27.marketHTML(o)` — کامپوننت هوش بازار (KPI/روند/مقایسه/بازه) با کنترل‌های درجای `CBACT.mktCtl`.
- `E27.budgParse/budgEff/rentBEff` — تحلیل زبان طبیعی بودجه و مقادیر مؤثر.
- `E27.wf/wfHandle/wConfirm` + `CBACT.wMenu/wTopup/wPay/wMethod/wRetry/wCancel/wTx/wTok/wBuyPack` — کیف پول گفت‌وگویی با درگاه نمایشی و گارد تراکنش تکراری.
- `E27.reqModal` — مودال درخواست‌ها (جایگزین داشبورد).
- `E27.userImg/baImg` + listenerهای document-level برای لغزندهٔ Before/After و بارگذاری عکس کاربر.
- `CBACT.pcardMore/mktMore/baZoom` — Progressive Disclosure و زوم.
- wrap بیرونیِ `ceSend` برای رهگیری جریان شارژ؛ wrap تاریخی `renderSidebar` (E22) حفظ ولی `afterSidebar` بی‌اثر شد (سایدبار جدید خودکفا است).

## داده
همه‌چیز در یک کلید `localStorage['mahalino_v18']` (زنجیرهٔ legacy: v17/v16/khanyar_v15 فقط خواندنی) — `save()` واحد. گفت‌وگوها: `S.chats` (سقف ۱۲ غیرسنجاق + سقف پیام ۶۰). تراکنش‌های کیف: `S.wlog` با `tx` یکتا.

## دارایی‌ها
`assets/fonts/yekan-bakh/*`، `assets/leaflet/*`، `assets/img/emptying-{before,after}.jpg` (دموی شبیه‌سازی‌شده با زاویهٔ یکسان)، فونت‌های IRANSansX در ریشه (سازگاری با V0.26).
