# Mahalino+ V0.29 — Persona Research: Sales & Property Ownership Workflows
**Scope:** Property Sales (WF-SALE), Property Listing & Ownership (WF-OWN), Guaranteed Rent (WF-GRT)
**Agent persona:** friendly Iranian real estate agent ("مشاور") — informal, warm, Persian (RTL)
**Simulation note:** All transcripts are multi-turn persona simulations produced by the Sales/Owner Agent workstream. `[decision point: ...]` annotations mark where V0.29 adaptive logic must branch.

## Field ID glossary (used below)
- Owner: `owner_name`, `owner_phone`, `owner_city`, `owner_abroad`, `contact_window`
- Property: `prop_id`, `prop_type`, `prop_area`, `prop_rooms`, `prop_age`, `prop_floor`, `prop_parking`, `prop_elevator`, `prop_neighborhood`, `prop_address`, `prop_condition`, `furnishing`
- Legal: `doc_status` (سند تک‌برگ / قولنامه‌ای / ارثی), `co_owner_count`, `heir_status`, `liens` (بدهی/توقیف)
- Sale: `sale_urgency`, `sale_reason`, `expected_price`, `min_price`, `price_basis`, `payment_terms`, `target_timeline`
- Rent: `rent_amount`, `deposit_amount`, `rent_model`, `tenant_pref`, `vacancy_tolerance`
- Management: `mgmt_preference` (خودم / پلتفرم / اجاره تضمینی), `mgmt_fee_accept`, `grt_payout`, `grt_guarantee_months`
- Listing: `listing_photos`, `visit_availability`

---

## WF-SALE-P01 — Property Sales × مهدی — Quick-cash seller
**Persona definition:** مهدی، ۴۲ ساله، مالک یک آپارتمان ۸۵ متری در تهرانپارس. به دنبال فروش سریع است چون به پول نقد فوری برای تسویه تعهدات کاری نیاز دارد.
**Motivation:** Needs liquidity within ~6-8 weeks; price is secondary to speed and certainty of the deal.
**Circumstances:** Small business owner with a payment deadline; apartment is vacant, single deed (سند تک‌برگ), no liens.
**Priorities:** Speed of closing > price; buyer must pay cash (کل پول), no installments.
**Initial approach:** Opens bluntly: "می‌خوام سریع بفروشم، قیمتت کمتر از بازار هم مهم نیست."
**Questions to ask:** (adaptive priority)
1. چقدر عجله داری؟ (sale_urgency → target_timeline)
2. سندت تک‌برگه؟ بدهی یا توقیف نداره؟ (doc_status, liens)
3. قیمت حدودی تو ذهنته؟ (expected_price)
4. خیابون/متراژ/سن بنا؟ (prop_area, prop_age, prop_address)
5. خالی هست یا مستأجر داره؟ (prop_condition, tenant status)
6. پارکینگ و آسانسور؟ (prop_parking, prop_elevator)
7. پول کامل می‌خوای یا چک هم قبوله؟ (payment_terms)
8. عکس از خانه داری؟ (listing_photos)
**Questions to avoid:**
1. "چرا می‌خوای بفروشی؟" — sensitive debt context; ask indirectly only if needed.
2. Detailed renovation questions — irrelevant for fast-cash sale.
3. Long tenant-preference questionnaires — unit is vacant.
4. "قیمت دلخواهت چنده؟" as opening — premature before urgency is established.
**Required info:** sale_urgency, target_timeline, prop_type, prop_area, prop_neighborhood, doc_status, liens, expected_price, payment_terms
**Optional info:** prop_rooms, prop_age, prop_floor, prop_parking, prop_elevator, listing_photos, visit_availability, prop_condition
**Conditional questions:**
- IF sale_urgency = فوری THEN probe price flexibility: "برای فروش سریع، چند درصد زیر قیمت بازار می‌ری؟" (min_price)
- IF doc_status ≠ سند تک‌برگ THEN escalate to human agent + warn on timeline.
- IF tenant occupies THEN ask vacate date before listing (vacancy_tolerance).
**Alternative paths:** If timeline unrealistic (<3 weeks), offer guaranteed-rent bridge (WF-GRT) as temporary income while selling; if liens found, route to legal-assist flow.
**Completion criteria:** price range + timeline + doc status + payment terms captured AND listing confirmed by owner.
**Recovery scenarios:** Owner gives only "خودت قیمت بده" → offer comparative estimate first, ask for reaction instead of forcing expected_price. Owner ghosts after pricing → send one soft follow-up with market snapshot.

### Transcript 1 — normal success
کاربر: سلام، آپارتمان ۸۵ متری تو تهرانپارس دارم، می‌خوام تا آخر ماه بفروشمش.
[decision point: sale_urgency = فوری → prioritize payment_terms & doc_status next]
مشاور: سلام مهدی جان! خوش اومدی. تا آخر ماه یعنی تقریباً سه هفته‌ای. یه سؤال مهم: سندت تک‌برگه؟ بدهی یا توقیفی رویش نداره؟
کاربر: تک‌برگه، کاملاً تمیزه.
مشاور: عالیه، این خیلی کار رو سریع می‌کنه. خالیه یا کسی توش زندگی می‌کنه؟
کاربر: خالیه، دو ماهه خالیه.
[decision point: vacant → skip tenant questions, go to price]
مشاور: خوبه. قیمت حدودی تو ذهنته؟ مثلاً چند میلیارد؟
کاربر: بازارش الان حدود ۵ میلیارده ولی من حاضرم ۴ میلیارد و ۸ بدم تا سریع بفروشه.
[decision point: expected_price below market → confirm min_price floor]
مشاور: پس فهمیدم، استراتژی «قیمت رقابتی برای فروش سریع». یه حد پایین هم برام بگو که زیرش نرم، که وقت خریدارهای جدی رو نگه دارم.
کاربر: ۴ و نیم دیگه، زیر اون نه.
مشاور: ثبت کردم. پول کامل می‌خوای یا چک شرکتی هم اوکیه؟
کاربر: فقط کامل، همون روز.
مشاور: فهمیدم. پارکینگ و آسانسور داره؟ طبقه چندمه؟
کاربر: طبقه ۴، یه پارکینگ، آسانسور داره، ۱۲ ساله ساختمان.
مشاور: خب تقریباً همه‌چیز رو دارم. فقط چند تا عکس خوب از آشپزخونه و اتاق‌ها بفرست، امروز آگهی رو آماده می‌کنم و دو تا خریدار جدی که دارم رو هم‌زمان خبر می‌کنم.
کاربر: باشه، عکسا رو الان می‌فرستم.
مشاور: ممنون مهدی جان. خلاصه: تهرانپارس، ۸۵ متر، ۴/۸ تا ۵ میلیارد، حداقل ۴/۵، فقط پول کامل، سند تک‌برگ. تا امشب آگهی برات میاد که تأیید کنی.
[decision point: summary confirmation → owner confirm before listing goes live]

### Transcript 2 — incomplete/ambiguous
کاربر: می‌خوام خونه‌م رو بفروشم، هرکی بخره زودتر.
مشاور: چه خوب که اومدی! برای اینکه درست بازارش کنم، خونه کجاست؟ محله رو بگو برام.
کاربر: تهرانپارس ولی دقیق آدرس رو بعداً می‌دم.
مشاور: اشکال نداره، تهرانپارس کافیه برای شروع. چند متره؟
کاربر: حدوداً... فکر کنم ۹۰؟ شایدم ۸۵.
[decision point: ambiguous prop_area → hold, verify later at visit; don't block]
مشاور: ملمه، موقع بازدید دقیقش می‌کنیم. قدیمیه یا نوسازه؟
کاربر: ۱۵ سالش هست.
مشاور: و قیمت؟ چیزی تو ذهنت هست یا می‌خوای من پیشنهاد بدم؟
کاربر: خودت بگو، من قیمت نمی‌دونم.
[decision point: no expected_price → give market estimate, ask for reaction]
مشاور: باشه، برای ۹۰ متری تهرانپارس با ۱۵ سال عمر، الان بازار حدود ۵ تا ۵/۵ میلیارد می‌چرخه. با این حرفت که «زودتر بفروشه»، ۵ میلیارد یه قیمت خیلی خوش‌فرصته. این عدد برایت منطقیه؟
کاربر: آره، همین خوبه.
مشاور: سندت هم تک‌برگه؟
کاربر: فکر کنم قولنامه‌ایه... یا نه، مامانم گفته سند داره.
[decision point: uncertain doc_status → flag as blocking item, escalate]
مشاور: این یکی خیلی مهمه و نمی‌شه «حدس» زدش. یه کار کن: برگه‌ای که دستته رو عکس بگیر بفرست، من نگاه می‌کنم و دقیق می‌گم. فروش قولنامه‌ای یه مسیر متفاوته و باید از الان بدونم.
کاربر: باشه امشب می‌فرستم.
مشاور: ممنون. پس فعلاً: تهرانپارس، ~۹۰ متر، قیمت حدود ۵ میلیارد، و منتظر عکس سندم. تا سند مشخص نشه آگهی رو «پیش‌نمایش» نگه می‌دارم، اوکیه؟
کاربر: اوکیه.

### Transcript 3 — preference change/correction
مشاور: مهدی جان، دوتا بازدید برای فردا تنظیم کردم، هر دو خریدار پول کامل.
کاربر: صبر کن، نظرش عوض شد. نمی‌خوام دیگه زیر قیمت بفروشم.
[decision point: expected_price change → re-open pricing, keep urgency context]
مشاور: باشه، چه عددی تو ذهنت شکل گرفته؟
کاربر: ۵/۵، مثل بقیه بازار. عجله‌ام هم تموم شد، وامم تمدید شد.
[decision point: sale_urgency changed → re-classify persona toward max-value]
مشاور: پس استراتژی‌مون عوض می‌شه: از «فروش سریع» می‌ریم رو «فروش با قیمت خوب». فقط یادت باشه قیمت ۵/۵ معمولاً دو سه ماه زمان می‌بره. اوکیه؟
کاربر: آره، دیگه عجله ندارم.
مشاور: پس حداقل ۵/۵ ثبت شد، آگهی رو هم به‌روز می‌کنم. اگه تا دو هفته بازدید جدی نیومد، بهت خبر می‌دم که تصمیم بگیریم.
کاربر: ممنون.

---

## WF-SALE-P02 — Property Sales × فرزانه — Maximum-value seller
**Persona definition:** فرزانه، ۵۵ ساله، مالک آپارتمان ۱۳۵ متری در ونک. فروشنده صبور؛ می‌خواهد بالاترین قیمت ممکن را بگیرد، حتی اگر فروش چند ماه طول بکشد.
**Motivation:** Asset is her retirement fund; wants to squeeze full market value and avoid being rushed by buyers.
**Circumstances:** Unit is renovated, vacant, full deed; she follows the market weekly and knows comparable listings.
**Priorities:** Price > speed; negotiation support; not listing "cheap" — embarrassed if neighbors learn she sold below market.
**Initial approach:** Opens with market skepticism: "همه می‌گن بازار پایینه، من باور ندارم."
**Questions to ask:**
1. خودت چه عددی برای واحدت می‌زنی؟ (expected_price, price_basis)
2. این عدد رو بر اساس چی گفتید؟ فایل مشابه دیدید؟ (price_basis)
3. چند وقت حاضری صبر کنی؟ (target_timeline)
4. ترمیم/نوسازی کردید؟ (prop_condition)
5. سند و وضعیت حقوقی؟ (doc_status, liens)
6. کف معامله‌ات چقدره؟ (min_price)
7. مایل به پیش‌فروش یا معاوضه هستی؟ (payment_terms)
**Questions to avoid:**
1. "فوری می‌خوای بفروشی؟" — she is the opposite; would break trust.
2. Discount-for-speed framing — insulting to her goal.
3. "چرا این‌قدر گرون می‌خوای؟" — confrontational.
4. Deep personal finance questions — none of our business.
**Required info:** expected_price, price_basis, min_price, target_timeline, prop_area, prop_neighborhood, doc_status, prop_condition
**Optional info:** prop_rooms, prop_age, prop_floor, prop_parking, listing_photos, visit_availability, payment_terms
**Conditional questions:**
- IF expected_price > market estimate +10% THEN present comparables ("سه فایل مشابه تو همین محله این قیمت‌ها رو داشتند") and ask if she wants to anchor high anyway (listing vs. market tension).
- IF target_timeline > 6 months THEN offer "قیمت بالاتر + بازاریابی طولانی" mode and monthly price-review touchpoint.
- IF owner refuses price cut after 60 days without offers THEN suggest structured price review, not unilateral.
**Alternative paths:** Rent it furnished short-term while waiting (WF-OWN); guaranteed rent as income bridge without touching sale price.
**Completion criteria:** expected_price + min_price + timeline + doc status captured AND owner approves listing copy with price framing.
**Recovery scenarios:** Owner cites an inflated ask from a neighbor → compare via comps, ask "چقدر به این فایل‌ها اعتماد می‌کنی؟". Owner suspicious agent wants quick commission → reassure with price-review commitment in writing.

### Transcript 1 — normal success
کاربر: سلام، یه آپارتمان تو ونک دارم ۱۳۵ متری، می‌خوام بفروشم ولی قیمت الکی نمی‌دم به هیچ‌کس.
مشاور: سلام خانم فرزانه، خوشحالم که با مالینو هستید. کاملاً درکتون می‌کنم — اول ببینیم ارزش واقعی‌ش چنده، بعد قیمت بذاریم. خودتون چه عددی برای واحدتون می‌زنید؟
کاربر: همسایه‌مون بالا خونه‌ش رو ۱۳ میلیارد فروخت، من هم می‌خوام ۱۳.
[decision point: expected_price anchored to one comp → validate with broader price_basis]
مشاور: دیدم. اون فایل رو می‌دونم — طبقه ۸ نوساز بود با پارکینگ دوبل. واحد شما چند طبقه‌ست و ساختمان چند سالشه؟
کاربر: طبقه ۳، ساختمان ۱۰ ساله، ولی کامل بازسازی کردم، دو سال پیش.
مشاور: بازسازی خیلی وزن داره. پس بذارید این‌طور بگم: فایل‌های مشابه بازسازی‌شده تو ونک الان بین ۱۱/۵ تا ۱۲/۵ معامله می‌شن. ۱۳ کمی بالای سقفه. چند وقت حاضرید صبر کنید؟
کاربر: شش ماه تا یه سال هم بشه، عجله‌ای ندارم.
[decision point: long timeline → allow high anchor with review plan]
مشاور: باشه، پس ۱۳ می‌ذاریم ولی با یه قرارداد شفاف: هر ۶۰ روز یه مرور قیمت با هم انجام می‌دیم بر اساس بازدیدها. حداقل معامله‌تون هم چنده؟
کاربر: زیر ۱۲ هرگز.
مشاور: ثبت شد: ۱۳ گذاشتن، کف ۱۲، مرور هر ۶۰ روز. سند تک‌برگه؟
کاربر: بله، تک‌برگ تو اسم خودم.
مشاور: عالی. حالا بهترین بخش: چند تا عکس خوب از بازسازی و سالن بفرستید، چون بازارسازی درست یعنی خریدار از عکس عاشق بشه قبل اینکه قیمت ببینه!
کاربر: باشه، تا امشب می‌فرستم.
مشاور: ممنون. تا فردا پیش‌نویس آگهی میاد که تأیید کنید، با همون قاب‌بندی گرون که می‌خواستید.
[decision point: confirm listing framing before publish]

### Transcript 2 — incomplete/ambiguous
کاربر: خونه‌مون رو می‌خوایم بفروشیم ولی قیمتش رو نمی‌دونیم، شما بگید.
مشاور: خوش اومدید! خونه کجاست؟
کاربر: ونک. ولی دو تا مالکیم، من و شوهرم. آخری کیه باید قیمت بده؟
[decision point: co_owner_count = 2 → confirm both decision-makers present]
مشاور: بهتره هر دوتون بشنوید، ولی خب یه نفر نماینده تصمیم بگیره. مگر نه؟ چه کسی نهایی می‌کنه؟
کاربر: من نهایی می‌کنم.
مشاور: باشه. چند متره و چه سالی ساخته شده؟
کاربر: مترش رو... شوهرم می‌دونه، فکر کنم ۱۱۰؟ سندش هم مشخصه.
مشاور: باشه، متراژ رو از سند چک می‌کنیم — خیلی وقت‌ها سند و واقعیت فرق داره. الان برای تخمین با ۱۱۰ می‌رم جلو، اوکیه؟
کاربر: اوکی.
[decision point: estimate conditional on unverified area → show range, verify later]
مشاور: برای ۱۱۰ متری ونک، بازه‌ی بین ۱۰ تا ۱۲ میلیارد می‌بینم، بسته به طبقه و بازسازی. طبقه چندمه و بازسازی کرده‌اید؟
کاربر: طبقه ۵. بازسازی نه، ولی تمیزه.
مشاور: پس واقع‌بینانه حدود ۱۰/۵ تا ۱۱. دو تا سؤال: می‌خواید بالای بازه بمونید و صبر کنید، یا وسط بازه بذارید که سریع‌تر معامله شه؟
کاربر: هنوز نمی‌دونیم... باید با شوهرم صحبت کنم.
مشاور: طبیعیه. پس فعلاً هیچ قفلی نمی‌زنم. خلاصه‌ی امروز: ونک، ~۱۱۰ متر، بازه ۱۰/۵–۱۱، تصمیم قیمت بعد از مشورت خانوادگی. عکس سند رو هم بفرستید که متراژ دقیق رو بگیرم. هر وقت آماده بودید ادامه می‌دیم.
[decision point: defer pricing → save session, no listing yet]

### Transcript 3 — preference change/correction
مشاور: خانم فرزانه، بعد از سه هفته، شش بازدید داشتیم ولی هیچ پیشنهادی نیومد بالای ۱۱/۸.
کاربر: پس یعنی قیمت رو باید بیارم پایین، آره؟ ولی نمی‌خوام ضعیف دیده بشم.
[decision point: price review → reframe as strategy, not surrender]
مشاور: اصلاً این نذار و اون نذار نیست — داده‌ست. شش بازدید یعنی آگهی جذابه، ولی خریدارها سقف رو بالاتر از ۱۲ نمی‌بینن. پیشنهادم: بیایم رو ۱۲/۵ که تو قلب بازه‌ست. معنی‌ش اینه نه ضعیف شدید، نه گیر کردید.
کاربر: باشه، ۱۲/۵ ولی زیر ۱۲ نمی‌فروشم.
[decision point: min_price re-confirmed after change]
مشاور: دقیقاً، کف همون ۱۲ می‌مونه و به هیچ‌کس نمی‌گم غیر از اینه. آگهی رو همین امشب به‌روز می‌کنم و به اون سه نفر که قبلاً بازدید کردن خبر می‌دم.
کاربر: خیلی ممنون.

---

## WF-SALE-P03 — Property Sales × کاوه — Multi-property owner selling one
**Persona definition:** کاوه، ۴۸ ساله، مالک سه ملک (پونک، نارمک و یک ملک روستایی). می‌خواهد فقط آپارتمان پونک را بفروشد تا نقدینگی بسازد، بقیه را نگه می‌دارد.
**Motivation:** Portfolio rebalancing — sell the least productive asset, keep the rest.
**Circumstances:** Financially literate; manages his own properties; time-poor, wants efficiency not hand-holding.
**Priorities:** Efficient process, correct valuation relative to his other assets, minimal visits.
**Initial approach:** "سه تا ملک دارم، یکی‌شون رو می‌خوام بفروشم، وقت هم کمه."
**Questions to ask:**
1. کدوم ملک رو می‌خوای بفروشی و چرا اون یکی؟ (prop_id selection, sale_reason)
2. مشخصات فنی واحد پونک؟ (prop_area, prop_age, prop_floor, prop_parking)
3. مستأجر داره؟ قراردادش کی تموم می‌شه؟ (prop_condition, tenant status)
4. قیمت انتظاریت؟ (expected_price)
5. پول فروش رو کجا می‌بری؟ لازمه بدونی چقدر عجله داری؟ (sale_urgency)
6. عکس داری یا بذار عکاس بره؟ (listing_photos)
7. بازدید رو کی‌ها ببینن؟ ساعات خاصی؟ (visit_availability)
**Questions to avoid:**
1. Details about his other properties beyond a one-liner — he won't sell them now.
2. Repeating basic questions he already answered in a previous session — confirm-and-reuse instead.
3. Motivational/educational filler — he knows the market.
4. Asking him to fill forms — he'll drop off.
**Required info:** prop_id, prop_type, prop_area, prop_neighborhood, prop_condition, tenant_status, expected_price, doc_status
**Optional info:** prop_age, prop_floor, prop_parking, prop_elevator, listing_photos, visit_availability, payment_terms, min_price
**Conditional questions:**
- IF tenant occupies THEN IF lease ends < 2 months → list immediately; ELSE ask owner whether to sell occupied or wait (sells faster vacant).
- IF expected_price spans a wide range THEN ask which of his other assets sets the benchmark (price_basis).
- IF owner has sold with us before THEN confirm stored data before reuse: "آدرس پونک همون [X] باقی مونده؟"
**Alternative paths:** Cross-sell guaranteed rent for the نارمک unit he keeps; suggest renting the روستایی land via listing flow.
**Completion criteria:** selected property + full spec + price + tenant/deed status captured AND owner confirms reuse of any previously stored fields.
**Recovery scenarios:** Owner mixes up which unit he wants to sell mid-chat → restate the portfolio in one line and re-confirm. Missing photos → offer platform photographer visit.

### Transcript 1 — normal success
کاربر: سلام. کاوه‌ام، سه تا ملک دارم. آپارتمان پونک رو می‌خوام بفروشم، اون دوتای دیگه دست‌نخورده بمونن.
مشاور: سلام کاوه جان، خوش اومدی. پس فقط پونک، ثبت شد. چرا دقیقاً پونک رو انتخاب کردی؟
کاربر: چون اجاره‌ش کم بازده‌ست، پولش رو می‌خوام جای دیگه بچرخونم.
مشاور: منطقیه. از قبل با مالینو کار نکرده بودی؟ ببینم تو پروفایل چیزی داری...
[decision point: check stored profile → confirm-before-reuse rule]
کاربر: نه، بار اوله.
مشاور: باشه. پس از صفر: چند متره، چه سالی، چند خوابه؟
کاربر: ۱۰۵ متر، ۹ سالش، دو خوابه، طبقه ۶ از ۸، پارکینگ سندی، آسانسور.
مشاور: دستت درد نکنه، یک‌جا گفتی، خیلی سریع رفتیم. مستأجر داره؟
کاربر: آره، قراردادش تا خرداده.
[decision point: tenant with lease → choose occupied vs vacant sale path]
مشاور: خب دو تا راه داری: الان با مستأجر بفروشی — خریدار مالک‌محل کمتره و معمولاً قیمت می‌کشه پایین — یا تا خرداد صبر کنی. کدوم؟
کاربر: خودم دوست دارم صبر کنم ولی پول لازم دارم. بیا همین الان با مستأجر بفروش.
مشاور: باشه، پس توی آگهی شفاف می‌نویسیم «اجاره تا خرداد، تخلیه‌شده». قیمت انتظاریت چنده؟
کاربر: حدود ۷ میلیارد.
مشاور: با این مشخصات تو بازه‌ی بازار ۶/۸ تا ۷/۲ هستی، پس ۷ عدد درستیه. سندش تک‌برگه؟
کاربر: تک‌برگه.
مشاور: عکس داری؟ یا بگم عکاس ما بره، رایگانش رو دو داری بگو.
کاربر: عکاس بیاد بهتره. بازدید هم فقط بعدازظهرها، ساعت کاریم آزاد نیست صبح.
مشاور: حتماً، توی پرونده ثبتش کردم. عکس‌ها رو امشب می‌فرستی یا عکاس بره؟
کاربر: خودم چند تا دارم، می‌فرستم.

### Transcript 2 — incomplete/ambiguous
کاربر: راستش الان مطمئن نیستم پونک رو بفروشم یا نارمک رو. هر دو رو دارم، پول فقط یه‌جا لازمه.
مشاور: باشه، هیچ قفلی نمی‌زنم — دوتاش رو کنار هم می‌چینیم که تصمیم راحت‌تر شه. پونک: ۱۰۵ متر، طبقه ۶، اجاره تا خرداد، تک‌برگ، حدود ۷. نارمک چیه؟
کاربر: نارمک ۹۰ متره، خالیه، ولی سندش قولنامه‌ایه.
مشاور: دیدم. این یعنی انتخاب واقعاً سختیه: نارمک خالیه و همین فردا می‌شه بازدید گرفت، ولی قولنامه‌ای بودنش خریدار رو محدود می‌کنه و روند رو یکی‌دو ماه طولانی‌تر می‌کنه. پونک سندش تمیزه ولی تا خرداد صبر و اجاره‌ش می‌کشه. پولت چقدر عجله داره؟
کاربر: حدوداً دو سه ماهه می‌خوامش.
[decision point: 2-3 month window fits پونک post-خرداد or نارمک with قولنامه delay — agent presents, owner decides]
مشاور: پس هر دو شدنیه. یه فاکتور دیگه هم بگم: بازده اجاره نارمک بالاتره؟ اگه یه روز دیگه پول خواستی، کدومش رو نگه می‌داشتی؟
کاربر: نارمک رو، اجاره‌ش بهتره نسبت به قیمتش.
مشاور: پس اگه فوری‌ترین گزینه رو بخوای: نارمک می‌فروشه به خاطر خالی بودن، با این که قولنامه‌ایه. اگه یه ماه صبر کنی: پونک با سند تمیز بعد از تخلیه. کدوم جوابت؟
کاربر: هوم... بذار با مامانم صحبت کنم، سند نارمک رو بابا کارد کرده بود.
مشاور: طبیعیه، تصمیم خانوادگیه. فعلاً هیچ‌کدوم رو آگهی نمی‌کنم؛ هر دو پرونده رو «در حال بررسی» می‌ذارم. یه شرط ساده: تا آخر هفته جواب من بدی که مسیر قفل شه، چون بازار منتظر تصمیم نمی‌مونه.
کاربر: باشه، تا جمعه خبر می‌دم.
مشاور: ممنون. عکس‌های هر دو رو هم اگه داری بفرست، هر مسیری که قفل شه آماده‌ی شروعیم.

### Transcript 3 — preference change/correction
مشاور: کاوه جان، دو بازدید برای نارمک رفت، یکی می‌خواد فردا پیشنهاد بده.
کاربر: صبر کن. نظر نارمک رو دادم بی‌خیال، پونک رو می‌خوام بفروشم.
[decision point: asset switch mid-process → archive نارمک, resume پونک profile]
مشاور: باشه، بدون دست‌پاچگی — پرونده نارمک رو بایگانی می‌کنم، چیزی پاک نمی‌شه. برمی‌گردیم سر پونک: داده‌ش رو از قبل داریم، ۱۰۵ متر، طبقه ۶، اجاره تا خرداد، ۷ میلیارد. همه‌ش هنوز درسته؟
کاربر: آره، فقط قیمت کنم ۶/۸ بذار تا زودتر بفروشه.
مشاور: ثبت: پونک، ۶/۸. آگهی پونک رو با همون شرط «تخلیه در خرداد» می‌سازم. نارمک رو هم اگه بعداً خواستی، فقط یه کلمه بگو، آماده‌ست.
کاربر: ممنون، خیلی سریع بود.

---

## WF-SALE-P04 — Property Sales × آرش — Investor exiting
**Persona definition:** آرش، ۳۶ ساله، سرمایه‌گذار. در ۲۰۲۱ یک واحد ۹۵ متری در تهرانپارس پیش‌خرید کرده؛ حالا با بالا رفتن قیمت‌ها می‌خواهد از دارایی خارج شود و سرمایه را به مسیر دیگر ببرد.
**Motivation:** ROI-driven exit — sell at peak, redeploy capital. Treats property as a line item, not a home.
**Circumstances:** Unit delivered but never occupied, still builder-finish; single deed in company name (شرکتی), no emotional attachment.
**Priorities:** Net proceeds after fees; documentation cleanliness (شرکتی سند adds friction); speed moderate — will hold if price isn't right.
**Initial approach:** Data-forward: "خریدم ۲.۲ میلیارد بود، الان بازار چنده؟"
**Questions to ask:**
1. واحد الان تحویل گرفته شده و سند خورده؟ (doc_status)
2. سند به اسم شرکته یا شخصی؟ (ownership_type)
3. باز ساز (سوییته) هست یا نوساز آماده؟ (prop_condition)
4. قیمت خروجت چه‌سطوره؟ (expected_price)
5. کف سود رویدی‌ات چقدره که زیرش خارج نشی؟ (min_price)
6. پولش رو کجا می‌بری؟ نیاز به تزریق فوری داری؟ (sale_urgency)
7. کل مبلغ یک‌جا یا نقد در معامله + اقساط؟ (payment_terms)
**Questions to avoid:**
1. Emotional/«خاطره با خونه» questions — irrelevant.
2. «چرا می‌خوای بفروشی؟» — he already told you: ROI.
3. Renovation suggestions — he sells as-is deliberately.
4. Asking about family plans / residence — not a resident buyer profile.
**Required info:** doc_status, ownership_type, prop_area, prop_neighborhood, prop_condition, expected_price, min_price, sale_urgency, payment_terms
**Optional info:** prop_rooms, prop_age, prop_floor, prop_parking, listing_photos, purchase_price_history, visit_availability
**Conditional questions:**
- IF ownership_type = شرکتی THEN ask about board/agent authority: «معامله به امضای مدیرعامل می‌خوره؟» and expect +1-2 weeks for company docs.
- IF purchase_price_history available THEN compute and show net ROI (after fees/tax) to anchor negotiation.
- IF min_price unreachable within 60 days THEN offer hold-rent option (WF-OWN) so asset isn't dead money.
**Alternative paths:** Rent out as-is (raw unit) short-term while waiting; convert to guaranteed rent for passive yield; exchange (معاوضه) with another investment property.
**Completion criteria:** doc status + ownership type + price band + timeline captured AND owner signs listing brief.
**Recovery scenarios:** Owner demands unrealistic ROI price → show comps and time-cost math («هر ماه مونده تو بازار، هزینه فرصت داره»). Company-signature blocker discovered late → pause listing, route to legal checklist.

### Transcript 1 — normal success
کاربر: سلام. آراشم. یه واحد تو تهرانپارس دارم که ۲۰۲۱ پیش‌خرید کردم ۲/۲ میلیارد. الان می‌خوام خارج شم. بازار الان می‌گه چقدر؟
مشاور: سلام آراش جان، خوش اومدی. اول یه‌کم جزئیات لازمه تا عدد دقیق بدم. واحد تحویل گرفته شد؟ سندش هم اومده؟
کاربر: تحویل گرفته، سند تک‌برگ هم سال پیش اومد. ولی به اسم شرکت منه.
[decision point: ownership_type = شرکتی → flag signatory authority + timeline]
مشاور: دیدم. سند شرکتی مشکلی نیست، فقط معامله با امضای مدیرعامل و صورتجلسه انجام می‌شه — یه هفته‌ای به روند اضافه می‌کنه. خودت مدیرعاملی؟
کاربر: آره، خودمم. راحته.
مشاور: عالیه پس. واحد باز سازه یا آماده؟
کاربر: بازه، اصلاً دست نزدم. عمداً — کسی که بخره خودش ترمیم کنه.
مشاور: فهمیدم، پس برای خریدار سرمایه‌گذار یا ترمیم‌گر می‌بازارش می‌کنیم. قیمت: باز سازِ ۹۵ متری تهرانپارس الان بین ۵ تا ۵/۴ می‌چرخه. یعنی سود تقریباً دو و نیم برابری — خروج خوبیه. این عدد برات منطقیه؟
کاربر: آره، من زیر ۵ نمی‌فروشم.
مشاور: ثبت شد: کف ۵. پول یک‌جا می‌خوای یا نقد + اقساط هم قبوله؟
کاربر: نقد یک‌جا، چون دارم می‌برمش سر یه سرمایه‌گذاری دیگه.
مشاور: پس عجله متوسط داره. چند تا عکس باز ساز بفرست — باز ساز باید «ظرفیت» رو نشون بده، نه نقص. آگهی رو با قاب‌بندی «فرصت ترمیم با قیمت رقابتی» می‌سازم، اوکیه؟
کاربر: اوکیه، عکسا رو می‌فرستم.
[decision point: listing framing confirmed for investor-grade copy]

### Transcript 2 — incomplete/ambiguous
کاربر: یه ملک دارم که می‌خوام بفروشمش. خریدم دو سال پیش بود.
مشاور: سلام! خوش اومدیم. ملک کجاست؟
کاربر: تهرانپارس فکر کنم... یا رنشانس، اسمش یادم نیست دقیق.
[decision point: ambiguous neighborhood → offer lookup, don't guess]
مشاور: باشه، عجله نکن. توی مدارکت قولنامه یا سند باید اسم محله‌ش باشه. عکسش رو بفرست تا خودمون ببینیم، خیلی سریع حل می‌شه.
کاربر: باشه. مترش هم حدود ۹۰.
مشاور: اوکی. حالا مهم‌ترین سؤال: سند داری یا قولنامه‌ای؟
کاربر: قولنامه‌ای فکر کنم، چون پیش‌خرید بود.
مشاور: پیش‌خرید بود؟ پس احتمالاً هنوز تحویل نگرفتی؟
کاربر: آهان، شاید هم هنوز تحویل نشده... خب خودش می‌دونه.
[decision point: unknown delivery status → blocking for sale; schedule verification]
مشاور: آراش جان، اینجا باید دقیق بشیم چون پیش‌خریدِ تحویل‌نشده یه مدل معامله‌ست — فروش قولنامه پیش‌فروش به خریدار بعدی — و تحویل‌گرفته یه مدل دیگه‌ست. کار عملاً متفاوته. یه درخواست: قولنامه و مکاتبه با سازنده رو این هفته برام بفرست، من دقیق می‌گم کجای مسیری.
کاربر: باشه، می‌فرستم.
مشاور: ممنون. فعلاً ثبت کردم: تهرانپارس احتمالی، ~۹۰ متر، پیش‌خرید، وضعیت نامشخص تا مدارک برسه. قیمت هم بعداً می‌ذاریم، چون تو این حالت قیمت به مرحله تحویل بستگی داره.
کاربر: ممنون.

### Transcript 3 — preference change/correction
مشاور: آراش، سه نفر برای واحد باز ساز وقت بازدید گرفتند.
کاربر: یه لحظه، نظرم عوض شد. بذار تا مهر ماه صبر کنم، بازار هنوز بالا میره.
[decision point: timeline extended → offer hold-rent bridge, keep listing warm]
مشاور: دیدگاه شما کاملاً درست است و دم‌تان گرم. ولی یه نکته سرمایه‌گذارانه: واحد باز ساز اگه خالی بمونه، هیچ درآمدی نداره و هزینه نگهداری و شهرداری‌ش با خودته. دو تا پیشنهاد دارم: یا آگهی رو «فعال ولی برای مهر» نگه دارم که پیشنهادها رو جمع کنم بدون فروش فوری، یا بذارمش تو اجاره کوتاه‌مدت تا مهر. کدوم؟
کاربر: اولی بهتره. فعال نگه دار ولی فروش نکن زیر ۵/۵.
مشاور: ثبت شد: توقف فروش، جمع‌آوری پیشنهاد، کف جدید ۵/۵ از مهر. اگه یه پیشنهاد خوب بالای ۵/۵ وسط راه بیاد، بازم بهت می‌گم که رد کنی یا نه؟
کاربر: آره حتماً خبرم کن.
مشاور: انجام شد. هر دو هفته یه بار مارکت‌آپدیت برات می‌فرستم.

---

## WF-SALE-P05 — Property Sales × سپیده — Relocating seller (emigrating)
**Persona definition:** سپیده، ۳۹ ساله، با همسر و دو فرزند در حال مهاجرت به کانادا. باید آپارتمان ۱۱۰ متری جنت‌آباد را بفروشد و در زمان پرواز حدوداً ۴ ماهه تسویه کند.
**Motivation:** Hard deadline (visa/flight); must convert asset to cash before leaving — or delegate fully if it doesn't sell.
**Circumstances:** Unit is furnished, currently rented short-term; both spouses sign; she'll be abroad during the final deal stages.
**Priorities:** Meeting the deadline; remote handling (proxy/وکالت); honesty about what's achievable in 4 months.
**Initial approach:** "چند ماه دیگه مهاجرت می‌کنیم، خونه باید فروخته شه تا بریم."
**Questions to ask:**
1. کی پروازتونه؟ دقیق چقدر وقت داری؟ (target_timeline)
2. خونه الان خالیه یا اجاره‌ست؟ (prop_condition, tenant status)
3. اگر تا زمان پرواز فروش نرفت، چیکار کنیم؟ بفروشم بعد از رفتنت با وکالت؟ (fallback preference)
4. مشخصات واحد؟ (prop_area, prop_rooms, prop_age)
5. قیمت انتظاری؟ کف؟ (expected_price, min_price)
6. سند تک‌برگه؟ هر دو اسم‌تون هست؟ (doc_status, co_owner_count)
7. وکالت محضری می‌تونی از الان تنظیم کنی؟ (remote handling)
8. اسباب و اثاثیه رو می‌بری یا با خونه می‌فروشی؟ (furnishing, contents)
**Questions to avoid:**
1. Details about visa/destination — not needed, potentially painful.
2. «چرا مهاجرت؟» — personal.
3. Pushing guaranteed rent as a big topic — mention once as fallback only.
4. Asking both spouses to be present for every chat — impossible; ask for one decision-maker + power of attorney.
**Required info:** target_timeline, prop_area, prop_neighborhood, doc_status, co_owner_count, expected_price, min_price, prop_condition, fallback_preference
**Optional info:** furnishing, listing_photos, visit_availability, prop_rooms, prop_age, payment_terms, proxy_status
**Conditional questions:**
- IF timeline < sale feasibility (~4 months for mid-market) THEN set price slightly under comps and say so transparently.
- IF owner leaves before closing THEN require وکالت رسمی or dual-owner availability; route deal-docs flow accordingly.
- IF tenant occupies THEN set vacate date before listing photos.
**Alternative paths:** If sale can't close before flight → guaranteed rent (WF-GRT) with remote payout, sale later via proxy; or rent until market improves.
**Completion criteria:** timeline + price band + deed/co-owner status + fallback plan (proxy or GRT) captured AND listing approved.
**Recovery scenarios:** Owner gets anxious about time → present a week-by-week plan with checkpoints. Buyer drags on payments → switch to cash-only filter in matching.

### Transcript 1 — normal success
کاربر: سلام، من و همسرم چند ماه دیگه مهاجرت می‌کنیم. خونه جنت‌آباد باید بفروخته شه، راهی نداریم.
مشاور: سلام سپیده جان، خوش اومدی. می‌فهمم این یه دوره پراسترسه، من باشم که کار فروش رو سبک کنم. اول مهم‌ترین چیز: کی پروازتونه؟
کاربر: اردیبهشت. یعنی حدود چهار ماه وقت دارم.
[decision point: timeline ≈ 4 months → feasible but tight; price strategy = slightly under comps]
مشاور: باشه، چهار ماه برای یه آپارتمان خوب جنت‌آباد شدنیه، ولی بدون حاشیه امن. پس پیشنهادم قیمت‌گذاری کمی زیر فایل‌های مشابه است که خریدار زودتر گول بخوره، اگه اوکیه. خونه الان خالیه یا کسی توشه؟
کاربر: خالیه، اسباب هم هنوز تو خونه‌ست، چون هنوز ویزا کامل نشده.
مشاور: عکس‌ها رو با همین اسباب می‌گیریم — خونه زنده بهتر عکس می‌شه. مشخصات فنی: چند متر، چند خواب، چه سالی؟
کاربر: ۱۱۰ متر، سه خواب، ۸ ساله، طبقه ۴، دو پارکینگ.
مشاور: خیلی خوبه. قیمت حدودی چی برات مناسبه؟
کاربر: من ۱۱ میلیارد شنیدم که می‌ارزه.
مشاور: فایل‌های مشابه الان ۱۱ تا ۱۱/۸ معامله می‌شن. برای تایم‌لاین تو، می‌ذاریم ۱۰/۹ تا ۱۱ — هم تو سقف بازاریم هم جذاب‌تریم. حداقل معامله چقدر باشه که پشیمون نشی؟
کاربر: ۱۰/۵.
مشاور: ثبت شد. سند تک‌برگه؟ هر دو نفر اسمتونه؟
کاربر: بله، هر دومون.
مشاور: پس موقع معامله همسرتون هم باید امضا کنه — تا وقتی هستید، دیدارها رو جمع می‌کنیم. ولی یه سناریوی احتیاطی: اگه تا نزدیک پرواز معامله بسته نشد، وکالت رسمی می‌خوای که از اینجا بدم و بعداً از راه دور معامله کنم، یا خونه رو موقتاً اجاره تضمینی بدم که بی‌درآمد نمونه؟
کاربر: وکالت بهتره، خونه رو می‌خوام بفروشم بالاخره.
[decision point: fallback = proxy sale; GRT only as last resort]
مشاور: باشه، وکالت رو تو برنامه می‌ذارم که زود آماده شه، نه آخرش. این هفته عکاس میره، آگهی فردا آنلاینه. هر هفته جمعه گزارش بازدید برات می‌فرستم.
کاربر: ممنونم، واقعاً خیلی خیال‌م راحت شد.

### Transcript 2 — incomplete/ambiguous
کاربر: خونه‌مون رو باید بفروشیم چون می‌ریم خارج، ولی هنوز تاریخ پرواز نداریم.
مشاور: سلام! خوش اومدید. تاریخ پرواز نداره بودن هم مشکلی نیست، فقط بدونم یه بازه‌ی تخمینی دارید؟ مثلاً «تابع سال» یا «شش ماه دیگه»؟
کاربر: نمی‌دونم، بین سه ماه تا یه سال هر چی بشه.
[decision point: unknown timeline → ask minimum viable answer; don't block]
مشاور: باشه، پس یه عدد حداقلی می‌گیرم ازت: «اگه از امروز سه ماهه فروش نیفتاد، دوست داری چه بشه؟» — بفروشه با قیمت پایین‌تر؟ یا صبر کنه؟
کاربر: راستش نمی‌دونیم... شوهرم می‌گه بفروشه، من می‌گم صبر کنه.
مشاور: خیلی طبیعیه، این دعوای همیشگیِ مهاجرته! پس بذار دو تا سناریو رو کنار هم بذارم: فروش سریع = ۱۱۰ متر جنت‌آباد حدود ۱۰/۵–۱۱؛ صبر = اجاره‌ش بدیم با مدیریت مالینو، ماهی حدود ۵۵ میلیون درآمدت باشه تا تکلیف ویزا روشن شه. کدوم به قلبتون نزدیک‌تره الان؟
کاربر: دومی منو آرام‌تر می‌کنه ولی هنوز مطمئن نیستم.
مشاور: هیچ قفلی نمی‌زنم. فقط برای هر دو سناریو دو تا اطلاعات مشترک لازمه: متر و مشخصات خونه، و سند. چند متره؟
کاربر: ۱۱۰، سه‌خوابه، نوساز نیست ۹ سالش.
مشاور: ممنون. سند تک‌برگه؟
کاربر: فکر کنم آره، تو گاوصندوقه.
مشاور: باشه، عکسش رو یه وقت بفرست چک کنیم. خلاصه امروز: هر دو سناریو آماده، تصمیم بعد از مشورت خانوادگی. شنبه دوباره پینگ می‌زنم، اوکیه؟
کاربر: اوکیه.

### Transcript 3 — preference change/correction
مشاور: سپیده جان، بازدیدهای هفته اول تموم شد، دو تا پیشنهاد اومد: ۱۰/۳ و ۱۰/۴۵.
کاربر: می‌دونی چی؟ به نظرم دیگه فروش نکنم. بذار اجاره تضمینی بدیم، پول اجاره تو کانادا هم به دردمون می‌خوره.
[decision point: goal switch sale → GRT → cross-workflow transition, confirm stored data]
مشاور: تصمیم بزرگیه ولی کاملاً منطقی برای وضعیتتون. قبل از اینکه بچرخیمش، دو تا تأیید ازت می‌گیرم: همچنان قصد برگشت ندارید و فروش رو برای بعد نگه می‌دارید، درست؟
کاربر: آره، بعد از دو سه سال شاید برگردیم و بفروشیم.
مشاور: پس مسیر عوض می‌شه: قرارداد اجاره تضمینی، ماهانه حدود ۴۸–۵۲ میلیون بهتون می‌رسه بعد از کسر کارمزد، پول به حساب خارج هم می‌تونه واریز شه. داده‌های خونه رو از پرونده فروش استفاده می‌کنم — ۱۱۰ متر، سه‌خواب، دو پارکینگ — درسته هنوز؟
کاربر: آره همون‌ها. عکس‌ها هم که دارید.
مشاور: عالیه، پس از صفر شروع نمی‌کنیم، فردا پیش‌نویس قرارداد تضمینی میاد که بخونید. کف اجاره هم اگه بالای ۵۵ پیشنهاد شد، خبرتون می‌کنم.
کاربر: ممنون، حتماً.

---

## WF-SALE-P06 — Property Sales × حاج آقا طاهری — Inherited co-owner stakeholder
**Persona definition:** آقای طاهری، ۵۸ ساله، یکی از سه ورثه (او + دو خواهرش) مالک یک خانه ۱۶۰ متری در شهران که از پدر به ارث رسیده. او سخنگوی خانواده است اما تصمیم نهایی با هر سه نفر است.
**Motivation:** Settle the inheritance cleanly and equally divide proceeds; avoid family conflict; paperwork (انحصار وراثت) is the scary part.
**Circumstances:** House is old (۳۵ ساله), vacant, shared deed partition (پرکنی) not done yet; siblings live in different cities.
**Priorities:** Fair split, legal clarity, no sibling resentment, realistic price for an old house.
**Initial approach:** "خونه پدرمون هست، سه‌تامون ارث بردیم، می‌خوایم بفروشیم ولی می‌دونم کاغذبازیش زیاده."
**Questions to ask:**
1. گواهی انحصار وراثت گرفتید؟ (heir_status)
2. سند خونه به اسم هر سه نفره یا هنوز به اسم پدر؟ (doc_status)
3. هر سه نفر موافقن فروش باشن؟ (co-ownership consent)
4. چه کسی مذاکره و امضاها رو انجام می‌ده؟ نماینده قانونی؟ (decision authority)
5. مشخصات خونه: متر، سن، وضعیت؟ (prop_area, prop_age, prop_condition)
6. انتظار قیمت هر نفر رو چطور جمع می‌زنید؟ (expected_price, min_price)
7. خونه خالیه؟ (prop_condition, tenant status)
**Questions to avoid:**
1. Who contributed what to the estate — family conflict territory.
2. «چرا الان می‌فروشید؟» — implies judgment of family decision.
3. Asking each sibling individually to chat — designate one speaker.
4. Evaluating renovation — old house sells mostly on land/position.
**Required info:** heir_status, doc_status, co_owner_count, consent_status, prop_area, prop_neighborhood, prop_age, prop_condition, expected_price, min_price
**Optional info:** prop_rooms, prop_parking, listing_photos, visit_availability, split_agreement
**Conditional questions:**
- IF heir certificate missing THEN route to legal-assist checklist BEFORE listing; set expectations on +4-8 weeks.
- IF سند not partitioned (پرکنی نشده) THEN explain partition/consent sale options.
- IF price expectations differ between siblings THEN get one written min_price from all three (not three different ones).
**Alternative paths:** Rent out meanwhile (WF-OWN) to cover نگهداری costs; guaranteed rent with payout split three ways.
**Completion criteria:** legal status mapped + all-owner consent + single agreed price band captured AND listing blocked until heir/partition paperwork confirmed or workaround approved.
**Recovery scenarios:** One sibling objects mid-process → pause listing, offer family meeting with agent, don't proceed without consent. Price disagreement → present data to all three in one call/message.

### Transcript 1 — normal success
کاربر: سلام آقای مشاور. خونه پدرمون تو شهران هست، ۱۶۰ متر، ما سه تا بچه‌ایم که ارث بردیم. می‌خوایم بفروشیم.
مشاور: سلام خدمت شما، تسلیت عرض می‌کنم و خوش اومدی. ارث یه روند کاغذی مشخص داره، من قدم‌به‌قدم کمکتون می‌کنم. اول بگم: گواهی انحصار وراثت گرفتید؟
کاربر: آره، اون رو داریم، بابا دو سال پیش فوت کرد و اون رو گرفتیم.
مشاور: خیلی خوبه، یعنی نصف راه رو رفتید. سند خونه چیه؟ به اسم بابا مونده یا خونه شده به اسم هر سه نفر؟
کاربر: هنوز سند به اسم باباست. این پرکنی رو نشده.
[decision point: doc_status = به‌نام متوفی → partition needed OR sale-by-heirs path]
مشاور: دیدم. دو تا راه داریم: یا اول سند رو به اسم هر سه نفر ببریم — سه چهار هفته وقت می‌بره — یا با رضایت هر سه نفر، معامله رو از روی مبنای ارث انجام بدیم که سریع‌تره ولی خریدار باید قبول کنه. تجربه‌م اینه که خریدارهایی هستن، ولی قیمت شاید کمی پایین‌تر بشه. کدوم به نظر خانواده بهتره؟
کاربر: سرعت بهتره، ولی باید با خواهرام چک کنم.
مشاور: حتماً چک کنید، من هیچ‌وقت بدون رضایت هر سه نفر یه قدم جلو نمی‌رم. راستی خودتون قراره نماینده مذاکره باشید؟
کاربر: آره، همه کار با من.
مشاور: ممنون. حالا خونه: خالیه؟ چه وضعیه؟
کاربر: خالیه، ولی قدیمیه، ۳۵ سالش، به‌روز نیست.
مشاور: فهمیدم. برای خونه‌های قدیمی شهران، بحث زمین و موقعیت اصلیه. متراژ زمین و تراکم رو باید ببینم — بازه حدودی ۹ تا ۱۰/۵ میلیارد می‌شه که بعد از دید دقیق‌تر می‌گم. قیمت انتظار خانواده چقدره؟
کاربر: اگه هر کی حدود ۳ میلیارد بگیره همه راضی‌ن.
مشاور: یعنی کف معامله ۹. قابل اجراست. پس برنامه: این هفته بازدید فنی، بعد قیمت دقیق، بعد موافقت خواهرها، بعد آگهی. هر مرحله رو شما تأیید می‌کنید. اوکیه؟
کاربر: اوکیه، ممنون از صبرتون.
[decision point: staged consent checkpoints → no listing until all green]

### Transcript 2 — incomplete/ambiguous
کاربر: خونه‌ی پدر مونده به ما، می‌خوایم بفروشیمش. چند تا بچه‌ایم؟ خب، سه‌تا یا چهار تا، یه خواهرم می‌گه سهمیه من بیشتره چون پدر با ما بود.
[decision point: sibling dispute surfacing → don't take sides, map legal facts]
مشاور: سلام، خوش اومدید. من اینجا فقط حقوقدان و مشاور بازارم، قضاوت خانوادگی با خودتون. چیزی که برام مهمه سه تا ورق کاغذه: گواهی انحصار وراثت، وصیت‌نامه اگه هست، و سند. این سه تا رو دارید؟
کاربر: انحصار وراثت هست. وصیت هم داشت بابا... یکی از خواهرم می‌گه وصیت رو کجا گذاشتیم نمی‌دونیم.
مشاور: باشه، وصیت‌نامه رو بیاید دنبالش — دفترخانه اسناد یا دفتر ثبت احوال آخر محل سکونت ایشان رو چک می‌کنن، این رو گام اول می‌ذارم، چون تا معلوم نشه وصیت هست یا نه، فروش خطر حقوقی داره. خونه کجاست و چند متره؟
کاربر: شهران، ۱۴۰ متر فکر کنم.
مشاور: اوکی. تا اون موقع برای تخمین با همین می‌رم جلو: ۱۴۰ متر شهران قدیمی، حدود ۹ میلیارد. ولی قفل قیمت نمی‌زنم تا مدارک سر جاش بشینه.
کاربر: پس چی کار کنیم الان؟
مشاور: سه تا کار کوچیک: عکس گواهی انحصار وراثت، پرس‌وجوی وصیت در دفترخانه‌ها، و عکس سند. اگه همه‌ش تا هفته بعد برسه، اون موقع مرحله قیمت می‌ریم و لیست موافقت خواهرها رو هم می‌چینیم.
کاربر: باشه، می‌فهمم، این کاغذها مزاحم سرعتن ولی باشه.
مشاور: مزاحم نیست، محافظه — تا همه‌چیز تمیز باشه، پول هر سه نفر امنه. من هم هفته‌ای یه بار پرس‌وجو می‌کنم و وضعیت رو می‌گم بهتون.
[decision point: legal gate before any listing activity]

### Transcript 3 — preference change/correction
مشاور: آقای طاهری، بازدید هفتگی داشتیم، ولی یکی از خواهرهایتون زنگ زد و گفت قیمت را پایین نمی‌آورد.
کاربر: آره، من هم فهمیدم. خواهرم می‌گه زیر ۱۰ میلیارد نه.
[decision point: min_price shift → re-agree band with speaker + verify consent]
مشاور: باشه، پس این‌طور می‌ذاریمش: کف خانوادگی ۱۰. فقط یه درخواست: با توجه به وضعیت خونه و بازار، ۱۰ یعنی ممکنه دو سه ماه طول بکشه خریدار پیدا شه. این رو به خواهرتون بگید که انتظارش تنظیم شه، یا من یه پیام شفاف برای هر سه نفر آماده کنم که تأیید کنن؟
کاربر: همون پیام بهتره، بفرست همه‌شون جواب بدن.
مشاور: انجام می‌دم. تا وقتی هر سه نفر جواب تأیید ندن، آگهی قیمت‌ش فریز می‌مونه و فقط بازدید جمع می‌کنیم. اگه موافقت نکردن، خودمون می‌شینم یه شب میاریم وسط.
کاربر: ممنون، خیلی دقت دارید.

---

## WF-OWN-P07 — Property Listing & Ownership × نیلوفر — First-time landlord
**Persona definition:** نیلوفر، ۲۸ ساله، طراح. اولین بار است که واحد ۶۵ متری یوسف‌آباد خود را — که قبلاً خودش در آن زندگی می‌کرد — اجاره می‌دهد. هیچ تجربه‌ای از قرارداد، رهن یا مستأجر ندارد.
**Motivation:** Extra income; moving in with her fiancé. Nervous about choosing the "wrong" tenant and about the paperwork.
**Circumstances:** Unit fully furnished, good condition; she doesn't know deposit norms or fee structures.
**Priorities:** Trustworthy tenant, no damage to her furniture, understandable contract; secondarily high rent.
**Initial approach:** "برای اولین باره می‌خوام اجاره بدم، اصلاً بلد نیستم از کجا شروع کنم."
**Questions to ask:**
1. خونه خالیه با اسباب؟ (prop_condition, furnishing)
2. چند متر، چند خواب؟ (prop_area, prop_rooms)
3. چه مدل اجاره دوست داری؟ رهن و اجاره نرمال یا مبلغ کامل؟ (rent_model)
4. چه جور مستأجری می‌خوای؟ مجرد، خانواده، دانشجو؟ (tenant_pref)
5. اجاره دلخواهت حدوداً چقدره؟ (rent_amount, deposit_amount)
6. سند و شماره پلاک هم داری؟ (doc_status)
7. خودت بازدید رو هماهنگ می‌کنی یا ما؟ (mgmt_preference)
8. محل اثاثیه‌ها: توی خونه می‌مونه یا می‌بری؟ (furnishing)
**Questions to avoid:**
1. Investment/ROI math up front — she doesn't think that way yet.
2. Legal jargon without explanation — alienates first-timers.
3. «مدیریت کامل می‌خوای؟ فقط ماهی ۲۰٪» as first question — sell benefits after needs.
4. Asking for exact numbers she can't know (market rent) — provide benchmarks.
**Required info:** prop_type, prop_area, prop_rooms, prop_neighborhood, prop_condition, furnishing, rent_model, tenant_pref, rent_amount, deposit_amount
**Optional info:** doc_status, prop_floor, prop_age, listing_photos, visit_availability, mgmt_preference, contact_window
**Conditional questions:**
- IF furnishing = کامل THEN require furniture inventory list in contract; mention damage deposit.
- IF tenant_pref = مجرد THEN flag restrictions common in building rules («قانون ساختمون اجازه می‌ده؟»).
- IF owner unsure about rent THEN give neighborhood benchmark and let her react.
**Alternative paths:** If she shows anxiety about management → introduce platform management (fee 15-20% of rent) as comfort; if unit won't rent in 3 weeks → suggest price/deposit adjustment options.
**Completion criteria:** rent model + rent/deposit numbers + tenant preference + inventory (if furnished) captured AND contract template approved.
**Recovery scenarios:** Owner panics at first bad tenant story from a friend → explain screening process. Owner wants to cancel mid-listing → save profile, offer pause not delete.

### Transcript 1 — normal success
کاربر: سلام! من نیلوفرم. برای اولین بار می‌خوام خونه‌م رو اجاره بدم و واقعاً نمی‌دونم از کجا شروع کنم.
مشاور: سلام نیلوفر جان، خوش اومدی! خیلی خوبه که از اینجا شروع کردی، من قدم‌به‌قدم راهنماییت هستم و چیزی رو بی‌اجازه نمی‌کنم. اول خونه رو بگو: خالیه با اسباب؟
کاربر: با اسبابه، من الان با نامزدم زندگی می‌کنیم اینجا رو خالی می‌کنم ولی اسباب می‌مونه.
مشاور: عالیه، خونه مبله اجاره‌ش بهتره و اجاره‌ش هم بالاتره. چند متر و چند خوابه؟
کاربر: ۶۵ متر، یه خوابه، طبقه ۳، آسانسور داره.
مشاور: خوبه. دو تا سؤال مهم: چه جور مستأجری دوست داری؟ مثلاً یه زوج جوون، یا خانواده، یا حتماً باید خانواده باشه؟
کاربر: یه زوج یا یه خانواده‌ی تک‌فرزند، مجرد نه، اسبابم حساسه.
[decision point: tenant_pref recorded → affects matching filter]
مشاور: ثبت شد. حالا مدل اجاره: یا رهن و اجاره معمولی — مثلاً رهن ۲۰۰، اجاره ۱۵ — یا «رهن کامل» که کل پول یه‌جا می‌گیرید. کدوم رو می‌پسندی؟
کاربر: فرقشون چیه؟ نمی‌دونم.
مشاور: ساده بگم: رهن کامل یعنی یک‌جا پول می‌گیری ولی ماهانه هیچی؛ رهن و اجاره یعنی ماهی درآمد داری. برای کسی که دنبال درآمد ماهانه‌ست، رهن و اجاره بهتره.
کاربر: آهان، پس همون رهن و اجاره.
مشاور: برای یوسف‌آباد ۶۵ متری مبله، بازار الان حدود ۲۲ تا ۲۵ میلیون اجاره‌ست با رهن ۲۰۰–۲۵۰. این اعداد عجیب به نظرت نمیاد؟
کاربر: نه، من خودم فکر می‌کردم ۲۰ باشه، پس بهتره!
مشاور: دقیقاً. قانون ساختمون‌تون محدودیتی برای مستأجر داره؟ مثلاً بعضی ساختمون‌ها مجرد نمی‌گیرن؟
کاربر: فکر نکنم، اما بپرسم از ساختمان‌دار.
مشاور: بپرس، چون بهتره قبل آگهی معلوم باشه. آخرین سؤال: بازدیدها رو خودت هماهنگ می‌کنی یا ما کارشناس‌مون بیاد و همه‌چیز از صفر تا قرارداد با اون باشه؟
کاربر: من خودم می‌خوام بازدید باشم، ولی قرارداد رو شما بچینید، چون بلد نیستم.
[decision point: mgmt_preference = hybrid → owner-led visits, platform contract]
مشاور: اوکیه. پس قرارداد با لیست اثاثیه میاد که هر چیزی ثبت شه — دیوار، فرش، لوستر — که بعداً بحث پیش نیاد. عکس‌ها رو هم بفرست، تا امشب آگهی آماده‌ست.
کاربر: ممنونم، انقدر راحت بود که باورم نمی‌شه!

### Transcript 2 — incomplete/ambiguous
کاربر: می‌خوام خونه‌م رو بدم اجاره، ولی قیمتش رو نمی‌دونم.
مشاور: سلام! خوش اومدی. خونه کجاست؟
کاربر: یوسف‌آباد.
مشاور: عالیه. چند متره و چند خوابه؟
کاربر: مترش رو می‌دونم، ۶۵. خوابش رو... دو تا؟ نه، یه خوابه بزرگه. همون یه خوابه.
[decision point: self-correcting ambiguity → accept latest, verify at visit]
مشاور: باشه، یه خوابه ثبت کردم — بازدید که رفتیم با خود خونه چک می‌کنیم، نگران نباش. خونه با اسبابه یا خالی؟
کاربر: با اسباب، ولی هنوز توش زندگی می‌کنم.
مشاور: دیدم، پس تخلیه هم مهمه: کی می‌تونی خالی‌ش کنی؟ خریدار مستأجر معمولاً می‌خواد سریع بیاد.
کاربر: ماه دیگه.
مشاور: اوکیه، پس آگهی رو با شرط «تحویل از ماه دیگه» می‌ذاریم و بازدیدها رو همینطور همین ماه هم می‌گیریم که زمان تلف نشه. اجاره حدودی هم برات می‌گم: ۲۲ تا ۲۵ میلیون با رهن حدود ۲۰۰–۲۵۰. این عدد برات اوکیه؟
کاربر: آره خوبه.
مشاور: سند یا قرارداد مالکیتت کجاست؟ عکسش رو بفرست تا نامت رو برای قرارداد رسمی چک کنم.
کاربر: امشب می‌فرستم.
مشاور: ممنون! پس امروز: یوسف‌آباد، ۶۵ متر، مبله، اجاره ۲۲–۲۵ با رهن ۲۲۵ حدوداً، تخلیه ماه دیگه. منتظر عکس‌ها و عکس سندم.
[decision point: pre-listing checklist pending items tracked]

### Transcript 3 — preference change/correction
مشاور: نیلوفر جان، یه زوج جوون برای فردا ساعت ۵ وقت بازدید گرفتند.
کاربر: صبر کن! نامزدم گفت مجرد ممنوع بودن کافیه، زوج جوون نه، می‌ترسیم خراب کنن اسباب رو. فقط خانواده بذار.
[decision point: tenant_pref tightened → update filter, warn on slower matching]
مشاور: باشه، فیلتر رو به «فقط خانواده» تغییر می‌دم. یه نکته‌ی کوچیک صادقانه: با این فیلتر، شاید یک‌دو هفته بیشتر طول بکشه مستأجر پیدا شه. اوکیه با این؟
کاربر: آره، بهتره صبر کنم تا خراب نشه.
مشاور: انجام شد. یه پیشنهاد هم دارم که خیالت راحت‌تر شه: تو قرارداد «ودیعه‌ی نگهداری اثاثیه» — مثلاً ۱۰ میلیون جدای رهن — بذاریم که هر خرابی از همون کسر شه. می‌خوای؟
کاربر: آره حتماً، این خیلی خوبه.
مشاور: پس ثبت شد. آگهی هم به‌روز می‌شه، اون زوج رو هم با احترام لغو می‌کنم.
کاربر: ممنون.

---

## WF-OWN-P08 — Property Listing & Ownership × آقای رحیمی — Professional landlord
**Persona definition:** آقای رحیمی، ۵۲ ساله، مالک ۴ واحد در افسریه و پیروزی. ۱۲ سال سابقه اجاره دارد؛ بلد است، سریع حرف می‌زند، فرم و توضیحات اضافه نمی‌خواهد.
**Motivation:** Rental income is his main livelihood; wants occupancy rate up, vacancy near zero, consistent contract enforcement.
**Circumstances:** Two units just vacated; one tenant is late on rent; he manages most things himself but struggles with tenant screening and legal rent increases.
**Priorities:** Fast re-rental, reliable tenants, correct legal rent bump, no vacancy gaps.
**Initial approach:** "چهار تا واحد دارم، دوتاشون الان خالیه. با سرویس مدیریت شما چند درصد می‌دی؟"
**Questions to ask:**
1. کدوم واحدها خالی‌ست و مشخصاتش؟ (prop_id, prop_area, prop_neighborhood, prop_condition)
2. اجاره قبلی چقدر بود و به چه نرخ جدیدی می‌خوای؟ (rent_amount, rent_increase)
3. برای مستأجر جدید چه فیلتری می‌ذاری؟ (tenant_pref)
4. مستأجر دیرکرددار رو ما پیگیری پرداخت کنیم؟ (debt_followup)
5. مدیریت کامل می‌خوای یا فقط اجاره‌گیری؟ (mgmt_preference, mgmt_fee_accept)
6. سند و پلاک هر واحد؟ (doc_status)
7. بازدید کی انجام بشه؟ (visit_availability)
**Questions to avoid:**
1. Explaining how renting works — insulting; he knows.
2. Soft «حس شما درباره مستأجر چیه؟» questions — he wants filters.
3. Re-asking for documents already uploaded in earlier sessions — confirm reuse instead.
4. Long onboarding flow — batch questions, quick-review mode.
**Required info:** prop_id (×2 vacant), prop_area, prop_neighborhood, rent_amount (new), rent_model, tenant_pref, mgmt_preference, mgmt_fee_accept
**Optional info:** prop_age, prop_floor, furnishing, doc_status, listing_photos, visit_availability, debt_followup, contact_window
**Conditional questions:**
- IF mgmt_preference = کامل THEN present tiered pricing (اجاره‌گیری = یک ماه اجاره / مدیریت کامل ۱۵–۲۰٪ ماهانه).
- IF late-payment flagged THEN offer payment-tracker + legal notice flow before eviction talk.
- IF new rent > legal increase cap THEN auto-warn.
**Alternative paths:** Bundle all 4 units into one portfolio dashboard; cross-sell guaranteed rent for the vacancy-prone unit.
**Completion criteria:** two listings active with prices + tenant filters + management tier selected AND portfolio linked.
**Recovery scenarios:** Owner disputes fee → show vacancy-cost math (یک ماه خالی ماندن = دو برابر کارمزد). Wants to skip contract → insist on platform-standard contract as quality gate.

### Transcript 1 — normal success
کاربر: سلام. رحیمی‌ام. چهار تا واحد دارم، دوتاشون الان خالیه. سرویس مدیریت شما چطوره و چند درصده؟
مشاور: سلام آقای رحیمی، خوش اومدید. دو تا مدل داریم: «اجاره‌گیری» — فقط مستأجر پیدا کنیم، معادل یک ماه اجاره — و «مدیریت کامل» ماهانه ۱۵ تا ۲۰٪ که شامل پیگیری اجاره، تعمیرات و تمدید قرارداده. کدوم سبک کار شماست؟
کاربر: قبلاً همه‌چیز خودم بود ولی این اواخر اذیت شدم. مدیریت کامل رو بگو ببینم.
[decision point: mgmt_preference leaning full → collect both vacant units]
مشاور: عالیه. پس دوتا واحد خالی رو ببریم تو سیستم: مشخصات هر کدوم؟
کاربر: افسریه ۷۵ متر، طبقه ۳، ۱۰ ساله، قبلاً ۸۰ رهن و ۱۸ اجاره بود. اون یکی پیروزی، ۶۰ متر، طبقه ۲ بدون آسانسور، ۶۰ رهن ۱۴ اجاره.
مشاور: ثبت شد. برای افسریه با این سال‌ساخت امسال می‌تونی ۲۰ اجاره و ۹۰ رهن بذاری؛ پیروزی هم ۱۵ و ۷۰. موافقی؟
کاربر: آره، ولی سقف قانونی افزایش رو چک کن که تخلف نکنم.
[decision point: rent increase legality → auto-check against cap]
مشاور: دقیقاً، اینجا خودمون چک می‌کنیم و اگه از سقف قانونی رد شد هشدار می‌دم — فعلاً هر دو در سقفه. فیلتر مستأجرت چی باشه؟
کاربر: خانواده، شاغل، ضمانت محکم — سفته یا ضامن کارمند. مجرد و دانشجو نه.
مشاور: ثبت شد. یه چیز دیگه: گفتن شما یه مستأجر هم دیرکرد داره؟
کاربر: آره، پیروزی، دو ماهه اجاره نداده.
[decision point: late-payment → offer payment tracker + legal notice flow]
مشاور: پس این رو هم زیر مدیریت کامل می‌برم — یادآوری رسمی، رهگیری پرداخت، و اگه لازم شد اطلاعیه قانونی. تا یک هفته وضعیتش رو می‌گم. مدارک هر چهار واحد رو داری؟ سند و پلاک.
کاربر: همه‌ش نزد منه، فردا یک‌جا می‌فرستم.
مشاور: ممنون. خلاصه: افسریه ۲۰/۹۰ و پیروزی ۱۵/۷۰ برای اجاره، فیلتر خانواده + ضامن، مدیریت کامل ۱۸٪، پرونده دیرکرد فعال. تا فردا آگهی‌ها آنلاینن و داشبورد چهار واحدم می‌سازم که همه رو یه‌جا ببینی.
کاربر: این شد حرف حساب.

### Transcript 2 — incomplete/ambiguous
کاربر: یه واحد خالی شد، باید زود مستأجر بیارم.
مشاور: سلام! خوش اومدید. کدوم واحد؟ و بقیه‌تون کجاست که بذارم تو پروفایلتون؟
کاربر: افسریه خالیه شد. بقیه؟ پیروزی، دوتا هم دیگه... همین‌های بالا و پایین همین خونه.
[decision point: unclear portfolio → map units one by one, don't assume]
مشاور: باشه، مرتبش کنیم که چیزی قاطی نشه: واحد یک افسریه ۷۵ متر که خالیه. واحد دو پیروزی؟
کاربر: آره پیروزی ۶۰ متر، مستأجر داره.
مشاور: ثبت. واحد سه و چهار همون کوچه افسریه، طبقه بالا و پایین؟
کاربر: آره، همون دوتا.
مشاور: عالی، چهار تا شد. واحد خالی: اجاره قبلیش چقدر بود و چرا رفته؟
کاربر: ۱۷ بود... نه ۱۸ بود. رفت شهرستان، کارش رو بردند اونجا.
[decision point: self-correction on rent → accept ۱۸, verify from old contract]
مشاور: از روی قرارداد قبلی دقیقش می‌کنم. پیشنهاد جدیدم ۲۰ اجاره و ۹۰ رهن است، بسته به وضعیت ترمیم. خونه نوسازه؟
کاربر: ۱۰ سالشه، تمیزه، فقط رنگ می‌خواد.
مشاور: پس ۲۰/۹۰ منطقیه. رنگ رو اگه این هفته انجام بدید، سرعت اجاره دوتا برابر می‌شه. فیلتر مستأجرت؟
کاربر: خانواده، ضامن داشته باشه.
مشاور: ثبت شد. قرارداد استاندارد مالینو هم استفاده می‌کنیم؟ ضمانت و شرط تخلیه رو منظم‌تر می‌چینه.
کاربر: باشه، همون رو بذار.
مشاور: ممنون. فردا عکس‌ها رو بفرست، همون روز آگهی آنلاینه.

### Transcript 3 — preference change/correction
مشاور: آقای رحیمی، برای افسریه سه نفر واجد شرایط داریم، دوتا خانواده و یکی با ضامنِ قوی‌تر.
کاربر: نگاه، نظر عوض شد. مدیریت کامل رو نمی‌خوام، فقط اجاره‌گیری. بقیه‌ش خودم می‌چینم.
[decision point: mgmt_preference downgrade → adjust fee model, keep late-payment case?]
مشاور: بدون مشکل، کارمزد می‌شه معادل یک ماه اجاره برای هر اجاره‌گیری. فقط یه سؤال: پرونده دیرکرد اون مستأجر پیروزی رو ببندم یا همچنان من پیگیری کنم؟
کاربر: اون ادامه بده، خودم حوصله‌ش رو ندارم.
مشاور: پس ترکیبی شد: اجاره‌گیری برای واحد خالی، مدیریت پرداخت برای اون پرونده. داشبورد هم سر جاشه. سه نفر واجد شرایط رو لیست می‌کنم که انتخاب کنی.
کاربر: ممنون، همین بهتره.

---

## WF-OWN-P09 — Property Listing & Ownership × مینا — Multi-property owner (rent one, sell one)
**Persona definition:** مینا، ۴۴ ساله، مالک یک آپارتمان ۹۵ متری نارمک (خریده برای سکونت بعدی، فعلاً خالی) و یک واحد ۷۰ متری تهرانپارس (مستأجر دارد). می‌خواهد واحد تهرانپارس را بفروشد و نارمک را اجاره دهد تا وقتی بچه‌ها بزرگ شوند.
**Motivation:** Optimizing a two-asset portfolio across both workflows simultaneously.
**Circumstances:** Financially savvy, busy; wants one unified conversation, not two separate onboarding journeys.
**Priorities:** Correct asset assignment (which sells, which rents), time efficiency, coherent cross-workflow reporting.
**Initial approach:** "دو تا ملک دارم و دو تا کار مختلف باهاتون دارم — یکی فروش، یکی اجاره."
**Questions to ask:**
1. کدوم ملک برا فروش، کدوم برا اجاره؟ چرا؟ (asset assignment, sale_reason)
2. مشخصات واحد فروش؟ (prop_area, prop_neighborhood, doc_status)
3. مشخصات واحد اجاره + مستأجر فعلی؟ (prop_condition, tenant status)
4. قیمت فروش انتظاری و اجاره انتظاری؟ (expected_price, rent_amount)
5. اجاره‌ای که می‌ریزی تو درآمد، چه مدل؟ (rent_model, mgmt_preference)
6. تایم‌لاین فروش؟ (target_timeline)
7. هر دو سند تک‌برگ؟ (doc_status ×2)
**Questions to avoid:**
1. Duplicated property questions across the two workflows — collect once, reuse.
2. Merging the two assets' data — keep prop_id separation strict.
3. Asking her to decide everything in one session — allow asset-by-asset progress.
4. Generic upsell of guaranteed rent before understanding her cash needs.
**Required info:** prop_id ×2 with workflow tags, prop_area, prop_neighborhood, doc_status (both), expected_price, rent_amount, rent_model, target_timeline
**Optional info:** prop_age, prop_rooms, prop_floor, prop_parking, furnishing, tenant_pref, mgmt_preference, listing_photos, visit_availability
**Conditional questions:**
- IF vacant unit (نارمک) is meant for future living THEN ask target move-in date — affects rent contract length.
- IF sale proceeds fund renovation of نارمک THEN sequence tasks (sell first, renovate, then rent).
- IF tenant in تهرانپارس unit THEN clarify sale-with-tenant vs wait-for-vacate.
**Alternative paths:** Unified portfolio view with two workflows running in parallel; if sale stalls, flip نارمک to GRT and move sale to تهرانپارس later.
**Completion criteria:** both assets tagged to correct workflow + core fields per workflow captured AND owner confirms parallel-track plan.
**Recovery scenarios:** Owner confuses which unit is which → always re-anchor by neighborhood name, never by "واحد اول/دوم". Cross-contamination of data → per-property data model with explicit confirmation of which property each answer belongs to.

### Transcript 1 — normal success
کاربر: سلام. مینا هستم. دو تا ملک دارم و دو تا کار مختلف: تهرانپارس رو می‌خوام بفروشم، نارمک رو اجاره بدم.
مشاور: سلام مینا جان، خوش اومدی! چه عالی که هر دو رو یه‌جا شروع می‌کنیم، من هر دو پرونده رو جدا نگه می‌دارم که قاطی نشن. اول نارمک: خالیه؟
کاربر: خالیه، خریدیم برای وقتی بچه‌ها بزرگ شن، فعلاً دو سه سال خالیه.
مشاور: پس اجاره‌ش می‌دیم که خالی نمی‌مونه. چند متر و مشخصاتش؟
کاربر: ۹۵ متر، دو خواب، طبقه ۵، آسانسور، ۶ سالش، خالیه با اسباب.
مشاور: نارمک با اسباب حدود ۳۰ میلیون اجاره و ۱۵۰ رهن می‌گیره. قرارداد رو دو ساله ببندیم یا یک‌سال‌یک‌بار؟ چون گفتید شاید بعداً خودتون بشینید.
[decision point: rent term vs future move-in → contract length decision]
کاربر: دو ساله بهتره، تا یکی دو سال خیالم راحته.
مشاور: ثبت شد. حالا تهرانپارس برای فروش: چند متر، سندش؟
کاربر: ۷۰ متر، طبقه ۳، تک‌برگ، مستأجر داره قراردادش تا دی‌ماه.
[decision point: sale with tenant → occupied sale vs wait]
مشاور: دیدم. دو راه: با مستأجر بفروشیم — خریدار مالک‌محل کمی سخت‌گیرتره و معمولاً ۵–۸٪ پایین‌تر می‌ده — یا تا دی‌ماه صبر کنیم و خالی بفروشیم. چقدر عجله دارید؟
کاربر: عجله فوری نیست، ولی خب اگه فروش زودتر رد شه خوبه.
مشاور: پیشنهاد من: الان قیمت‌گذاری و آماده‌سازی انجام شه، ولی بازدید جدی از دی‌ماه. قیمت انتظاری؟
کاربر: حدود ۴/۵.
مشاور: بازار ۷۰ متری تهرانپارس الان ۴/۲ تا ۴/۶ — پس ۴/۵ درست وسطه، اوکیه. سند نارمک هم تک‌برگه؟
کاربر: آره هر دو.
مشاور: عالی. پس دو پرونده جدا آماده‌ست: نارمک اجاره دو ساله ۳۰/۱۵۰، تهرانپارس فروش ۴/۵ با بازدید از دی‌ماه. عکس‌های هر دو رو جدا با اسم محله بفرست لطفاً که قاطی نشن!
کاربر: باشه، ممنون.
[decision point: two parallel workflows confirmed with per-property data]

### Transcript 2 — incomplete/ambiguous
کاربر: یه خونه ۹۰ متری دارم، می‌خوام هم اجاره بدم هم بعداً بفروشم، هر دوش ممکنه.
مشاور: سلام! جالبه — پس استراتژی «اجاره تا فروش» دارید. ولی برای شروع باید مشخص شه کدوم خونه: نارمک یا تهرانپارس؟
کاربر: نارمک... یا شایدم تهرانپارس، هر دو رو دارم، الان اسم‌شون قاطی شد.
[decision point: asset confusion → disambiguate with details, not labels]
مشاور: مشکلی نیست، با جزئیات تشخیص می‌دیم: اون یکی که گفتید ۹۵ متره کدوم بود؟ و ۷۰ متری؟
کاربر: ۹۵ متری نارمکه، ۷۰ متری تهرانپارس.
مشاور: ممنون، پس می‌شینه سر جاش. اون ۹۰ متری که اول گفتید یعنی همون ۹۵ متری نارمکه، درسته؟
کاربر: آره همونه، من مترش رو تقریب گفتم.
مشاور: باشه، بعداً از سند دقیقش می‌کنیم. برای نارمک: الان خالیه؟
کاربر: آره خالیه.
مشاور: و تهرانپارس؟
کاربر: اون مستأجر داره.
مشاور: دیدم، پس نقشه‌مون روشن‌تر شد: نارمک خالی → الان اجاره می‌تونه بره؛ تهرانپارس با مستأجر → فروشش تا تخلیه عقب می‌افته یا با تخفیف. فعلاً برای نارمک جلو بریم؟ اجاره دلخواهتون چقدره؟
کاربر: نمی‌دونم، حدود ۳۰؟
مشاور: نارمک ۹۵ متری درست همین بازه‌ست، ۳۰ با رهن ۱۵۰. می‌ذارم؟
کاربر: آره.
مشاور: تهرانپارس رو هم یادداشت می‌کنم که «فروش در آینده، فعلاً با مستأجر» تا بعد از قراردادش برگردیم سراغش. این ترتیب اوکیه؟
کاربر: آره، خوبه.
[decision point: sequenced handling confirmed]

### Transcript 3 — preference change/correction
مشاور: مینا جان، برای نارمک دوتا خانواده واجد شرایط داریم، آماده‌ی قرارداد دوساله.
کاربر: یه لحظه، راستش تهرانپارس رو گذاشتم کنار، می‌خوام اون رو هم اجاره بدم نه بفروشم.
[decision point: workflow reassignment of second asset → confirm, tag both as rent]
مشاور: باشه، پس هر دو ملک اجاره می‌شن. تهرانپارس ۷۰ متری که مستأجر داره، قراردادش تا دی‌ماه — بعدش با مستأجر جدید می‌بندیم یا تخلیه؟
کاربر: خودش خوبه، تمیزیده. تمدید کنه ادامه بده.
مشاور: پس برنامه‌ش: دی‌ماه قرارداد تمدید با همون مستأجر به نرخ جدید. قیمت جدید حدود ۲۵ می‌شه با رهن ۸۰، اوکیه؟
کاربر: آره باشه.
مشاور: و نارمک همون مسیر اجاره دوساله بمونه؟
کاربر: آره، همون.
مشاور: انجام شد — پرونده فروش تهرانپارس بایگانی شد، دو تا واحد تو ماژول اجاره‌ات هستن. گزارش ماهانه هر دو رو یه‌جا می‌فرستم.
کاربر: ممنون.

---

## WF-OWN-P10 — Property Listing & Ownership × دکتر امیری — Remote property owner (abroad)
**Persona definition:** دکتر امیری، ۵۰ ساله، جراح ساکن تورنتو، مالک آپارتمان ۱۰۰ متری سعادت‌آباد که مادرش سابقاً در آن ساکن بود و حالا خالی است. از خارج کشور مالکیت را مدیریت می‌کند.
**Motivation:** Keep the asset in the family while generating income; zero day-to-day involvement possible from abroad.
**Circumstances:** 8-hour time difference; relies on a local cousin sporadically; worried about being scammed and about voids/tenant damage.
**Priorities:** Trust and transparency above all; remote-capable process (digital signatures, video visits, bank transfer abroad); stable income.
**Initial approach:** "من تو کانادام، خونه سعادت‌آباد خالیه. همه‌چیز باید بدون من فیزیکی حل شه."
**Questions to ask:**
1. خونه الان چه وضعیه؟ خالیه؟ کلید کیه؟ (prop_condition, key custody)
2. از خارج می‌خوای مدیریت کامل بدی یا فقط اجاره‌گیری؟ (mgmt_preference)
3. اجاره انتظاری؟ (rent_amount, deposit_amount)
4. پول اجاره رو کجا واریز بشه؟ حساب ایران یا خارج؟ (grt_payout)
5. وکالت یا کارت به کسی دادی که امضا کنه؟ (remote authority)
6. ساختمون وضعیتش چطوره؟ آب‌نشتی و مشابه چک شده؟ (prop_condition, maintenance)
7. ساعات تماس مناسب تو با اختلاف ساعت؟ (contact_window)
**Questions to avoid:**
1. Asking him to attend visits or sign in person — impossible; offer proxies.
2. Small talk requiring local presence («خودت برید ببینید»).
3. Asking his cousin's availability as a hard requirement — cousin is optional backup.
4. Pushing physical paperwork only — always offer digital alternative.
**Required info:** prop_area, prop_neighborhood, prop_condition, mgmt_preference, rent_amount, grt_payout, remote_authority (وکالت/نماینده), contact_window
**Optional info:** prop_rooms, prop_age, furnishing, doc_status, listing_photos, tenant_pref, visit_availability (via video), key_custody
**Conditional questions:**
- IF mgmt_preference = کامل THEN introduce management fee (15-20%) + monthly video report.
- IF no local authority THEN guide وکالت رسمی at Iranian consulate (Toronto) before contract signing.
- IF unit stays vacant > 2 months THEN offer guaranteed rent as vacancy-proof alternative.
**Alternative paths:** Guaranteed rent with foreign-account payout; temporary furnished rental for diaspora visitors; eventual sale via proxy (WF-SALE).
**Completion criteria:** management tier + rent numbers + payout method + local authority status captured AND owner approves digital contract flow.
**Recovery scenarios:** Owner can't produce local authority in time → pause listing, run video-visit pipeline meanwhile. Concerns about theft/occupancy → offer smart-lock + periodic inspection reports.

### Transcript 1 — normal success
کاربر: سلام، دکتر امیری هستم، تو تورنتو زندگی می‌کنم. یه آپارتمان ۱۰۰ متری سعادت‌آباد دارم که خالیه. همه‌چیز باید بدون حضور من حل شه، می‌فهمید؟
مشاور: سلام دکتر امیری، خوشحالم که با مالینو تماس گرفتید. کاملاً درک می‌کنم — پرونده‌های از راه دور بخش زیادی از کار ماست: بازدید ویدیویی، قرارداد دیجیتال، گزارش ماهانه. خونه الان چه وضعیه؟ خالی و سالم؟
کاربر: خالیه، دو ساله. کلیدش نزد برادرزاده‌م هست تو تهران.
مشاور: عالیه، یه تماس محلی دارید که خوبه. از خارج چطور کار می‌کنید؟ می‌خواید مدیریت کامل با ما باشه — از پیدا کردن مستأجر تا تعمیرات — یا فقط مستأجر پیدا کنیم؟
کاربر: مدیریت کامل. من نمی‌تونم برای هیچ‌چیز بیام.
[decision point: mgmt_preference = full remote → fee + monthly report flow]
مشاور: پس مدیریت کامل ماهانه ۲۰٪ اجاره، شامل بازدید ویدیویی هر مستأجرِ پیشنهادی که خودتون از تورنتو ببینید و تأیید کنید، گزارش ماهانه با عکس و رسید تعمیرات، و واریز اجاره. واریز به حساب ایران یا حساب خارج؟
کاربر: حساب خارج، دلاری می‌فرستم.
مشاور: ثبت شد، گزینه حواله ارزی داریم. اجاره انتظاری؟
کاربر: بازار الان چنده سعادت‌آباد؟
مشاور: برای ۱۰۰ متر سعادت‌آباد خوب، حدود ۶۵ تا ۷۵ میلیون با رهن ۴۰۰–۵۰۰. من ۷۰ با رهن ۴۵۰ پیشنهاد می‌کنم.
کاربر: اوکیه. یه نگرانی: مستأجر خرابکاری کنه، من که اینجام.
مشاور: درسته نگران باشید، راه‌حل‌ها رو داریم: ودیعه سنگین، قرارداد با شرط تخلیه سریع، بازدید دوره‌ای با عکس، و آپشن قفل هوشمند. اجاره‌ها هم مالینو ضمانت پرداخت ماهانه‌ش رو داره. مستأجر خانواده می‌خواید یا فرقی نمی‌کنه؟
کاربر: فرقی نمی‌کنه، فقط معتمد باشه.
مشاور: اوکی. یه مورد اداری مهم: برای امضای قرارداد، وکالت رسمی لازمه — تو کنسول ایران تو تورنتو قابل انجامه، من چک‌لیستش رو برات می‌فرستم. تا اون موقع بازدید ویدیویی و مستأجرها رو آماده می‌کنم که وقت تلف نشه.
کاربر: خیلی خوبه، چک‌لیست رو بفرست.
[decision point: legal proxy gate + parallel pipeline to avoid idle time]

### Transcript 2 — incomplete/ambiguous
کاربر: خونه‌مون تو تهران خالیه، می‌خوام اجاره بدم ولی من بیرون از کشورم.
مشاور: سلام و خوش اومدید! خونه کجاست؟
کاربر: سعادت‌آباد. مترش رو هم یادم نیست دقیق... بین ۹۵ تا ۱۰۵؟
[decision point: ambiguous area → defer to deed, proceed with midpoint]
مشاور: باشه، از روی سند دقیقش می‌کنیم — عکس سند رو بفرستید. فعلاً با ۱۰۰ تخمین می‌زنم. خالی هست یا کسی توشه؟
کاربر: خالیه ولی... راستش کلید کجاست رو باید بپرسم از خواهرم. فکر کنم نزد اون.
مشاور: اوکیه، کلید رو شناسایی می‌کنیم تا بازدید ویدیویی بذاریم. تا اون موقع سؤال کلیدی: مدیریت کامل می‌خواید یا فقط اجاره‌گیری؟
کاربر: نمی‌دونم، فرقشون چیه؟
مشاور: ساده: اجاره‌گیری یعنی مستأجر پیدا می‌کنیم و بقیه‌ش با شماست؛ مدیریت کامل یعنی ماهی ۲۰٪ کارمزد و ما همه‌چیز رو می‌چینیم — چون شما خارجید، معمولاً این بهتره.
کاربر: پس همون کامل.
مشاور: ثبت شد. اجاره دلخواهتون؟
کاربر: شما بگید.
مشاور: حدود ۷۰ میلیون با رهن ۴۵۰ برای ۱۰۰ متر سعادت‌آباد. اوکیه؟
کاربر: آره.
مشاور: پس امروز ثبت شد: سعادت‌آباد ~۱۰۰ متر، خالی، مدیریت کامل، ۷۰/۴۵۰. دو تا کار باقی مونده: عکس سند، و مشخص شدن محل کلید. فردا یادآوری می‌فرستم.
کاربر: ممنونم.

### Transcript 3 — preference change/correction
مشاور: دکتر امیری، دو تا کاندیدای مستأجر ویدیو بازدید کردن، هر دو خانواده معتبر. منتظر وکالت‌تون هستیم برای قرارداد.
کاربر: راستش با خودم گفتم: تا وکالت درست شه شاید دو ماه بشه. بذار همین الان اجاره تضمینی بدیم، با همون واریز دلاری.
[decision point: switch to GRT while proxy pending → hybrid path]
مشاور: تصمیم کاربردی‌ایه! اجاره تضمینی یعنی مالینو ماهانه رقم ثابت می‌ده حتی اگه مستأجر نداشته باشیم، و کارمزدش کمی بیشتره، حدود ۲۲–۲۵٪. واریز دلاری همون سیستمه. با این تغییر موافقید؟
کاربر: آره، مهم اینه که پول قطع نشه.
مشاور: پس مسیر شد: قرارداد تضمینی که امضاش رو می‌شه با وکالتِ در راه باطل کرد و بعدش به مدیریت معمولی برگشت، یا ادامه داد. دو تا کاندیدای بازدید رو هم می‌گم بهتون که اگه یکی‌شون تأیید شد، از همون ماه اول مستأجر می‌شیم و درآمدتون از همون ماه شروع می‌شه.
کاربر: عالیه، همین کار رو بکنید.
مشاور: انجام شد. گزارش اول رو آخر ماه با عکس خونه می‌فرستم.

---

## WF-GRT-P11 — Guaranteed Rent × خانم صالحی — Owner seeking stable rental income
**Persona definition:** خانم صالحی، ۶۱ ساله، بازنشسته، مالک واحد ۸۰ متری پیروزی. دچار خستگی از مستأجرها شده: سه سال پشت‌سرهم خرابی و دیرکرد. می‌خواهد درآمد قطعی ماهانه بدون دغدغه.
**Motivation:** Predictable pension-like income; zero involvement in tenant problems; emotional relief matters as much as money.
**Circumstances:** Unit is her only income-producing asset; she underprices historically out of fear of vacancies.
**Priorities:** Guaranteed monthly amount > maximizing rent; long contract; small consistent payout she can budget on.
**Initial approach:** "از مستأجر خسته شدم. یه چیزی می‌خوام که هر ماه همون پول رو بده، دیگه نمی‌خوام بکشم."
**Questions to ask:**
1. الان مستأجر داره یا خالیه؟ (prop_condition)
2. چقدر اجاره می‌گیری الان؟ (current_rent → benchmark)
3. چند درصد کسر کارمزد برات قابل قبوله بابت ضمانت؟ (mgmt_fee_accept, grt_fee_accept)
4. پayout به حساب خودت؟ (grt_payout)
5. مدت قرارداد تضمینی چند سال برات اوکیه؟ (grt_guarantee_months)
6. اگه مستأجر خرابکاری کنه یا خالی بمونه، ترجیحت چیه؟ (vacancy_tolerance)
7. مشخصات واحد: متر، طبقه، وضعیت؟ (prop_area, prop_floor, prop_condition)
**Questions to avoid:**
1. Complex ROI talk — she wants simplicity.
2. Asking her to choose tenants or attend visits — defeats the purpose.
3. Long questionnaires — she's retired and tired; keep it under 8 questions total.
4. Selling her on renovation costs — only if truly blocking.
**Required info:** prop_area, prop_neighborhood, prop_condition, current_rent, grt_fee_accept, grt_payout, grt_guarantee_months, vacancy_tolerance
**Optional info:** prop_rooms, prop_age, furnishing, doc_status, listing_photos, tenant_pref, contact_window
**Conditional questions:**
- IF grt_fee_accept unknown THEN explain model with her current rent as base: «مثلاً ۲۸ میلیون اجاره، ماهی ~۲۳ میلیون قطعی بعد از کارمزد».
- IF payout to bank THEN confirm she'll receive even during vacancy months (core promise).
- IF unit needs minor repair before listing THEN platform covers small fixes and deducts from first months (owner approval required).
**Alternative paths:** If she balks at fee → offer light management (per-issue fee) with partial guarantee; if she later wants to sell → convert to WF-SALE with tenant-in-place data as selling point.
**Completion criteria:** guaranteed amount + fee % + contract duration + payout account captured AND owner signs GRT agreement.
**Recovery scenarios:** Owner mistrusts «تضمین» word → explain mechanics concretely (who pays, when, what if vacant) and show sample contract. She fears fee is «دزدی» → show vacancy-cost math over 12 months.

### Transcript 1 — normal success
کاربر: سلام. من خانم صالحی‌م، بازنشسته‌ام. از مستأجر خسته شدم، هر سال یه دردسره. یه مدل می‌خوام که هر ماه پول قطعی برسه، دیگه خودم دخالت نکنم.
مشاور: سلام خانم صالحی، خیلی خوش اومدید. چیزی که توصیف کردید دقیقاً «اجاره تضمینی» ماست: مالینو خونه رو مدیریت می‌کنه، مستأجر رو خودمون انتخاب می‌کنیم، و هر ماه رقم ثابت به حسابتون می‌رسه — حتی اون ماهی که خونه خالیه. کاری که شما باید بکنید: هیچ! ولی بذار با جزئیات چک کنیم. خونه الان مستأجر داره یا خالیه؟
کاربر: داره، ولی قراردادش تا خرداده و من رضایت ندارم اون بمونه، دو ماهه اجاره نداده.
[decision point: existing delinquent tenant → platform handles exit/notice]
مشاور: دیدم، پس اون پرونده رو هم ما می‌بندیم: اطلاعیه رسمی و تسویه تا خرداد، خونه رو تحویل بگیریم. مشخصات خونه؟
کاربر: ۸۰ متر، طبقه ۲، پیروزی، تمیزه.
مشاور: الان چقدر اجاره می‌گیرید؟
کاربر: ۲۲. می‌دونم کمه ولی می‌ترسیدم خالی بمونه.
مشاور: درک می‌کنم، این ترس خیلی رایجه. بازار پیروزی برای ۸۰ متر الان ۲۶ تا ۳۰ می‌گیره با رهن ~۱۵۰. با مدل تضمینی، ما ۲۸ می‌بندیم، کارمزد حدود ۱۸٪ می‌شه، و شما ماهی حدود ۲۳ میلیون قطعی می‌گیرید — حتی اگه دو ماه خالی بمونه. با این عدد چطورید؟
کاربر: ۲۳ قطعی بهتره از ۲۲ که نصفش هم دیر میاد!
مشاور: دقیقاً، ریاضیاتش همینه. کارمزد ۱۸٪ برات اوکیه؟
کاربر: اوکیه، به شرطی که واقعاً قطعی باشه.
[decision point: grt_fee_accept confirmed → contract mechanics]
مشاور: قطعی بودنش توی قرارداده: مبلغ، تاریخ واریز (اول هر ماه)، و اینکه کارمزد از اجاره کسر می‌شه نه جداگانه از شما. مدت قرارداد؟ دو ساله معمول‌تره.
کاربر: دو سال خوبه.
مشاور: واریز به حساب بانکی خودتون؟
کاربر: آره، همون حساب بازنشستگی‌ام.
مشاور: تمام. پس: پیروزی ۸۰ متر، اجاره ۲۸، پرداخت قطعی ۲۳، کارمزد ۱۸٪، قرارداد دو ساله، خروج مستأجر فعلی تا خرداد. تا پنج‌شنبه پیش‌نویس قرارداد میاد که با خیال راحت بخونید، و هر سؤالی داشتید من توضیح می‌دم.
کاربر: ممنونم، بالاخره یه نفس راحت کشیدم.

### Transcript 2 — incomplete/ambiguous
کاربر: می‌خوام خونه‌ام رو بدم به شما که خودتون مستأجر بذارید و به من پول بدید. ولی نمی‌دونم چطوره و چقدر می‌شه.
مشاور: سلام و خوش اومدید! همون «اجاره تضمینی»ه — من دقیق توضیح می‌دم بعد می‌ریم سراغ خونه. خونه کجاست؟
کاربر: پیروزی. مترش هم... ۸۰؟ شایدم ۷۵.
[decision point: approximate area → fine-tune later, don't block]
مشاور: باشه، از سند دقیقش می‌کنیم؛ فعلاً با ۸۰ می‌گم. خالیه؟
کاربر: خالیه از اسفند.
مشاور: عالی، یعنی سریع شروع می‌شه. حالا مدل کار: ما خونه رو می‌گیریم برای مدیریت، مستأجر می‌ذاریم، و هر ماه رقم ثابت می‌ریزه به حسابتون — حتی ماه‌های خالی. رقم بستگی به اجاره بازار داره: پیروزی ۸۰ متری حدود ۲۶–۳۰ اجاره می‌گیره، و بعد از کارمزد حدود ۱۸٪، به شما حدود ۲۲–۲۴ قطعی می‌رسه. این برایتان قابل قبوله؟
کاربر: من الان هیچی نمی‌گیرم چون خالیه! پس هر چی بده بهتره از هیچ.
مشاور: دیدم، پس این مدل برای شما دقیقاً ساخته شده. چند سؤال کوچیک تا قرارداد: سن بنا و طبقه؟
کاربر: ۱۵ ساله، طبقه ۲، آسانسور نداره.
مشاور: اوکی. قرارداد چند ساله ببندیم؟
کاربر: نمی‌دونم، شما بگید.
مشاور: معمولش دوساله — برای شما قطعیت بیشتر، برای ما مدیریت بهتر. دو سال؟
کاربر: باشه.
مشاور: و پول به حساب خودتون واریز شه؟ شماره حساب رو تو قرارداد می‌ذاریم.
کاربر: آره. فقط یه چیز: ترسیدم نکنه خونه رو خراب کنن.
مشاور: نگرانی منطقیه: بازدید دوره‌ای داریم و خرابی‌های معمول رو ما از محل کارمزد جبران می‌کنیم، و خرابی‌های سنگین مستأجر از ودیعه‌ش. این بند تو قرارداد میاد.
کاربر: آهان، این خوبه.
مشاور: پس تکمیل شد: ~۸۰ متر پیروزی، خالی، دوساله، واریز بانکی، پرداخت قطعی ~۲۳. تا فردا پیش‌نویس میاد.
[decision point: GRT agreement flow started]

### Transcript 3 — preference change/correction
مشاور: خانم صالحی، قرارداد تضمینی آماده‌ست: ۲۸ اجاره، پرداخت ۲۳ قطعی، دوساله.
کاربر: یه فکری به سرم زد. اگه ماهی ۲۵ بدهید چی؟ بیشتر منصفانه نیست، خونه من قشنگه.
[decision point: payout negotiation → transparent fee trade-off]
مشاور: خانم صالحی، عدد ۲۵ می‌شه اگه اجاره رو ۳۰ ببندیم — ولی خونه بدون آسانسور با این سن، ۳۰ کم‌خریداره و اگه یک ماه خالی بمونه، همون‌جا ضررش برمی‌گرده به بند ضمانت. پیشنهادم: ۲۳ قطعی با ضمانت کامل بمونه، چون عدد قطعی ارزش‌ش از عدد بالای مشکوک بیشتره. اگه بعد از یه سال دیدیم بازار بالا رفته، افزایش رو تو تمدید اعمال می‌کنیم.
کاربر: هوم... باشه، منطقته درسته. ۲۳ بمونه.
مشاور: ممنون از انصافتون. توی قرارداد بند «بازنگری سالانه» رو هم می‌ذارم که بالای سرتون آویزون نباشه.
کاربر: ممنون.

---

## WF-SALE-P12 — Property Sales × آرمان — Owner seeking faster sale (rent-to-sell bridge)
**Persona definition:** آرمان، ۳۵ ساله، مهندس، مالک واحد ۷۵ متری افسریه که یک سال است فروش نمی‌رود (خریدارها ضعیف معامله می‌کنند). می‌خواهد فروش سریع‌تر شود؛ حاضر است خالی نماند و تا فروش، درآمد هم داشته باشد.
**Motivation:** Asset is stagnant — money and opportunity stuck. Wants activation (rent/GRT) without giving up the sale goal.
**Circumstances:** Listing is already 12 months old; price dropped twice; unit is semi-furnished; he's tired of unqualified visits.
**Priorities:** Diagnose WHY it doesn't sell (price? photos? neighborhood segment?), then either fix the listing or bridge with rental income.
**Initial approach:** "یک ساله آگهی هست، خریدار نمیاد. مشکل کجاست؟"
**Questions to ask:**
1. قیمت الان چنده و قبلاً چقدر بود؟ (expected_price, price history)
2. تو این یک سال چند بازدید جدی داشت؟ پیشنهاد اومد؟ (listing analytics)
3. عکس‌ها حرفه‌ای‌ست؟ (listing_photos)
4. چرا فروخته نمی‌شه به نظر خودت؟ (owner diagnosis)
5. حاضری بین ۳–۵٪ تخفیف بدی برای معامله سریع؟ (min_price)
6. تا فروش، اجاره تضمینی می‌پذیری که خالی نذاره؟ (grt acceptance)
7. اگه مستأجر بیاد، فروش رو با مستأجر می‌فروشی یا بعد از قرارداد؟ (sale-with-tenant preference)
8. تایم‌لاین هدف برای فروش؟ (target_timeline)
**Questions to avoid:**
1. Blaming the owner's price bluntly at start — diagnose with data first.
2. «چرا این‌قدر قیمت گذاشتی؟» — judgmental.
3. Pushing full guaranteed rent before showing diagnosis — needs trust.
4. Asking him to rebuild/renovate — he wants exit, not investment.
**Required info:** expected_price, price_history, min_price, listing_analytics (visits/offers), target_timeline, grt_acceptance, sale_with_tenant_pref
**Optional info:** prop_area, prop_age, prop_floor, prop_condition, listing_photos, furnishing, doc_status, visit_availability
**Conditional questions:**
- IF listing analytics = low visits THEN problem is exposure/price → propose re-listing with new photos and price test.
- IF high visits but no offers THEN price is above market perception → present 3-5% discount-for-speed option.
- IF owner accepts GRT bridge THEN confirm exit clause: sale takes precedence, contract cancellable on sale.
- IF min_price far above market THEN be honest that no channel fixes it; set expectations.
**Alternative paths:** GRT bridge (income while selling), furnished short-term rental, price-test relaunch (30-day campaign), or accept lower cash offer (فروش نقد سریع).
**Completion criteria:** diagnosis (price vs exposure) agreed + chosen path (relaunch / discount / GRT bridge) + price floor captured AND owner approves revised listing plan.
**Recovery scenarios:** Owner rejects all data («قیمت من درستـه») → keep listing alive but set 60-day review with agreed metrics. GRT tenant in place then buyer arrives → exit-clause negotiation handled per contract.

### Transcript 1 — normal success
کاربر: سلام. یه واحد تو افسریه دارم که یک ساله تو سایت‌ها هست و فروش نمی‌ره. خسته شدم. مشکل کجاست؟
مشاور: سلام آرمان جان، خوش اومدی. بذار مثل دکتر معاینه کنیم تا بفهمیم مشکل چیه. اول قیمت: الان چنده گذاشتی و اول کار چند بود؟
کاربر: اول ۳/۸ بود، الان ۳/۵.
[decision point: price history + analytics needed → diagnose price vs exposure]
مشاور: دیدم، یعنی حدود ۸٪ کاهش. الان تو این یک سال چند تا بازدید جدی داشتی؟ پیشنهاد اومد؟
کاربر: بازدید کلی زیاد بود، شاید بیست تا. ولی فقط دو تا پیشنهاد جدی، هر دو ۳/۲ می‌دادن که قبول نکردم.
مشاور: این داده طلاییه: بازدید زیاد + پیشنهاد کم یعنی آگهی دیده می‌شه ولی خریدار قیمت رو «نمی‌خره» — پس مشکل قیمت‌گذاریه، نه تبلیغ. بازار افسریه ۷۵ متری الان واقعیتش حول ۳/۲–۳/۳ می‌چرخه. چطور می‌شه با ۳/۲ کنار اومد؟
کاربر: سخته ولی... اگه سریع تموم شه قبولم.
مشاور: پس یه کف می‌گیرم: زیر ۳/۱ نه، درسته؟
کاربر: آره، ۳/۱ حد نهاییه.
[decision point: min_price = 3.1 → feasible path to quick deal]
مشاور: خوبه، شدنیه. دو تا مسیر پیش‌پای شما: یکی آگهی تازه با عکاس حرفه‌ای و قیمت ۳/۲۵ که دو تا هفته کمپین جدی می‌شه؛ دوم، چون گفتید خسته‌اید و خونه هم خالیه، می‌تونیم تا فروش اجاره تضمینی بدیم که ماهی ~۲۰ میلیون قطعی برسه — و به‌محض فروش، قرارداد با شرط فسخ سریع تموم می‌شه. کدوم به حالت شما می‌خوره؟
کاربر: دومی بهتره، خونه خالی بمونه یعنی هم پول از دست بدم هم هیولای فروش.
مشاور: دیدم. پس هر دو رو هم‌زمان راه می‌اندازم: آگهی جدید می‌ره، مستأجر هم پیدا می‌شه — و بگم مستأجر بمونه موقع فروش، فروش با مستأجر رو می‌پذیری یا بعدش؟
کاربر: بستگی داره، اگه مستأجر منظم باشه شاید حتی کمک کنه فروش.
مشاور: ثبت کردم به‌عنوان «فروش با مستأجر فعال: قابل‌بررسی». عکس‌های جدید رو هم بفرست یا عکاس ما بره. تا آخر هفته دو تا مسیرتون آماده‌ست.
کاربر: ممنون، بالاخره یه کسی داده‌ها رو نگاه کرد!
[decision point: dual-track plan confirmed with exit clause noted]

### Transcript 2 — incomplete/ambiguous
کاربر: خونه‌م فروش نمی‌ره. قیمتش هم نمی‌دونم، همسایه‌هاشون یکی ۳/۵ داد یکی گفت ۳.
مشاور: سلام! بذار با داده بفهمیم. واحد کجاست و چند متره؟
کاربر: افسریه، ۷۵ متر فکر کنم. شایدم ۸۰.
[decision point: uncertain area → verify from deed before any price verdict]
مشاور: باشه، این ۵ متر تو افسریه حدود ۲۰۰–۳۰۰ میلیون فرق می‌کنه، پس دقیقش رو از سند می‌گیرم — عکس سند یا پلاک رو بفرست. تا این یک سال آگهی داشتید، بازدیدها زیاد بود یا کم؟
کاربر: آره زیاد بود، همه میومدن می‌گفتن خوبه ولی می‌رن.
مشاور: این نشونه‌ی قیمت‌گذاریه: آگهی جذابه ولی عدد بالای سقفِ قلبِ خریداره. پس پیشنهاد من یه قیمت‌گذاری جدید می‌شه، نه تبلیغ جدید. الان حداقلی که معامله می‌کنی چنده؟
کاربر: نمی‌دونم... ۳؟ نکنه کم بفروشم؟
مشاور: نگرانی طبیعیه. بیا این‌طور: بازار فعلی ۷۵ متری افسریه حدود ۳/۲–۳/۳ است. من قیمت ۳/۲۵ می‌ذارم با آگهی حرفه‌ای؛ اگه سه هفته پیشنهاد زیر ۳/۱ اومد، یعنی باید اون سمت بریم و اون موقع بهت می‌گم، تصمیم با خودته. اوکیه؟
کاربر: باشه، این قابل قبوله.
مشاور: عکس‌ها هم فعلاً چه حالیه؟
کاربر: خودم گرفتم با گوشی... خوب نیستن.
مشاور: پس عکاس بره، مهمه — اولین تصویر قصه‌ی کل آگهی‌ست. خلاصه امروز: افسریه ~۷۵ متر، قیمت تستی ۳/۲۵، عکاس میاد، سه‌هفته مرور. سندت هم تک‌برگه؟
کاربر: آره.
مشاور: عالی، پس مسیر بازه. عکس سند رو بفرست که متراژ دقیق قفل شه.
[decision point: price-test mode with review gate]

### Transcript 3 — preference change/correction
مشاور: آرمان جان، کمپین دو هفته‌ای تموم شد: چهار بازدید، دو پیشنهاد — ۳/۱ و ۳/۱۵.
کاربر: ببین، نظر دیگه‌ای دارم. فروش رو ول کن فعلاً. فقط اجاره تضمینی بده، دو سه سال بعدش می‌فروشم.
[decision point: sale paused → GRT becomes primary, exit clause for future sale]
مشاور: باشه، تصمیم کاملاً قابل قبوله — تا بازار بهتر شه، خونه بی‌درآمد نمونه. پیشنهاد ۳/۱۵ رو هم نگه می‌دارم توی پرونده، اگه تا یه هفته دیگه خریدار عوضش کرد، بهت می‌گم که بفهمی چی از دست دادی یا شاید برعکس خوشحال شی که نرفتی. قرارداد تضمینی با شرط فسخ در صورت تصمیم به فروش می‌بندم، که بعداً گیر نکنی.
کاربر: آره حتماً اون شرط باشه.
مشاور: می‌ذارم. اجاره حدود ۲۸ می‌شه، پرداخت قطعی ماهانه‌ت ~۲۲–۲۳ بعد کارمزد. اوکیه؟
کاربر: اوکیه.
مشاور: پس مسیر عوض شد: فروش → حالت انتظار با پرونده زنده، اجاره تضمینی → فعال. هر سه ماه یه بار وضعیت فروش رو هم بهت گزارش می‌دم که گزینه‌ها جلوی چشمت باشه.
کاربر: ممنون.

---

## Cross-persona design rules (summary for V0.29 spec)
1. **Confirm-before-reuse:** any stored field shown back to owner verbatim before acting on it (P03, P09, P10).
2. **One question at a time, any order:** transcripts show agent accepting info out of order and back-filling later (P05 T2, P08 T2).
3. **Ambiguity tolerance:** hold uncertain values with a "verify later" tag (متراژ، سند، کلید) instead of blocking (P01 T2, P07 T2, P10 T2).
4. **Self-corrections win:** latest user statement overrides earlier stored values, with explicit re-confirmation (P02 T3, P07 T3, P12 T3).
5. **Workflow switching is first-class:** sale ↔ rent ↔ guaranteed rent transitions keep the property profile intact (P05 T3, P10 T3, P12 T3).
6. **Legal gates block listing, not conversation:** doc/partition/proxy issues pause listing but keep data collection and market work alive (P04 T2, P06 T2, P10 T1).
7. **Honest market feedback with data:** visits-vs-offers analytics decides between price problem vs exposure problem (P02 T3, P12 T1).











