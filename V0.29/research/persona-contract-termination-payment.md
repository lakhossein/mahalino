# Mahalino+ V0.29 — Persona Research: Contract / Termination / Payment Workflows

> Research artifact. Simulated multi-turn persona transcripts for the three financial-contractual workflows:
> (WF-C) Contract drafting & registration — chat-form, token-paid draft generation, statuses draft→approved→finalized→terminated
> (WF-T) Contract termination — free basic registration, PAID AI document analysis, deposit-return slider
> (WF-P) Payment agreements — installment negotiation, optional PAID escrow service
>
> All dialogue is Persian (RTL), informal friendly Iranian agent tone ("شما" colloquial). English structural headers.

---

## 0. Global Design Rules Applied Across All Transcripts

1. **Deterministic validation for financial/contractual operations (non-negotiable).** Rahn/rent amounts, dates, national IDs, IBANs, and installment schedules are validated with hard rules — the LLM never "invents" a valid number.
   - `rahn_amount`, `rent_amount`, `installment_amount` > 0, integer, ≤ 5,000,000,000 toman.
   - **Rahn/rent sanity rule:** every 1,000,000 toman of rahn ≈ 66,000 toman/month reduction in rent. Example: full-rahn contract of 1.5B ≈ rent 0. If the user's pair deviates more than ±25% from the market curve derived from their declared baseline, the validator emits a deterministic warning card; the user must explicitly confirm override (`override_confirmed=true`) before the draft can be generated.
   - `term_months` ∈ {12, 24, 36} (custom 6–60 allowed with warning).
   - `move_date` / `surrender_date` must be ≥ today and ≤ term end for rental contracts.
   - `installment_count` ∈ 2–24; sum of `installment_amount` × count must exactly equal `total_amount` (validator blocks submission on mismatch).
   - `national_id`: 10 digits, Iranian checksum; `deposit_iban`: 24-digit IR format (checksummed).
2. **Scope guard (no legal advice).** The agent explains what a field/clause means and what options exist, but never says "you should" on legal matters. Standard line: «من مشاور حقوقی نیستم؛ برای تصمیم نهایی بهتره نظر وکیل یا مشاور رسمی رو هم بگیرید.»
3. **Sensitive-information warning.** Before any share action (contract link, document, termination record): «این صفحه اطلاعات حساس مالی و هویتی داره؛ فقط برای طرف خودِ قرارداد بفرستیدش.»
4. **Token-cost confirmation moment (mandatory, explicit).** Before every paid service:
   - Contract draft generation: **40 توکن**
   - AI document analysis (termination wf): **30 توکن**
   - Escrow service setup (payment wf): **25 توکن**
   The agent must show service name, cost, remaining balance, and get an explicit «بله / تأیید» before charging.
5. **Progressive profiling.** Never ask more than one question per turn; skip questions answerable from prior context; mark optional fields skippable.
6. **Conventions used in transcripts (2026 Tehran):** رهن 100M–1.5B toman; اجاره 15–80M/month; contracts 1–3 years; typical clauses: وثیقه، تحویل فوری/غیرفوری، تخلیه، عقد اجاره بلاگشت.
7. Transcript notation: `[decision point: …]` marks a branch/UX decision; `→ field:` marks captured field IDs.

---

# SECTION A — WORKFLOW C: CONTRACT DRAFTING & REGISTRATION

## C-LL — Contract × Landlord (موجودی‌دار)
**Persona definition:** Ms. Rahmani, 52, owns a 75m² apartment in Saadat-Abad, Tehran. First time using a chat-based contract service; previously used a handwritten اجاره‌نامه through a local realtor.
**Motivation:** Rent out the apartment quickly but protect herself: high rahn, clear تخلیه clause, عقد اجاره بلاگشت.
**Circumstances:** Tenant already found (relative of a colleague); wants contract signed this week; apartment is تحویل‌فوری.
**Priorities:** (1) deposit protection, (2) precise surrender/تخلیه terms, (3) speed.
**Initial approach:** Opens chat: «می‌خوام برای خونه‌م قرارداد اجاره تنظیم کنم.»
**Questions to ask (5–8 adaptive):**
1. نوع قرارداد؟ اجاره مسکونی / خریدوفروش / مشارکت → `contract_type`
2. نقش شما طرف قرارداد چیه؟ موجر / مستأجر → `party_role`
3. ملک کجاست و چند متر؟ → `property_address`, `property_type`, `area_sqm`
4. رهن و اجاره چقدر تنظیم می‌کنید؟ (پیشنهاد نسبت بازار رو نشون بده) → `rahn_amount`, `rent_amount`
5. مدت قرارداد چقدر باشه؟ → `term_months`
6. تحویل کی اتفاق بیفته؟ فوری یا تاریخ مشخص؟ → `move_date`, `delivery_type`
7. شرط تخلیه و وثیقه رو چطور می‌خواید؟ → `evacuation_clause`, `collateral_clause`
8. مشخصات مستأجر رو دارید؟ → `tenant_name`, `tenant_national_id`
**Questions to avoid:**
- «چرا این‌همه رهن گرفتید؟» — judgmental; instead present the deterministic ratio check.
- «شماره کارت/رمز بانکی مستأجر رو بفرست» — never collect payment credentials.
- Complex legal drafting questions («بند فسخ رو خودم بنویسم؟») — out of scope; offer standard clause picker.
**Required info:** `contract_type=rental_residential`, `party_role=landlord`, `property_address`, `property_type=apartment`, `area_sqm`, `rahn_amount`, `rent_amount`, `term_months`, `move_date`, `landlord_name`, `landlord_national_id`, `tenant_name`, `tenant_national_id`
**Optional info:** `evacuation_clause`, `collateral_clause`, `witness_info`, `utility_debt_note`, `agency_fee_note`
**Conditional questions:** If رahn > 400M → ask whether contract should be «عقد اجاره بلاگشت» (renewal-locked). If tenant is a company → `company_registration_no`.
**Alternative paths:** (a) Use previous contract template from profile; (b) invite tenant into the chat to fill their side; (c) pause and resume later (draft state preserved).
**Completion criteria:** All required fields captured, deterministic rahn/rent check passed or explicitly overridden, token confirmation accepted, draft generated with status `draft`, sensitive-info warning shown on share.

### Transcript 1 — normal success
[decision point: agent detects "قرارداد اجاره" intent immediately; skip intro]
**کاربر:** سلام، برای اجاره‌ی خونه‌م می‌خوام قرارداد تنظیم کنم.
**دستیار:** سلام! خوش اومدید. کاری که می‌کنیم اینه که مرحله‌به‌مرحله باهم یه قرارداد اجاره کامل می‌سازیم. اول بگید شما تو این قرارداد موجرید یا مستأجر؟
[decision point: capture party_role]
**کاربر:** من صاحب خونه‌ام، موجرم.
**دستیار:** عالیه. ملک‌تون کجاست و چند متره؟
→ field: property_address, area_sqm
**کاربر:** سعادت‌آباد، خیابان کاج، پلاک ۱۲، طبقه سوم. ۷۵ متر.
**دستیار:** ثبت شد. حالا مهم‌ترین بخش: رهن و اجاره چقدر می‌خواید باشه؟
**کاربر:** رهن ۵۰۰ میلیون و اجاره ماهی ۲۰ میلیون.
[decision point: deterministic rahn/rent sanity check — 500M rahn ≈ 33M rent reduction from baseline; validator flags deviation from user's implied baseline]
**دستیار:** یه نکته‌ی محاسباتی: با رهن ۵۰۰ میلیون، طبق نسبت معمول بازار (هر یک میلیون رهن ≈ ۶۶ هزار تومن کمتر اجاره)، اجاره‌ی منطقی حدود ۱۰ تا ۱۴ میلیون در میاد. عدد شما از این محدوده بالاتره. می‌خوید همین بمونه یا رهن رو کمتر و اجاره رو نزدیک‌تر به این عدد بذاریم؟
**کاربر:** نه، می‌دونم چی می‌گم. مستأجرم ترجیح داد رهن بیشتر بده. همین بمونه.
**دستیار:** پس ثبت می‌کنم و تیک «تأیید انحراف از نسبت بازار» رو می‌زنم. این تأیید در قرارداد هم ذکر میشه.
→ field: rahn_amount=500,000,000, rent_amount=20,000,000, override_confirmed=true
**دستیار:** مدت قرارداد چقدر باشه؟ یک ساله، دوساله یا سه‌ساله؟
**کاربر:** دوساله.
**دستیار:** تحویل کی انجام بشه؟ خونه الان خالیه؟
**کاربر:** آره، همین هفته تحویل میدم.
→ field: term_months=24, move_date=1405/01/05, delivery_type=فوری
**دستیار:** برای حفاظت شما دو تا بند استاندارد پیشنهاد می‌کنم: «شرط تخلیه در پایان مدت» و «عقد اجاره بلاگشت». اضافه کنم؟
**کاربر:** هر دو. مستأجرم حق نده قرارداد رو ببره جایی دیگه.
→ field: evacuation_clause=true, collateral_clause=عقد اجاره بلاگشت
**دستیار:** و مشخصات مستأجر؟ اسم و کد ملی.
**کاربر:** آقای موسوی، کد ملی ۰۰۱۲۳۴۵۶۷۸.
[decision point: deterministic national_id checksum passes]
**دستیار:** همه‌چیز کامل شد. خلاصه: آپارتمان ۷۵ متری سعادت‌آباد، رهن ۵۰۰ میلیون، اجاره ماهی ۲۰ میلیون، دوساله، تحویل فوری، با شرط تخلیه و بلاگشت. برای تولید پیش‌نویس قرارداد از سرویس پرداختی استفاده می‌کنیم: **۴۰ توکن**. موجودی شما ۶۵ توکنه. تأیید می‌کنید؟
[decision point: TOKEN-COST CONFIRMATION — mandatory before generation]
**کاربر:** بله، تأیید.
**دستیار:** پیش‌نویس ساخته شد و وضعیتش «پیش‌نویس» هست. قبل از فرستادن لینک برای مستأجر یادتون باشه: این صفحه اطلاعات حساس مالی و هویتی داره؛ فقط برای طرف خودِ قرارداد بفرستیدش. هر وقت خواستید وضعیتش رو به «تأییدشده» ببرید، همینجا بگید.
[decision point: draft→approved transition left to user]

### Transcript 2 — incomplete/ambiguous
**کاربر:** می‌خوام خونه‌مو اجاره بدم، قراردادش رو بگیرم.
**دستیار:** خیلی خب. ملک مورد اجاره کجاست؟
**کاربر:** همون خونه‌ی قدیمی خودم.
[decision point: address ambiguous — agent requests disambiguation, not guess]
**دستیار:** برای قرارداد باید نشانی دقیق پلاکی داشته باشیم. نشانی کامل با خیابان و پلاک رو می‌فرستید؟
**کاربر:** بعداً پیداش می‌کنم، اول رهن و اجاره رو بگو.
**دستیار:** باشه، نشانی رو برای بعد نگه می‌دارم ولی بدون نشانی نمی‌تونیم پیش‌نویس نهایی کنیم. رهن و اجاره چقدر تنظیم می‌کنید؟
**کاربر:** ۳۰۰ میلیون رهن، اجاره هم بگید چی خوبه.
[decision point: user asks agent to set a financial number — agent gives market ratio only, never a binding number; deterministic tool computes]
**دستیار:** من مشاور حقوقی نیستم و عدد قطعی پیشنهاد نمی‌دم، ولی ابزار محاسبه‌ی ما نشون میده با رهن ۳۰۰ میلیون، اجاره‌ی هم‌نسبت بازار حدود ۱۸ تا ۲۲ میلیون در میاد. خودتون عدد رو انتخاب کنید.
**کاربر:** باشه، ۲۰ میلیون.
**دستیار:** ثبت شد. مدت قرارداد؟
**کاربر:** هنوز مطمئن نیستم.
**دستیار:** مشکلی نیست؛ پیش‌نویس رو می‌تونیم با علامت «در انتظار تعیین مدت» نگه داریم و بعداً کاملش کنیم. نشانی و مدت رو که فرستادید، برمی‌گردیم سر مرحله‌ی پرداخت.
[decision point: draft parked in `draft` state with missing_fields list; no token charged yet]

### Transcript 3 — preference change/correction
**کاربر:** رهن رو ۵۰۰ گذاشتم بود، ولی مستأجر گفت فقط ۲۰۰ تا رهن می‌تونه بده و بقیه رو اجاره جبران کنه.
**دستیار:** شدنیه. با رهن ۲۰۰ میلیون، اجاره‌ی هم‌نسبت حدود ۲۶ تا ۲۸ میلیون میشه. اجاره رو چقدر می‌ذاریم؟
**کاربر:** ۲۸.
**دستیار:** آپدیت شد: رهن ۲۰۰ میلیون، اجاره ۲۸ میلیون. نسبت با بازار هماهنگه، پس هشدار انحراف حذف شد. بند بلاگشت و تخلیه هم سر جاشونه. چیز دیگه‌ای عوض میشه؟
**کاربر:** مدت هم بذار یک ساله، ببینم کارش درست میشه یا نه.
**دستیار:** ثبت شد: term_months=12. آماده‌ی تولید پیش‌نویس‌اید؟ هزینه همون ۴۰ توکنه.
**کاربر:** بله.

---

## C-TN — Contract × Tenant (مستأجر جوان)
**Persona definition:** Mr. Karimi, 29, newly married, rents for the first time; budget-conscious; nervous about signing something he doesn't understand.
**Motivation:** Lock a fair rental without being overcharged; wants everything in writing; keeps cash liquid (low rahn).
**Circumstances:** Landlord is a stranger found via Mahalino listings; move-in in 2 weeks; no prior contract experience.
**Priorities:** (1) low upfront cash (rahn as low as possible), (2) understandable clauses, (3) documented delivery condition of the property.
**Initial approach:** «باید قرارداد اجاره امضا کنم، از دست مالک هم می‌ترسم.»
**Questions to ask (5–8 adaptive):**
1. نقش شما مستأجره درسته؟ → `party_role=tenant`
2. رهن و اجاره‌ای که با مالک توافق کردید چقدره؟ → `rahn_amount`, `rent_amount`
3. مدت قرارداد رو مالک چه پیشنهادی داده؟ → `term_months`
4. تحویل چه تاریخی؟ → `move_date`, `delivery_type`
5. مالک شواهدی از وضعیت خونه می‌خواد ثبت بشه؟ → `delivery_condition_note` (e.g., appliance inventory)
6. رهن می‌خواید کمتر بشه و اجاره بیشتر، یا برعکس؟ (after ratio check)
7. کد ملی و مشخصات طرفین رو الان دارید؟
**Questions to avoid:**
- «چقدر پول نقد داری؟» — sensitive; only via rahn/rent slider framing.
- «مالک رو می‌شناسی؟ می‌شه اعتماد کرد؟» — out of scope (not verifiable); instead offer documented-contract safety.
- «بند فسخ رو حذف کنیم که رفاهیت داشته باشی؟» — legal-advice territory.
**Required info:** `contract_type=rental_residential`, `party_role=tenant`, `rahn_amount`, `rent_amount`, `term_months`, `move_date`, `tenant_name`, `tenant_national_id`, `landlord_name`, `landlord_national_id`, `property_address`
**Optional info:** `delivery_condition_note`, `utility_debt_note`, `renewal_preference`, `witness_info`
**Conditional questions:** If rahn/rent ratio deviates >25% → show validator card + confirm override. If term_months < 12 → warn short-term contracts often carry higher rent (informational).
**Alternative paths:** (a) Share draft link to landlord for counter-sign; (b) request escrow-style rahn transfer note later in WF-P; (c) save as draft and return.
**Completion criteria:** Required fields complete; deterministic checks pass; user reads clause summary card; 40-token confirmation; draft generated; sensitive-info warning on share.

### Transcript 1 — normal success
**کاربر:** سلام. مالک یه خونه گفت قرارداد رو تو همین محلینو ببندیم. من اولین باره چیزی امضا می‌کنم، کمکم می‌کنید؟
**دستیار:** حتماً. قدم‌به‌قدم باهم میریم و هر بند رو به زبان ساده توضیح میدم. شما مستأجرید دیگه؟
→ field: party_role=tenant
**کاربر:** آره. رهن ۱۵۰ میلیون و اجاره ماهی ۲۵ میلیون توافق کردیم، خونه تو عباس‌آباده، ۶۵ متر.
[decision point: rahn/rent check — 150M ≈ 9.9M reduction; if no-rahn baseline ~33M, rent 25M is plausible → validator passes]
**دستیار:** ثبت کردم؛ نسبت رهن به اجاره با محاسبه‌ی استاندارد ما (هر یک میلیون رهن ≈ ۶۶ هزار تومن تخفیف اجاره) هماهنگه. مدت قرارداد چقدره؟
**کاربر:** مالک گفت یک سال.
**دستیار:** باشه. تحویل کیه؟
**کاربر:** از دو هفته دیگه، اول ماه.
→ field: term_months=12, move_date=1405/01/01
**دستیار:** یه پیشنهاد امنیتی برای شما: بند «شرح وضعیت تحویل» اضافه کنیم؟ لیست وسایل و وضعیت خونه موقع تحویل مستند میشه که موقع تخلیه بحث سر خسارت پیش نیاد.
**کاربر:** آره لطفاً، پارکینگ و آسانسور هم توش باشه.
→ field: delivery_condition_note=پارکینگ، آسانسور، پکیج، سه پکیج کابینت
**دستیار:** مشخصات مالک رو هم دارید؟
**کاربر:** آقای توکلی، کد ملیش رو ازش می‌گیرم، الان ندارم.
**دستیار:** پس این فیلد رو «در انتظار» می‌ذارم. بدون کد ملی طرفین نمی‌تونیم نسخه نهایی صادر کنیم. بقیه فیلدها مال شما کامل شده. می‌خواید الان پیش‌نویس ساخته بشه؟ ۴۰ توکن هزینهشه، موجودیتون ۶۰ توکنه.
[decision point: TOKEN-COST CONFIRMATION with missing-field disclosure]
**کاربر:** بسازم، ولی تا مالک کدش رو نده نهایی نمیشه دیگه؟
**دستیار:** دقیقاً؛ پیش‌نویس با وضعیت «پیش‌نویس» می‌مونه و بعد از تکمیل به «تأییدشده» میره. الان می‌سازم؟
**کاربر:** بله.
**دستیار:** ساخته شد. یادآوری امنیتی: لینک قرارداد فقط برای مالک، نه گروه‌ها و کانال‌های عمومی — اطلاعات حساس داخلشه.

### Transcript 2 — incomplete/ambiguous
**کاربر:** قرارداد اجاره می‌خوام، خونه‌ی فامیلمونه.
**دستیار:** خوش اومدید! رهن و اجاره‌ش چی شده بینتون؟
**کاربر:** چیز مشخصی نشده، بهش می‌گم هرچی شما بگید.
[decision point: user delegates financial terms — agent must not invent binding numbers]
**دستیار:** من عدد مالی رو تعیین نمی‌کنم؛ فقط محاسبه‌گر دارم: مثلاً اگه رهن ۱۰۰ میلیون بذارید، اجاره‌ی هم‌نسبت حدود ۲۰ میلیون میشه. با فامیلتون جمع بزنید و عدد بدید.
**کاربر:** خب بذار ۱۰۰ و ۲۰.
**دستیار:** ثبت شد. نشانی ملک؟
**کاربر:** همون که همیشه می‌ریم، خونه‌ی مامان‌بزرگ.
[decision point: no disambiguation possible from context — ask open question]
**دستیار:** برای قرارداد باید نشانی قانونی باشه. یه پلاک و خیابان می‌فرستید؟
**کاربر:** اسکرین‌شات پیج دیوارش رو بفرستم کافیه؟
**دستیار:** اگه توش نشانی کامل باشه بله، می‌تونم ازش استخراج کنم. بفرستید.
[decision point: alternative path — accept semi-structured input, extract fields deterministically, confirm with user]
**کاربر:** (عکس فرستاده شد)
**دستیار:** استخراج کردم: «تهران، عباس‌آباد، خیابان شهید رحیمی، پلاک ۴۵، واحد ۲». درسته؟
**کاربر:** آره.
**دستیار:** مشخصات طرفین هم لازمه. اسم کامل و کد ملی شما و صاحب خونه رو دارید؟
**کاربر:** خودم رو دارم، مامان‌بزرگم رو نمی‌دونم.
**دستیار:** اوکی، برای بعد می‌ذارمش. تا اون موقع پیش‌نویس رو «ناقص» نگه می‌داریم؛ وقت شد ادامه بدید از همین چت.
[decision point: state saved with checklist of 3 missing fields]

### Transcript 3 — preference change/correction
**کاربر:** نظر عوض شد، مالک گفت اگه رهن رو ۳۰۰ کنی اجاره میشه ۱۲.
**دستیار:** بذار چک کنم: با رهن ۳۰۰ میلیون، اجاره‌ی هم‌نسبت حدود ۱۴ تا ۱۶ میشه. پیشنهادش (۱۲) یه کم پایین‌تر از منحنیه — یعنی به نفع شماست. تأیید می‌کنید ثبت بشه؟
**کاربر:** آره حتماً.
**دستیار:** آپدیت شد: رهن ۳۰۰، اجاره ۱۲. چیز دیگه‌ای؟
**کاربر:** بند تحویل رو اضافه کن یادم رفت، وسایل مالک رو هم لیست کنه.
**دستیار:** اضافه شد. برای تولید پیش‌نویس ۴۰ توکن هزینه داره؛ تأیید؟
**کاربر:** تأیید.
[decision point: re-confirmation of token cost required because parameters changed after a prior draft? — rule: re-generation after finalized fields costs again unless in `draft` state; here still `draft`, so one charge]
**دستیار:** پیش‌نویس جدید با وضعیت «پیش‌نویس» ساخته شد. لینک رو فقط برای مالک بفرستید.

## C-BY — Contract × Buyer (خریدار ملک)
**Persona definition:** Mr. Nazari, 41, IT manager, buying his first apartment (620M toman) in Shahrak-e Gharb; used to digital services, expects everything app-based.
**Motivation:** A clean, documented خرید/قولنامه contract; wary of informal قولنامه risks; wants payment terms recorded precisely.
**Circumstances:** Seller has a tenant in the unit (vacate in 60 days); buyer paying 40% down, remainder at delivery.
**Priorities:** (1) payment schedule clarity, (2) delivery/vacate date enforceable in writing, (3) no hidden debts on property (شِِرایط، بدهی ساختمان).
**Initial approach:** «برای خرید آپارتمان قرارداد می‌خوام که رسمی و قابل استناد باشه.»
**Questions to ask (5–8 adaptive):**
1. نوع قرارداد خرید و فروش کامله؟ → `contract_type=sale`
2. قیمت نهایی توافق‌شده؟ → `sale_price`
3. پیش‌پرداخت چقدر و باقی چطور پرداخت میشه؟ → `down_payment`, `remaining_payment_method` (يا ارجاع به WF-P)
4. تحویل چه زمانی؟ مستأجر کی تخلیه می‌کنه؟ → `move_date`, `delivery_condition`
5. سند تکبرگه یا مشاع؟ → `deed_type`
6. بدهی ساختمان/شِرایط چطور تسویه میشه؟ → `building_debt_note`
7. مشخصات فروشنده و خریدار؟ → both party fields
8. غرامت تأخیر تحویل می‌خواید درج بشه؟ → `penalty_amount`
**Questions to avoid:**
- «سند رو دست کیه؟ سالمه؟» — verification out of scope; direct to official checks.
- Advice on whether price is fair (legal/financial advice).
- Asking for full bank statement as proof of funds.
**Required info:** `contract_type=sale`, `party_role=buyer`, `property_address`, `area_sqm`, `sale_price`, `down_payment`, `move_date`, `buyer_name`, `buyer_national_id`, `seller_name`, `seller_national_id`
**Optional info:** `deed_type`, `building_debt_note`, `penalty_amount`, `agent_referral`, `notary_flag`
**Conditional questions:** If delivery > 30 days away → suggest installment clause or hand off to WF-P for schedule. If `deed_type=مشاع` → deterministic warning card: «سند مشاع نیاز به رضایت همه مالکین داره» (informational, not advice).
**Alternative paths:** (a) Schedule remaining payments via WF-P; (b) escrow for down payment; (c) two-stage contract (قولنامه + سند رسمی reference).
**Completion criteria:** Payment math sums exactly (validator), delivery date ≥ today, token confirmation, draft generated, sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** سلام، آپارتمانی خریدم، ۶۲۰ میلیون. قراردادش رو تو محلینو می‌خوام ببندم.
**دستیار:** خوش اومدید! قرارداد خرید و فروش می‌سازیم. خریدار هستید؟
→ field: party_role=buyer
**کاربر:** آره. قیمت نهایی ۶۲۰، الان ۲۵۰ میدم، بقیه موقع تحویل.
**دستیار:** ثبت شد. تحویل کی؟
**کاربر:** مالک گفت مستأجرش تا ۶۰ روز دیگه تخلیه می‌کنه، بعد فوری تحویل.
[decision point: long delivery window → conditional branch offers delivery penalty clause]
**دستیار:** چون تحویل دیرتره، بند «غرامت تأخیر تحویل» رو پیشنهاد می‌کنم؛ مثلاً مبلغ مشخصی در ازای هر هفته تأخیر. اضافه کنیم؟
**کاربر:** آره، هفته‌ای ۲ میلیون.
→ field: move_date=1405/03/01, penalty_amount=2,000,000/week
**دستیار:** سند تک‌برگه؟ و بدهی شِرایط و ساختمون با کیه؟
**کاربر:** تک‌برگه. شِرایط رو مالک تا روز تحویل تسویه می‌کنه، تو قرارداد باشه.
→ field: deed_type=تک‌برگ, building_debt_note=تسویه توسط فروشنده تا تحویل
**دستیار:** مشخصات فروشنده و خودتون؟
**کاربر:** فروشنده: آقای شریفی، کد ملی ۰۰۹۸۷۶۵۴۳۲. منم محمدرضا نظری، ۰۰۷۶۵۴۳۲۱۰۹.
[decision point: both national_id checksums pass]
**دستیار:** خلاصه‌ی محاسباتی: ۲۵۰ میلیون پیش‌پرداخت + ۳۷۰ میلیون هنگام تحویل = ۶۲۰ میلیون. جمع دقیق درسته. برای تولید پیش‌نویس قرارداد خریدوفروش: **۴۰ توکن**، موجودی ۸۰ توکن. تأیید؟
[decision point: TOKEN-COST CONFIRMATION]
**کاربر:** تأیید.
**دستیار:** پیش‌نویس آماده‌ست (وضعیت: پیش‌نویس). وقتی پیش‌پرداخت رو دادید بگید تا ثبتش کنیم؛ و یادآوری: لینک قرارداد فقط برای فروشنده — اطلاعات حساس مالی داخلشه.

### Transcript 2 — incomplete/ambiguous
**کاربر:** قولنامه‌ای خریدم یه آپارتمان، حالا قرارداد درست‌وحسابی می‌خوام.
**دستیار:** عالیه. قیمت کل چقدر شد؟
**کاربر:** خوب شد، مالک خودش می‌دونه.
**دستیار:** برای قرارداد، قیمت باید عدد دقیق تو متن باشه. مبلغ نهایی رو از مالک بگیرید می‌فرستید؟
**کاربر:** فکر کنم ۵۵۰ بود، یا ۵۷۰. چیزی ننویس، بعد مشخص میشه.
[decision point: financial field unknown — deterministic validation blocks draft with placeholder amounts]
**دستیار:** بدون عدد دقیق، سیستم اجازه نمیده پیش‌نویس مالی تولید بشه — این بخش به‌صورت قطعی اعتبارسنجی میشه و جای خالی قبول نمی‌کنه. تا عدد قطعی‌شده منتظر می‌مونم؛ فعلاً می‌تونیم فیلدهای غیرمالی رو ببندیم: نشانی ملک و تحویل کیه؟
**کاربر:** ونک، ۸۵ متر، تا عید تحویل.
**دستیار:** ثبت شد. اسامی طرفین رو هم دارید؟
**کاربر:** اون بعداً.
**دستیار:** اوکی؛ چک‌لیست مانده: sale_price، مشخصات خریدار و فروشنده. هر کدوم رو که گرفتید همینجا بفرستید.
[decision point: partial save, no token charged, missing_fields persisted]

### Transcript 3 — preference change/correction
**کاربر:** پیش‌پرداخت رو مالک گفت بذار ۳۰۰ کنی، بقیه‌ش رو هم قسطی بدم.
**دستیار:** اوکی: ۳۰۰ پیش‌پرداخت + ۳۲۰ باقی‌مانده. دو تا مسیر داریم: یا «پرداخت هنگام تحویل یک‌جا» رو نگه داریم، یا بخش پرداخت‌ها رو با سرویس «توافق پرداخت اقساطی» ما ببندیم که برنامه‌ی قسط دقیق داره. کدوم؟
**کاربر:** قسطی بهتره، ۶ قسط.
**دستیار:** پس قرارداد خریدوفروش با پیش‌پرداخت ۳۰۰ ثبت میشه و برای ۳۲۰ باقی‌مانده میریم تو بخش توافق پرداخت. اونجا installment_count و مبلغ هر قسط رو حساب می‌کنیم. ادامه بدم؟
**کاربر:** برو.
[decision point: cross-workflow handoff C→P; sale contract draft parked]

---

## C-SL — Contract × Seller (فروشنده)
**Persona definition:** Ms. Mohammadi, 47, selling an inherited 110m² flat in Narmak; has a tenant inside until end of season; distrusts paperwork, prefers talking.
**Motivation:** Sell fast, get paid safely, avoid disputes with the buyer about تسویه شرایط and delivery.
**Circumstances:** Two interested buyers; one via Mahalino chat; wants contract today.
**Priorities:** (1) guaranteed down payment before vacating tenant, (2) clear mutual obligations, (3) minimal bureaucracy.
**Initial approach:** «آپارتمانمو فروختم به یه آقا، فقط قراردادش رو درست کن.»
**Questions to ask (5–8 adaptive):**
1. قرارداد خریدوفروش کامله درسته؟ → `contract_type=sale`, `party_role=seller`
2. قیمت و پیش‌پرداخت؟ → `sale_price`, `down_payment`
3. مستأجر دارید داخل خونه؟ کی تخلیه میشه؟ → `delivery_condition`, `move_date`
4. تسویه شرایط/بدهی‌ها با کیه؟ → `building_debt_note`
5. سند تک‌برگه؟ → `deed_type`
6. مشخصات خریدار؟ → buyer fields
7. چک/اقساطی چیزی در کاره؟ → redirect to WF-P if yes
**Questions to avoid:**
- «چرا این‌قدر عجله دارید؟» — pressure framing.
- Any opinion on buyer's trustworthiness.
- Collecting the buyer's bank details inside chat.
**Required info:** `contract_type=sale`, `party_role=seller`, `property_address`, `area_sqm`, `sale_price`, `down_payment`, `move_date`, `seller_name`, `seller_national_id`, `buyer_name`, `buyer_national_id`
**Optional info:** `deed_type`, `building_debt_note`, `delivery_condition=با مستأجر`, `penalty_amount`, `escrow_preferred`
**Conditional questions:** If tenant inside → mandatory `delivery_condition` clarification + suggestion to reference tenant's existing contract. If down payment > 200M → suggest escrow (paid, 25 tokens) as optional service.
**Alternative paths:** (a) Buyer fills their side via shared link; (b) escrow for down payment; (c) installment plan handoff to WF-P.
**Completion criteria:** Full field set, deterministic sums, token confirmation, draft, sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** سلام. خونه‌م رو فروختم، باید قراردادش رو ببندیم.
**دستیار:** سلام! خوش اومدید. خرید و فروش کامله؟
**کاربر:** آره، ۹۸۰ میلیون. ۲۰۰ پیش‌پرداخت گرفتم، بقیه موقع سند و تحویل.
**دستیار:** مستأجر یا وسایل خاصی داخل خونه هست؟
**کاربر:** یه مستأجره، تا آخر فصل می‌مونه. خریدار می‌دونه.
[decision point: delivery_condition = with tenant → mandatory explicit field]
**دستیار:** پس بند «تحویل با مستأجر تا تاریخ ۱۴۰۵/۰۴/۳۱» رو دقیق می‌نویسیم و قرارداد اجاره‌ی فعلی‌شون ضمیمه میشه. اوکیه؟
**کاربر:** باشه.
**دستیار:** تسویه بدهی شِرایط و آب‌برق با کیه؟
**کاربر:** با من، خودم می‌کنم تا اون تاریخ.
→ field: building_debt_note=تسویه توسط فروشنده تا 1405/04/31
**دستیار:** مشخصات خریدار؟
**کاربر:** آقای قاسمی، کد ملیش ۰۰۵۵۴۴۳۳۲۲.
[decision point: checksum passes]
**دستیار:** یه پیشنهاد: پیش‌پرداخت ۲۰۰ میلیونی رو می‌خواید از طریق سرویس امانت‌گذاری (اسکرو) ما بگیرید؟ هزینه‌ش ۲۵ توکنه و تا تحویل، پول پیشِ طرفین می‌مونه. یا ترجیح میدید خودتون مستقیم؟
[decision point: optional escrow upsell — must not be pushed; user choice]
**کاربر:** نه، مستقیم دادم، چکش هم گرفتم.
**دستیار:** ثبت شد، بدون اسکرو. تولید پیش‌نویس: **۴۰ توکن**، موجودی ۵۵ توکن. می‌سازم؟
[decision point: TOKEN-COST CONFIRMATION]
**کاربر:** بله بساز.
**دستیار:** ساخته شد. پیش‌نویس رو برای آقای قاسمی بفرستید — ولی یادتون باشه فقط برای خودش؛ اطلاعات حساس مالی و هویتی داخلشه.

### Transcript 2 — incomplete/ambiguous
**کاربر:** قرارداد فروش می‌خوام برای خونه‌ی پدربزرگ.
**دستیار:** سلام! نقش شما فروشنده‌ست؟ و ثبتی: اسم کامل خودتون و خریدار رو می‌فرستید؟
**کاربر:** خونه مال پدربزرگه ولی من دارم می‌فروشمش.
[decision point: ownership mismatch risk — informational warning, deterministic flag]
**دستیار:** یه نکته‌ی ثبت اطلاعات: اگر مالک سند شخص دیگه‌ایه، در فیلد «مالک قانونی» همون اسم درج میشه و شما به‌عنوان «فروشنده/وکیل فروش» ثبت میشید. مالک قانونی کیه؟
**کاربر:** خود پدربزرگم، زنده‌ست ولی پاش شکسته نمی‌تونه بیاد.
**دستیار:** اوکی، فیلدها رو همین‌طور پر می‌کنم. توجه: من درباره‌ی پیچیدگی‌های حقوقی این وضعیت نظر نمی‌دم؛ اگه لازم شد با وکیل مشورت کنید. قیمت فروش چقدره؟
**کاربر:** هنوز قطعی نشده، داریم چونه می‌زنیم.
**دستیار:** پس فیلد قیمت رو «در انتظار توافق» می‌ذارم؛ سیستم تا عدد قطعی نشه پیش‌نویس تولید نمی‌کنه — اعتبارسنجی مالی قطعیه. بقیه‌ی اطلاعات رو می‌تونیم از الان جمع کنیم: نشانی ملک؟
**کاربر:** نارمک، میدون هلال‌احمر، ۱۱۰ متر.
**دستیار:** ثبت شد. مانده: sale_price و مشخصات خریدار. وقت شد ادامه بدید.
[decision point: draft parked, zero tokens spent]

### Transcript 3 — preference change/correction
**کاربر:** خریدار عوض شد! اون آقا انصراف داد، یه خانمی خرید. همه‌ی مشخصاتش رو عوض کن.
**دستیار:** اسم و کد ملی خریدار جدید؟
**کاربر:** خانم احمدی، ۰۰۳۳۴۴۵۵۶۶.
[decision point: replace buyer fields; other fields preserved — progressive profiling benefit]
**دستیار:** آپدیت شد؛ بقیه‌ی قرارداد دست‌نخورده موند. قیمت همون ۹۸۰ و پیش‌پرداخت ۲۰۰ بمونه؟
**کاربر:** آره فقط پیش‌پرداخت شد ۲۵۰، بقیه‌ش ۷۳۰.
**دستیار:** چک ریاضی: ۲۵۰ + ۷۳۰ = ۹۸۰ ✓. برای تولید پیش‌نویس نهایی **۴۰ توکن** هزینه داره. تأیید؟
**کاربر:** تأیید.

---

## C-AG — Contract × Real Estate Agent (مشاور املاک)
**Persona definition:** Mr. Saeedi, 35, agent at a small boutique agency in Punak; handles 4–6 rental deals/month; power user, wants speed and reusability.
**Motivation:** Replace paper اجاره‌نامه workflows; represent both sides legally-cleanly; track contract statuses per deal.
**Circumstances:** Booking two deals today; client parties chat directly with Mahalino; agent needs consolidated view.
**Priorities:** (1) template reuse, (2) both-party signing inside platform, (3) status tracking (draft→approved→finalized→terminated).
**Initial approach:** «من مشاولا، چندتا قرارداد این هفته باید ببندم. قالب قبلی رو می‌شه استفاده کرد؟»
**Questions to ask (5–8 adaptive):**
1. این قرارداد برای کدوم معامله‌ست؟ چند معامله باز دارید؟ → `deal_ref`
2. نقش شما در قرارداد؟ واسطه/آژانس → `party_role=agent`, `agency_fee_note`
3. از قالب معامله‌ی قبلی کپی کنم؟ → template reuse path
4. کدوم فیلدها از معامله‌ی قبلی فرق می‌کنه؟ (only diff fields asked)
5. طرفین خودشون تو چت هستن یا شما مشخصاتشون رو می‌فرستید؟
6. کارمزد آژانس چقدر و با کیه؟ → `agency_fee_note`
7. نیاز به نسخه‌ی پیش‌نمایش برای هر دو طرف قبل از نهایی؟
**Questions to avoid:**
- Explaining how to structure clauses to dodge regulations — legal gray area.
- Asking for clients' credentials/passwords.
- Pushing escrow on every deal (anti-pattern: trust erosion).
**Required info:** `contract_type`, `party_role=agent`, both party field sets, financial fields (per deal), `agency_fee_note`
**Optional info:** `deal_ref`, `template_id`, `multi_deal_batch`, `witness_info`
**Conditional questions:** If agent represents both sides → deterministic conflict note: «قرارداد با نقش واسطه ثبت میشه؛ نقش موجر/مستأجر برای طرفین جدا درج میشه». If batch > 1 → offer sequential flow with per-deal token confirmation.
**Alternative paths:** (a) Template clone; (b) invite both parties into chat; (c) API/bulk for high-volume agents (future).
**Completion criteria:** Deal-scoped drafts generated (each with own token confirmation), statuses visible to agent, sensitive-info warnings per share link.

### Transcript 1 — normal success
**کاربر:** سلام، من مشاور املاکم. دو تا اجاره این هفته باید ثبت کنم.
**دستیار:** سلام آقای مهندس! عالیه که محلینو رو برای ثبت انتخاب کردید. بریم سراغ معامله‌ی اول: از یه معامله‌ی قبلی‌تون قالب بگیرم یا از صفر؟
[decision point: template reuse path]
**کاربر:** قالبِ قرارداد ۲۴مهدی‌شهر رو کپی کن، فقط اعداد و اسم‌ها عوض میشه.
**دستیار:** کپی کردم. تفاوت‌ها با معامله‌ی قبلی چیه؟
**کاربر:** خونه‌ی جدید: پونک، ۹۰ متر. رهن ۴۰۰، اجاره ماهی ۱۵. موجر خانم رستمی، مستأجر آقای عباسی.
[decision point: rahn/rent check — 400M ≈ 26.4M reduction; rent 15M vs implied baseline ~41M → deviation warning]
**دستیار:** یه هشدار محاسباتی: با رهن ۴۰۰ میلیون، اجاره‌ی هم‌نسبت حدود ۱۵ تا ۱۸ میشه — عددتون داخل محدوده‌ی هشدارِ مرزیه. تأیید می‌کنید؟
**کاربر:** آره، خودم توافقش رو چیدم.
**دستیار:** تأیید ثبت شد. کارمزد آژانس چقدر و پرداختش با کیه؟
**کاربر:** نصف رهن، از مستأجر.
→ field: agency_fee_note=معادل نصف رهن، پرداخت توسط مستأجر
**دستیار:** مشخصات کامل طرفین رو دارید؟
**کاربر:** (ارسال دو مجموعه مشخصات)
[decision point: both checksums pass; agent role conflict note shown]
**دستیار:** دو تا نکته: قرارداد شما با نقش «واسطه» ثبت میشه و موجر/مستأجر جدا درج میشن. برای معامله‌ی اول تولید پیش‌نویس **۴۰ توکن**، برای دوم هم جدا **۴۰ توکن** — هر کدوم تأیید خودش رو می‌خواد. اولی رو بسازم؟
[decision point: TOKEN-COST CONFIRMATION per deal, not batched silently]
**کاربر:** اولی بساز، دومی بعداً.
**دستیار:** ساخته شد. لینک‌های طرفین رو جدا بفرستید — هر لینک اطلاعات حساس داره و فقط برای همون طرف.

### Transcript 2 — incomplete/ambiguous
**کاربر:** معامله‌ی دوم رو هم ببند.
**دستیار:** فقط «معامله‌ی دوم» رو توی چت ندارم — رهن و اجاره و ملکش رو نگفتید. از صفر بگید یا از یه قالب دیگه بگیرید؟
**کاربر:** همون قالب، همه‌چیز مثل قبل.
[decision point: agent must not silently clone financial numbers into a different deal — deterministic guard]
**دستیار:** کپی قالب اوکیه، ولی اعداد مالی رو نمی‌تونم بدون تأیید شما از معامله‌ی اول کپی کنم — رهن و اجاره‌ی معامله‌ی دوم چیه؟
**کاربر:** خب چرا، بذار فکر کنم... ۲۵۰ رهن.
**دستیار:** ۲۵۰ رهن ثبت شد. اجاره؟
**کاربر:** ۲۸.
**دستیار:** نسبت با بازار هماهنگه ✓. ملک و طرفین معامله‌ی دوم؟
**کاربر:** بعداً می‌فرستم، الان دم دستم نیست.
**دستیار:** باشه؛ پیش‌نویس معامله‌ی دوم تا اطلاعات کامل نشه قفل می‌مونه و هزینه‌ای هم نمی‌بره.
[decision point: per-deal completeness gate; no token charge until complete]

### Transcript 3 — preference change/correction
**کاربر:** موجر معامله‌ی اول گفت رهن رو بیار ۴۵۰ کن، اجاره هم بذار ۱۲.
**دستیار:** چک محاسباتی: رهن ۴۵۰ ≈ کاهش ۲۹.۷ میلیون از اجاره‌ی مبنا؛ اجاره ۱۲ با این رهن پایین‌تر از منحنی مرزیه — یعنی انحراف معنادار. تأیید نهایی می‌خوام: «بذار با انحراف ثبت بشه»؟
**کاربر:** آره بذار، توافقشون اینه.
**دستیار:** تأیید ثبت شد، هشدار در قرارداد هم قید میشه. چون هنوز تو وضعیت پیش‌نویسیم، بازتولید هزینه‌ی اضافه نداره — پیش‌نویس آپدیت شد. وضعیتش رو خودتون به «تأییدشده» می‌برید یا طرفین خودشون تأیید کنن؟
**کاربر:** طرفین خودشون، لینک‌ها رو می‌فرستم.
**دستیار:** بره. یادآوری: هر لینک حساسه، فقط برای همون طرف.

---

## C-NX — Contract × User without contract experience (کاربر بدون تجربه قراردادی)
**Persona definition:** Ms. Yousefi, 24, first job, renting a room/sublet in Vanak from a friend-of-friend; has never read a contract in her life; anxious, asks many "obvious" questions.
**Motivation:** Not get cheated; understand what she's signing; do everything from her phone.
**Circumstances:** Informal sublet; no written agreement exists; landlord (primary tenant) suggested Mahalino.
**Priorities:** (1) plain-language explanations, (2) reassurance and validation of what's normal, (3) not paying before understanding.
**Initial approach:** «راستش من هیچی از قرارداد بلد نیستم، از صفر بگو چی کار کنم.»
**Questions to ask (5–8 adaptive, extra-patient sequencing):**
1. فعلاً فقط توضیح می‌دم: قراره چه نوع قراردادی ببندید؟ اجاره، زیراجاره؟ → `contract_type`
2. شما کدوم طرفید؟ → `party_role`
3. چقدر مبلغ رهن/ودیعه حرف زدید؟ → `rahn_amount`
4. ماهی چند اجاره؟ → `rent_amount`
5. چند ماه قراره بمونید؟ → `term_months`
6. کی می‌تونید وایسید تو خونه؟ → `move_date`
7. اسم و کد ملیتون رو راحت می‌فرستید؟ (reassurance before identity fields)
**Questions to avoid:**
- Jargon-heavy: «عقد لازم و جائز», «خیار فسخ» without plain-language gloss — causes shutdown.
- «چرا کد ملیت رو نمی‌فرستی؟» — no pressure on identity data.
- Legal opinions about sublet legality.
**Required info:** `contract_type=sublet|rental_residential`, `party_role=tenant`, `rahn_amount`, `rent_amount`, `term_months`, `move_date`, tenant identity fields, primary-tenant identity fields
**Optional info:** `delivery_condition_note`, `room_inventory_note`
**Conditional questions:** If sublet → informational note that the primary tenant's own contract should allow it (informational, with وکیل disclaimer). If user hesitates on token cost → full explanation + option to wait.
**Alternative paths:** (a) Guided preview mode (explain every field before capture); (b) save-and-return; (c) involve primary tenant via chat invite.
**Completion criteria:** All required fields captured with explicit user confirmation of each; token confirmation with plain-language cost explanation; draft generated; sensitive-info warning explained in simple terms.

### Transcript 1 — normal success
**کاربر:** سلام. خیلی ممنون که هستید :) من هیچ تجربه‌ای از قرارداد ندارم. خونه‌ی یه آشنام، فقط یه اتاقش رو به من اجازه میده.
**دستیار:** سلام و خوش اومدید! اصلاً نگران نباشید، من همه‌چیز رو ساده توضیح میدم و هیچی رو بدون تأیید شما ثبت نمی‌کنم. بریم؟
**کاربر:** بریم.
**دستیار:** تو این وضعیت معمولاً یه «قرارداد زیراجاره» می‌بندن — یعنی کسی که خودش مستأجره، بخشی از خونه رو به شما واگذار می‌کنه. با این توافق؟
[decision point: contract_type=sublet — plain-language explanation before capture]
**کاربر:** آره همینه.
**دستیار:** رهن یا ودیعه‌ای که حرف زدید چقدره؟
**کاربر:** گفت ۸۰ میلیون ودیعه بدم و ماهی هم ۸.
**دستیار:** ثبت کردم. برای اطمینان خاطرتون: نسبت معمول بازار اینه که هر یک میلیون رهن، حدود ۶۶ هزار تومن از اجاره کم می‌کنه — اعداد شما داخل محدوده‌ی منطقیه ✓. چند ماه می‌مونید؟
**کاربر:** حداقل یه سال.
**دستیار:** تحویل کی؟
**کاربر:** هفته‌ی دیگه.
→ field: term_months=12, move_date=1405/01/15
**دستیار:** حالا مشخصات: اسم کامل و کد ملی شما و اون آشنا. اینا فقط برای درج تو قرارداده و پیش هیچ‌کس فاش نمیشه.
**کاربر:** مریم یوسفی، ۰۰۶۵۴۳۲۱۰۹. اون آقا بهنام فرهادی، ۰۰۱۱۲۲۳۳۴۴.
[decision point: checksums pass]
**دستیار:** همه فیلدها کامل شد. خلاصه: زیراجاره اتاق، رهن ۸۰ میلیون، اجاره ۸ میلیون، یک ساله، تحویل هفته‌ی دیگه. برای ساختن پیش‌نویس از یه سرویس پرداختی استفاده میشه: **۴۰ توکن** — یعنی از اعتبار داخل برنامه‌تون کم میشه، پول جداگانه ازتون نمی‌گیرم الان. تأیید می‌کنید؟
[decision point: TOKEN-COST CONFIRMATION with plain-language explanation]
**کاربر:** باشه، تأیید.
**دستیار:** پیش‌نویس آماده‌ست! یه نکته‌ی مهم به زبان ساده: لینک این قرارداد اطلاعات حساس داره (کد ملی و مبلغ‌ها) — فقط برای بهنام بفرستیدش، نه تو گروه‌ها. و اگه براتون سؤال حقوقی پیش اومد که از حد توضیحات من بیرونه، با یه وکیل مشورت کنید.

### Transcript 2 — incomplete/ambiguous
**کاربر:** من اصلاً نمی‌دونم این قراردادا چین. یه چیزی بهم بدید که امن باشه.
**دستیار:** حتماً. اول بگید دقیقاً چه معامله‌ای بین شما و طرف‌مقابل ردوبدل شده؟ خونه، اتاق، مغازه؟
**کاربر:** یه اتاق. یا راستش شاید کل یه واحد بعداً. هنوز معلوم نیست.
[decision point: contract scope undefined — agent picks a path: start with what's certain]
**دستیار:** مشکلی نیست؛ قرارداد فقط برای چیزی که قطعیه بسته میشه. پس فعلاً «اتاق» رو مبنا می‌گیریم و بعداً اگه واحد کامل شد، قرارداد جدید می‌بندیم. موافقید؟
**کاربر:** آره.
**دستیار:** مبلغ ودیعه و اجاره حرف زدید؟
**کاربر:** گفت «همون‌که تو بازار میشه»، دقیق نگفته.
**دستیار:** بدون عدد قطعی، سیستم اجازه نمیده قرارداد مالی بسازیم — اعتبارسنجی مبلغ‌ها قطعیه و جای خالی قبول نمی‌کنه. ازش بپرسید «دقیقاً چقدر رهن و چقدر اجاره؟» و عدد رو بفرستید.
**کاربر:** باشه، می‌پرسم.
**دستیار:** تا اون موقع می‌تونیم اسم و تاریخ‌ها رو بگیریم، یا صبر کنید همه‌چیز یک‌جا بشه. هرجور راحت‌ترید.
[decision point: user controls pacing; zero tokens spent; checklist saved]

### Transcript 3 — preference change/correction
**کاربر:** شنیدم رهن زیاد عالیه برای من چون پولمو پس میدن. می‌شه ۱۲۰ ودیعه و اجاره صفر بذاریم؟
**دستیار:** محاسبه‌گر ما میگه رهن ۱۲۰ میلیون معادل حذفِ حدود ۸ میلیون اجاره‌ست؛ با اجاره‌ی مبنای شما (۸ میلیون)، عملاً میشه اجاره صفر ✓ — این ترکیب «رهن کامل» نام داره و خیلی رایجه. تأیید می‌کنید؟
**کاربر:** آره آره همینو بذار.
**دستیار:** ثبت شد: رهن ۱۲۰، اجاره ۰. فقط یادتون باشه موقع تخلیه باید کل ۱۲۰ برگرسه — تو قرارداد بند بازگشت ودیعه دقیق نوشته میشه. نسخه‌ی جدید پیش‌نویس رو می‌سازم، هنوز تو حالت پیش‌نویسیم پس هزینه‌ی دوباره نداره.
**کاربر:** مرسی. پس الان چیکار کنم؟
**دستیار:** پیش‌نویس آماده‌ست؛ لینکش رو فقط برای صاحب اتاق بفرستید و بعد از تأییدش وضعیت میره رو «تأییدشده». هر وقت منصفانه به نظر نرسید، همینجا بهم بگید.

# SECTION B — WORKFLOW T: CONTRACT TERMINATION

## T-TN — Termination × Tenant (مستأجر در حال خروج)
**Persona definition:** Mr. Hosseini, 33, 8 months into a 12-month contract in Tehranpars; got a job offer in Isfahan; needs to leave in 3 weeks.
**Motivation:** Terminate cleanly, recover as much of the 400M rahn as possible, minimize penalty.
**Circumstances:** Landlord is reasonable but wants the unit re-rented fast; 1 month rent currently unpaid.
**Priorities:** (1) deposit back in full minus dues, (2) documented termination so nothing can be disputed later, (3) speed.
**Initial approach:** «قراردادم رو باید فسخ کنم، زودتر از موعد.»
**Questions to ask (5–8 adaptive):**
1. کدوم قرارداد؟ (از لیست قراردادهای finalized شما) → `contract_ref`
2. دلیل فسخ چیه؟ (انتقال شغل، نارضایتی، توافق طرفین...) → `termination_reason`
3. تاریخ تخلیه دقیقاً کی؟ → `surrender_date`
4. اجاره معوقه یا خسارتی مطرح هست؟ → `outstanding_rent`, `damage_claim`
5. چقدر از رهن باید برگردد؟ (اسلایدر تقسیم ودیعه) → `deposit_return_split`
6. حساب بازگشت ودیعه به چه شماره شبا؟ → `deposit_iban`
7. توافق طرف‌مقابل هم هست یا یک‌طرفه درخواست می‌دهید؟ → `mutual_flag`
8. مدارکی (عکس خسارت، رسیدها) برای پیوست دارید؟
**Questions to avoid:**
- «دلیل واقعی‌تون چیه؟» — interrogative; reason captured for record, not judgment.
- «به نظرت مالک حق داره رهن رو نگه داره؟» — legal advice.
- Demanding proof of the new job before proceeding.
**Required info:** `contract_ref`, `termination_reason`, `surrender_date`, `deposit_return_split`, `deposit_iban`, `mutual_flag`
**Optional info:** `outstanding_rent`, `damage_claim`, `evidence_attachments`, `utility_debt_note`
**Conditional questions:** If `outstanding_rent > 0` → deterministic deduction preview from deposit using declared ratio. If `mutual_flag=false` → explain basic registration (free) vs waiting for counterparty confirmation. If damage_claim exists → offer document collection step before AI analysis.
**Alternative paths:** (a) Mutual in-chat termination (both confirm); (b) unilateral registration → landlord notified; (c) add AI document analysis if original contract is ambiguous.
**Completion criteria:** termination record registered (free), deposit split sums deterministically to full deposit, IBAN checksum passes, sensitive-info warning on sharing record.

### Transcript 1 — normal success
**کاربر:** سلام، قرارداد خونه‌ی تهرانپارس رو باید زودتر فسخ کنم.
**دستیار:** سلام! کاری داریم. قراردادتون رو از لیست قراردادهای finalized انتخاب کنید... تهرانپارس، ۴۰۰ میلیون رهن، اجاره ۱۸ میلیون، درسته؟
[decision point: contract matched from user's finalized list]
**کاربر:** آره همونه.
**دستیار:** دلیل فسخ برای ثبت قرارداد چیه؟
**کاربر:** انتقال شغل به اصفهان.
**دستیار:** ثبت شد. تاریخ تخلیه؟
**کاربر:** تا سه هفته دیگه خالیش می‌کنم، اول خرداد.
→ field: surrender_date=1405/03/01
**دستیار:** اجاره‌ی این ماه رو دادید؟ و خسارت یا بدهی دیگه‌ای مطرح هست؟
**کاربر:** اجاره‌ی اسفند ندادم هنوز. خسارت نه.
[decision point: outstanding_rent detected → deterministic deduction preview]
**دستیار:** اوکی، پس محاسبه‌گر ما این پیش‌نمایش رو نشون میده: ودیعه ۴۰۰، منهای یک ماه اجاره معوقه طبق نسبت توافق‌شده (۱۸ میلیون)، بازگشت خالص: **۳۸۲ میلیون**. با اسلایدر تقسیم ودیعه تأیید می‌کنید یا عدد دیگه‌ای بین شما و مالک حرف زده شده؟
[decision point: deposit_return_split — deterministic math, user-adjustable]
**کاربر:** همین درسته، ۳۸۲ برگرده به من.
**دستیار:** حساب بانکی برای واریز؟ شماره شبای ۲۴ رقمی.
**کاربر:** IR120560000000012345678901
[decision point: IBAN checksum passes]
**دستیار:** آخرین سؤال: توافق مالک هم هست یا خودتون درخواست میدید و اون باید تأیید کنه؟
**کاربر:** حرف زدیم، قبوله.
**دستیار:** عالی. ثبت فسخ قرارداد «ثبت پایه» هست و **رایگان**. ثبتش کنم؟
**کاربر:** بله.
**دستیار:** ثبت شد، وضعیت قرارداد از «نهایی‌شده» به «فسخ‌شده» تغییر کرد و رکورد فسخ با امضای دیجیتال هر دو طرف وقتی تأیید کنه، بسته میشه. یادآوری امنیتی: صفحه‌ی فسخ اطلاعات حساس (مبلغ و شبای شما) داره؛ لینکش فقط برای مالک.

### Transcript 2 — incomplete/ambiguous
**کاربر:** می‌خوام قراردادم رو فسخ کنم، ولی مالک هنوز جواب نداده.
**دستیار:** اوکی، می‌تونید رکورد فسخ رو یک‌طرفه ثبت کنید و ایشون بعداً تأیید کنه. اول بگید کدوم قرارداد؟
**کاربر:** همون خونه‌ی ولیعصر.
**دستیار:** تو لیست قراردادهای شما دو تا «ولیعصر» هست — یکی ۱۴۰۴ و یکی ۱۴۰۵. کدوم؟
[decision point: disambiguation required before any write operation]
**کاربر:** ۱۴۰۵، رهن ۲۵۰.
**دستیار:** پیدا شد. دلیل فسخ؟
**کاربر:** بر سر اجاره دعوامون شد، بی‌معنیه دیگه.
[decision point: emotionally charged reason — record it neutrally; don't judge or advise on legality]
**دستیار:** ثبت می‌کنم: «اختلاف بر سر مبلغ اجاره». تاریخ تخلیه‌ی موردنظر؟
**کاربر:** گفتم دو هفته، ولی اون نمی‌دونه هنوز.
**دستیار:** باشه، می‌نویسم «درخواستی: ۱۴۰۵/۰۳/۱۰». ودیعه چقدر بود و انتظارتون چیه؟
**کاربر:** ۲۵۰ دادم، خب کلش باید برگرده.
**دستیار:** اسلایدر تقسیم ودیعه رو روی «بازگشت کامل ۲۵۰ به مستأجر» گذاشتم؛ مالک موقع تأیید می‌تونه نظرش رو ثبت کنه یا عدد رو تغییر بده — اگه تغییر داد، سیستم محاسبه‌ی تفاضل رو بهتون نشون میده. ثبت پایه رایگانه، ثبت کنم؟
**کاربر:** آره.
**دستیار:** ثبت شد. اگه قرارداد اصلی‌تون بندهایی درباره‌ی فسخ زودهنگام داره و می‌خواید اون بخش دقیق تحلیل بشه، سرویس تحلیل سند هوشمند هست (۳۰ توکن) — فعلاً لازم نیست، هر وقت خواستید بگید.

### Transcript 3 — preference change/correction
**کاربر:** راستی مالک گفت اگه تخلیه رو تا اول خرداد نکنم، از رهنم کسر می‌کنه. بذار تاریخ رو ۲۵ اردیبهشت کنم.
**دستیار:** آپدیت شد: surrender_date=۱۴۰۵/۰۲/۲۵. با این تاریخ، توافق بازگشت ودیعه همون ۳۸۲ بمونه؟
**کاربر:** آره.
**دستیار:** ثبت شد. چیز دیگه‌ای؟
**کاربر:** آره، شبا رو عوض کنم؛ اون حساب بسته میشه. IR060000000000987654321001
**دستیار:** شبای جدید اعتبارسنجی شد ✓ و جایگزین شد. رکورد فسخ آماده‌ی تأیید طرف‌مقابله.
[decision point: field corrections free before counterparty confirmation; after lock, corrections need re-registration]

---

## T-LL — Termination × Landlord (موجودی‌دار خروج مستأجر)
**Persona definition:** Mr. Jafari, 58, landlord in Gisha; wants tenant out because he plans to sell the apartment; relationship tense.
**Motivation:** Document everything; ensure tenant's obligations recorded; avoid paying more than required back from deposit.
**Circumstances:** 10 months into 24-month contract; tenant pays late; building will be sold.
**Priorities:** (1) proof of late payments, (2) deposit deductions justified and documented, (3) clean surrender date.
**Initial approach:** «مستأجر باید بره، ولی رهن کامل بهش ندم.»
**Questions to ask (5–8 adaptive):**
1. کدوم قرارداد؟ → `contract_ref`
2. شما مالک/موجرید؟ → `party_role=landlord`
3. فسخ با توافقه یا درخواست یک‌طرفه؟ → `mutual_flag`
4. دلیل ثبت: فروش ملک، تأخیر پرداخت، هر دو؟ → `termination_reason`
5. چه بدهی‌هایی از مستأجر دارید؟ (اجاره معوق، خسارت، شِرایط) → `outstanding_rent`, `damage_claim`
6. چقدر از ودیعه برگردد؟ → `deposit_return_split`
7. رسید یا عکس مدرک دارید؟ → attachments
**Questions to avoid:**
- Helping draft pressure tactics («بنویس تا بترسه») — no threatening documents.
- Legal opinions on whether he can force evacuation.
- «مستأجر حوضش چه؟» — off-record judgments.
**Required info:** `contract_ref`, `party_role=landlord`, `termination_reason`, `surrender_date`, `deposit_return_split`, `mutual_flag`
**Optional info:** `outstanding_rent`, `damage_claim`, `evidence_attachments`, `sale_planned_note`
**Conditional questions:** If deductions > 20% of deposit → mandatory deterministic breakdown card shown to both parties. If tenant contract contains بند فسخ limitations → suggest AI document analysis (paid) to read exact clause before finalizing numbers.
**Alternative paths:** (a) Basic free registration now, analyze later; (b) upload original contract for AI clause check; (c) mutual flow with tenant in-chat.
**Completion criteria:** Termination registered (free) with deterministic deduction breakdown; deposit math sums to full deposit; sensitive-info warning; status → terminated after both confirm.

### Transcript 1 — normal success
**کاربر:** سلام. قرارداد مستأجرم باید فسخ بشه، می‌خوام خونه رو بفروشم.
**دستیار:** سلام! قرارداد گیشه، ۳۵۰ رهن و اجاره ۲۲، دو ساله — همینه؟
**کاربر:** آره.
**دستیار:** فسخ با توافق مستأجره یا شما درخواست می‌دید؟
**کاربر:** گفتم می‌خوام بفروشم، قبوله ولی می‌خواد دو ماه وقت.
**دستیار:** اوکی، پس توافقیه. تاریخ تخلیه‌ی توافقی رو بنویسید.
**کاربر:** ۱۵ تیر.
→ field: mutual_flag=true, surrender_date=1405/04/15
**دستیار:** بدهی‌هایی از مستأجر دارید؟
**کاربر:** دو ماه اجاره عقب افتاده و شیرآبی آشپزخونه خراب کرده، ۴ میلیون.
[decision point: deductions > threshold → mandatory deterministic breakdown card]
**دستیار:** محاسبه‌گر breakdown رو نشون میده — این کارت هم برای شما و هم مستأجر قابل مشاهده‌ست:
- ودیعه: ۳۵۰ میلیون
- اجاره معوق: ۲ ماه × ۲۲ = ۴۴ میلیون
- خسارت اعلامی: ۴ میلیون (نیاز به مدرک/رسید پیوست)
- بازگشت خالص به مستأجر: ۳۰۲ میلیون
تأیید می‌کنید؟
**کاربر:** آره.
→ field: deposit_return_split=302,000,000 to tenant
**دستیار:** عکس یا رسیدی برای خسارت دارید پیوست کنید؟ توافق‌نامه قوی‌تر میشه.
**کاربر:** (عکس شیرآبی پیوست شد)
**دستیار:** پیوست شد. ثبت پایه‌ی فسخ رایگانه؛ ثبت کنم؟
**کاربر:** بله.
**دستیار:** ثبت شد و وضعیت میره رو «فسخ در انتظار تأیید مستأجر». لینک رکورد فقط برای خودش — اطلاعات حساس مالی داخلشه. اگه خواستید بند فسخِ تو قرارداد اصلی رو دقیق بررسی کنیم، تحلیل سند هوشمند هست (۳۰ توکن)، قبل از نهایی‌شدن اعداد پیشنهاد می‌کنم.

### Transcript 2 — incomplete/ambiguous
**کاربر:** می‌خوام مستأجر رو فسخ کنم.
**دستیار:** سلام! کدوم قرارداد و کدوم ملک؟
**کاربر:** خونه‌م دیگه، همون که اجاره دادم.
**دستیار:** تو پروفایل شما دو قرارداد فعال دیدم: گیشه و سعادت‌آباد. کدوم؟
**کاربر:** سعادت‌آباد... نه صبر کن، گیشه.
[decision point: hesitation — do not write until explicit]
**دستیار:** تا وقتی نهاییتون نگید چیزی ثبت نمی‌کنم. پس گیشه. دلیل فسخ؟
**کاربر:** هنوز دقیق نگفتم بهش... شاید فروش، شاید شاکی بشم ازش.
**دستیار:** دلیل ثبت لازمه ولی می‌تونه فعلاً «در حال مذاکره» ثبت بشه و بعداً قطعی بشه. دو تا مسیر داریم: (۱) ثبت پایه‌ی رایگان با دلیل موقت، (۲) اول سند قرارداد رو با تحلیل هوشمند بررسی کنیم ببینیم شرایط فسخ چیه — هزینه‌ش ۳۰ توکنه. کدوم؟
[decision point: distinguish basic registration vs AI analysis explicitly]
**کاربر:** تحلیل چیکار می‌کنه؟
**دستیار:** بندهای فسخ، تخلیه و ودیعه‌ی سند اصلی‌تون رو استخراج و خلاصه می‌کنه؛ فقط توضیح میده چی نوشته شده — توصیه‌ی حقوقی نمیده.
**کاربر:** باشه، اون رو بزن.
[decision point: TOKEN-COST CONFIRMATION]
**دستیار:** هزینه‌ش **۳۰ توکنه**، موجودی شما ۴۸ توکن. تأیید؟
**کاربر:** تأیید.
**دستیار:** (تحلیل) بندهای مرتبط استخراج شد: بند ۷ — فسخ با توافق کتبی طرفین؛ بند ۱۲ — کسر خسارت مستند از ودیعه مجاز؛ تخلیه حداکثر ۳۰ روز پس از ابلاغ توافقی. یعنی بدون توافق کتبی، ثبت یک‌طرفه این قرارداد راهی نداره. بر همین مبنا ادامه بدیم؟
**کاربر:** آره، پس اول باهاش توافق می‌کنم.
[decision point: AI result changes path — free unilateral registration replaced by mutual flow; no termination record written yet]

### Transcript 3 — preference change/correction
**کاربر:** مستأجر گفت خسارت شیرآبی رو خودش تعمیر می‌کنه، پس ۴ میلیون رو برگردون.
**دستیار:** آپدیت breakdown: اجاره معوق ۴۴ کسر میشه، خسارت حذف — بازگشت خالص: ۳۰۶ میلیون. تأیید؟
**کاربر:** آره.
**دستیار:** ثبت شد. پیوست عکس شیرآبی رو نگه می‌داریم به‌عنوان سوابق حالت ملک، یا حذفش کنم؟
**کاربر:** نگهش دار، نشون میده وضعیت اول بود.
**دستیار:** ماندگار شد. رکورد همچنان «در انتظار تأیید مستأجر»؛ هر تغییری بعد از تأییدش نیاز به ثبت مجدد داره.

---

## T-MU — Termination × Mutual-Termination Parties (فسخ توافقی دوطرفه)
**Persona definition:** Two personas in one chat-session: Mr. Alavi (landlord, 45) and Mr. Bagheri (tenant, 38), terminating amicably after 14 months — tenant bought his own home.
**Motivation:** Fast, documented, friendly closure; full deposit return; both want zero future claims.
**Circumstances:** Both present in the shared chat thread; relationship is good; unit condition excellent.
**Priorities:** (1) simultaneous confirmation, (2) full refund with exact date, (3) a written «بی‌ادعا» tone record.
**Initial approach:** Landlord: «قرارداد آقا رضا رو با توافق خودش می‌بندیم.»
**Questions to ask (5–8 adaptive):**
1. تأیید هر دو طرف که فسخ توافقیه → `mutual_flag=true` (both confirm in-thread)
2. دلیل مشترک ثبت؟ → `termination_reason`
3. تاریخ دقیق تخلیه و تحویل کلیدها → `surrender_date`
4. وضعیت ودیعه: بازگشت کامل یا تفریغ با بدهی‌ها؟ → `deposit_return_split`
5. شبا دریافت واریز → `deposit_iban`
6. صورت‌وضعیت تحویل ملک (کنتورها، رهن شرکتی، سوئیت) → `delivery_condition_note`
7. تأیید نهایی هر دو طرف روی رکورد → double-confirm gate
**Questions to avoid:**
- «چرا دیگه نمی‌مونید؟» — not the agent's business beyond the reason field.
- Probing who's "right" if a small disagreement surfaces.
- Asking tenants to transfer deposit inside chat — Mahalino doesn't move money (escrow is WF-P only, optional).
**Required info:** `contract_ref`, `mutual_flag=true`, `termination_reason`, `surrender_date`, `deposit_return_split`, `deposit_iban`, both-party confirmations
**Optional info:** `delivery_condition_note`, `meter_readings`, `no_claim_note`
**Conditional questions:** If either party hesitates >1 turn on confirmation → switch to asymmetric flow (request + counterparty review). If meter readings provided → attach to record.
**Alternative paths:** (a) Both-in-chat double confirm; (b) async: one registers, other confirms via link; (c) attach AI analysis of original contract if either party requests clause check.
**Completion criteria:** Both digital confirmations captured; deposit math sums exactly; status → terminated; sensitive-info warning on each share.

### Transcript 1 — normal success (two-party thread)
**موصل (آقای علوی):** سلام، قرارداد آقای باقری رو می‌خوایم با توافق خودش ببندیم، خودش اینجاست.
**دستیار:** خوش اومدید هر دو نفر! برای ثبت فسخ توافقی، تأیید هر دو طرف لازمه. آقای باقری، شما هم موافق فسخ قرارداد گیشا هستید؟
**مستأجر (آقای باقری):** آره، خونه خریدم دیگه، ممنونم از آقا علوی.
[decision point: mutual_flag=true requires both explicit confirmations in-thread]
**دستیار:** دلیل مشترک برای ثبت: «خرید مسکن توسط مستأجر و توافق طرفین»؟
**هر دو:** باشه.
**دستیار:** تاریخ تخلیه و تحویل کلید؟
**آقای باقری:** همین جمعه، ۱۲ اردیبهشت.
**دستیار:** ودیعه چطور؟
**آقای علوی:** ۳۰۰ کامل برگرده، هیچ بدهی نداره.
[decision point: deposit_return_split=full; deterministic check: no deductions → 300M to tenant]
**دستیار:** ثبت: بازگشت کامل ۳۰۰ میلیون به آقای باقری. شبای واریز؟
**آقای باقری:** IR410560000000011122334401
**دستیار:** اعتبارسنجی شد ✓. صورت‌وضعیت تحویل هم می‌خواید؟ کنتور برق و آب و گاز، تعداد کلید.
**آقای علوی:** آره، برق ۲۴۵۰، آب ۸۸۰، گاز ۱۱۲۰، سه کلید.
**دستیار:** ثبت شد. خلاصه‌ی رکورد فسخ: توافقی، دلیل خرید مسکن، تخلیه ۱۲ اردیبهشت، بازگشت کامل ۳۰۰ میلیون، صورت‌وضعیت پیوست. **ثبت پایه رایگانه** — تأیید نهایی هر دو نفر لازمه: آقای علوی؟
**آقای علوی:** تأیید.
**دستیار:** آقای باقری؟
**آقای باقری:** تأیید.
**دستیار:** ثبت شد، وضعیت قرارداد: «فسخ‌شده». یادآوری امنیتی: رکورد شامل شبای و مبالغه؛ فقط بین خودتون به اشتراک بذارید.

### Transcript 2 — incomplete/ambiguous
**آقای علوی:** فسخ رو ثبت کن، آقای باقری بعداً میاد تو چت.
**دستیار:** می‌شه شما به‌عنوان طرف اول ثبت کنید و ایشون بعداً با لینک تأیید کنه. دلیل فسخ؟
**آقای علوی:** توافقیم.
**دستیار:** روی همه‌ی جزئیات؟ تاریخ تخلیه و وضعیت ودیعه رو قطعی حرف زدید؟
**آقای علوی:** خب... تاریخ رو گفت جمعه، ودیعه رو هنوز نگفتیم کی میدم.
[decision point: deposit term unresolved — record can't be marked "fully agreed"]
**دستیار:** پس ثبت می‌کنم «توافقی — بازگشت ودیعه در انتظار توافق تاریخ» و رکورد تا تکمیل این بند قفل تأیید نمیشه. ودیعه چقدر بود؟
**آقای علوی:** ۲۸۰.
**دستیار:** ثبتی: ۲۸۰ میلیون، «در انتظار توافق زمان‌بندی بازگشت». شبای آقای باقری رو هم دارید؟
**آقای علوی:** نه، ازش می‌گیرم.
**دستیار:** چک‌لیست مانده: شبا + تاریخ بازگشت ودیعه. هر دو طرف باید تأیید نهایی کنن، پس عجله‌ای نیست.
[decision point: free registration saved incomplete; confirm gate blocked deterministically]

### Transcript 3 — preference change/correction
**آقای باقری:** جمعه نشد، دوشنبه میام تخلیه کنم، ۱۵ اردیبهشت.
**آقای علوی:** اوکیه برام.
**دستیار:** آپدیت تاریخ تخلیه: ۱۴۰۵/۰۲/۱۵. آقای علوی تأیید می‌کنید این تغییر رو؟
[decision point: any change re-opens both-side confirmation]
**آقای علوی:** تأیید.
**دستیار:** ثبت شد. حالا اگه ودیعه هم تاریخ مشخص کردید، بگید تا رکورد رو کامل کنیم و بریم سراغ تأیید نهایی.
**آقای باقری:** بذار تا آخر ماه، ۳۰ اردیبهشت.
**آقای علوی:** قبوله.
**دستیار:** هر دو تأیید ✓ — رکورد کامل شد: تخلیه ۱۵ اردیبهشت، بازگشت ۳۰۰ میلیون تا ۳۰ اردیبهشت. وضعیت: «در انتظار تأیید نهایی طرفین». لینک فقط بین خودتون.

---

## T-DG — Termination × Contractual Disagreement (اختلاف قراردادی)
**Persona definition:** Ms. Karimian, 44, tenant whose landlord withholds 120M of her 300M rahn claiming "damages" (worn kitchen, wall holes) she disputes; 20 months into 24-month contract.
**Motivation:** Recover her deposit; have a neutral documented record; doesn't want escalation to court if avoidable.
**Circumstances:** Angry but rational; has photos from move-in day; no written move-in condition report exists.
**Priorities:** (1) neutral documentation of both claims, (2) understanding her options (in scope), (3) not escalating prematurely.
**Initial approach:** «مالک رهنم رو نمی‌ده، می‌گه خسارت. من که کاری نکردم!»
**Questions to ask (5–8 adaptive, extra-neutral tone):**
1. کدوم قرارداد و مبلغ ودیعه؟ → `contract_ref`, deposit
2. ادعای مالک دقیقاً چیه و چقدر؟ → `damage_claim` (amount + items)
3. پاسخ شما به هر بند ادعا؟ → `tenant_counter_note`
4. مدرکی (عکس‌های روز تحویل، رسید تعمیرات) دارید؟ → `evidence_attachments`
5. قرارداد اصلی بندی درباره‌ی خسارت و ودیعه داره؟ → prompts AI analysis offer
6. خروج از واحد اتفاق افتاده یا هنوز در مالکیت شماست؟ → `surrender_status`
7. حاضرید به توافق میانی (مثلاً کسر مورد توافق) برسید؟ → slider
**Questions to avoid:**
- «حق با کیه؟» — determination of fault is legal advice.
- «برو شکایت کن» / naming specific legal remedies — out of scope; can say records may be used in any formal process (informational).
- Taking sides («مالک داره نفت می‌سوزه»).
**Required info:** `contract_ref`, `damage_claim` (landlord's), `tenant_counter_note`, `deposit_return_split` (either agreed or contested), `evidence_attachments`
**Optional info:** `surrender_status`, `witness_info`, `analysis_ref` (AI doc analysis)
**Conditional questions:** If original contract has wear-and-tear clauses unknown to user → offer AI document analysis (30 tokens, paid). If user asks about شورای حل اختلاف → informational only: «این تصمیم با خودتونه؛ من مشاور حقوقی نیستم، ولی رکورد فسخ و مدارک پیوست می‌تونه سند مفیدی باشه.»
**Alternative paths:** (a) Contested registration (both versions recorded); (b) AI analysis of contract clauses; (c) partial-agreement via split slider; (d) park the record while negotiating offline.
**Completion criteria:** Both claims recorded symmetrically; no verdict language from agent; deterministic split math if partial agreement reached; free registration; sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** مالک ۱۲۰ از ۳۰۰ رهنم رو نگه داشته، می‌گه آشپزخونه و دیوارها خسارت داره. این عادلانه نیست!
**دستیار:** متوجه‌ام، بذارید دقیق ثبتش کنیم که طرفینِ ماجرا شفاف بشن. من قضاوت نمی‌کنم و مشاور حقوقی نیستم، ولی رکورد بی‌طرف می‌سازم که هر دو روایت با مدرک ثبت بشه. قرارداد کدومه؟
**کاربر:** قیطریه، ۲۴ ماهه، رهن ۳۰۰.
**دستیار:** ادعای مالک دقیقاً چیه و چقدر؟
**کاربر:** گفت «کابینت و رنگ‌روری»، ۱۲۰ میلیون — هیچ عدد منطقی‌ای نیست!
**دستیار:** ثبت می‌کنم به همین شکل: «ادعای مالک: استهلاک کابینت و نقاشی — مبلغ ادعایی ۱۲۰ میلیون — بدون شکستگی/آسیب مشخص‌شده». پاسخ شما چی بنویسیم؟
**کاربر:** بنویس استهلاک عادی دو سال سکونته، آسیب و شکستگی نیست.
[decision point: neutral dual-record; no verdict]
**دستیار:** ثبت شد. عکس‌های روز تحویل دارید؟
**کاربر:** آره، از قبل از اسباب‌کشی عکس گرفتم.
**دستیار:** (پیوست ۴ عکس) عالی، به رکورد اضافه شد. قرارداد اصلی‌تون درباره‌ی استهلاک عادی و ودیعه بندی داره؟
**کاربر:** نمی‌دونم، نخوندم دقیق.
**دستیار:** دو تا مسیر: (۱) سند رو آپلود کنید تا با تحلیل سند هوشمند بندهای خسارت و ودیعه استخراج بشه — **۳۰ توکن**؛ (۲) بدون تحلیل، رکورد فسخ متعارض رو ثبت کنیم که هر دو ادعا با مدارک ثبت بشه و مذاکره ادامه پیدا کنه.
[decision point: basic registration vs AI analysis — explicit user choice]
**کاربر:** اول تحلیل، شاید تو سند چیزی باشه به نفعم.
**دستیار:** هزینه **۳۰ توکنه**، موجودی ۷۲. تأیید؟
[decision point: TOKEN-COST CONFIRMATION]
**کاربر:** تأیید.
**دستیار:** (تحلیل) نتایج: بند ۹ — «کسر صرفاً برای آسیب‌های غیرعادی، پس از توافق یا کارشناس مرضی‌الطرفین»؛ بند ۱۵ — بازگشت ودیعه حداکثر ۲۰ روز پس از تخلیه. یعنی متن سند کسرِ استهلاک عادی رو قید نکرده. این توضیحِ محتواست، نه مشاوره‌ی حقوقی.
**کاربر:** خب پس چی کار کنم الان؟
**دستیار:** گزینه‌های داخل چارچوب ما: ثبت رکورد متعارض با هر دو روایت و مدارک؛ یا با اسلایدر یه مبلغ موردتوافق میانی ثبت کنید (مثلاً مالک ادعای کوچک‌تری ثبت کنه). تصمیمش با خودتونه — و اگه بحث رسمی‌تر شد، همون رکورد و مدارک سند قابل استفاده‌ست.

### Transcript 2 — incomplete/ambiguous
**کاربر:** مالک رهنم رو نمی‌ده!
**دستیار:** متأسفم که این وضعیت دارید. برای ثبت دقیق، اول: کدوم قرارداد؟
**کاربر:** خونه‌ی صاحب‌خانه‌ام... اسمش رو یادم نیست، فکر کنم آقای رستمی.
**دستیار:** تو لیست قراردادهای شما یه قرارداد finalized با نقش مستأجر دیدم: «تهرانپارس، رهن ۲۰۰». همینه؟
**کاربر:** آره فکر کنم.
[decision point: "فکر کنم" on a financial record — explicit confirmation gate]
**دستیار:** روی رکورد مالی «فکر کنم» کافی نیست — تأیید قطعی: رهن ۲۰۰ میلیون، تهرانپارس؟
**کاربر:** آره قطعاً.
**دستیار:** ادعای مالک چیه؟
**کاربر:** نگفته دقیق، فقط میگه «خسارت داری».
**دستیار:** پس ثبت می‌کنم: «ادعای مالک: خسارت — مبلغ و موارد اعلام‌نشده». مالکیت خونه الان با شماست یا خالی کردید؟
**کاربر:** هنوز دم، ولی می‌خوام برم.
**دستیار:** ثبتی. دو پیشنهاد در چارچوب ما: (۱) رکورد فسخ متعارض رایگان ثبت بشه تا ادعاها و تاریخ‌ها مکتوب بشن؛ (۲) اگه سند اصلی رو دارید، تحلیل بند خسارتش با ۳۰ توکن. تا وقتی ادعای مالک عدد نداره، هیچ اسلایدر تقسیم ودیعه قابل ثبت نیست — محاسبه‌گر عدد فرضی نمی‌سازه.
**کاربر:** باشه، رکورد رو ثبت کن.
**دستیار:** ثبت شد (رایگان). لینک رو برای مالک بفرستید تا روایت خودش و عدد ادعاش رو ثبت کنه — یادتون باشه صفحه حساسه، فقط برای خودش.

### Transcript 3 — preference change/correction
**کاربر:** مالک پیام داد: اگه ۳۰ میلیون بپذیرم، بقیه رو می‌ده. فکر کنم بهتره تمومش کنم.
**دستیار:** تصمیم پذیرش با شماست — من فقط ثبت می‌کنم. با پذیرش ۳۰ میلیون کسر، بازگشت ودیعه میشه: ۳۰۰ − ۳۰ = **۲۷۰ میلیون**. این عدد رو با اسلایدر به‌عنوان «توافق میانی» ثبت کنم؟
**کاربر:** آره، خسته شدم.
**دستیار:** ثبت شد: deposit_return_split=۲۷۰ میلیون به مستأجر، «توافق میانی پس از مذاکره». تأیید نهایی هر دو طرف لازمه. عکس‌های روز تحویل رو هم تو رکورد نگه می‌داریم — سوابق مفیدیه حتی بعد از توافق.
**کاربر:** مرسی.
**دستیار:** فقط یادآوری: لینک رکورد حاوی مبلغ‌ها و مدارک حساسه؛ فقط برای مالک بفرستیدش.

---

## T-DA — Termination × User needing document analysis (تحلیل سند)
**Persona definition:** Mr. Nazempour, 39, meticulous; has a 3-year commercial lease (shop in Tajrish bazaar) full of dense legal language; wants to understand فسخ and ودیعه clauses before deciding anything.
**Motivation:** Know exactly what the paper says — not opinions, just extraction.
**Circumstances:** Contract is a scanned image from 1403; considering early exit because business is slow.
**Priorities:** (1) accurate clause extraction, (2) distinction between "what it says" vs "what I should do", (3) cost transparency.
**Initial approach:** «این قراردادم رو بخون و بهم بگو فسخش چجوریه.»
**Questions to ask (5–8 adaptive):**
1. سند رو آپلود کنید (عکس/PDF واضح) → upload
2. کدوم بخش‌ها براتون مهمه؟ فسخ، ودیعه، تحویل؟ → analysis_focus
3. سند اصلی قرارداد اجاره‌ی ثبت‌شده‌ی محلینو هست یا سند خارجی؟ → `source_type`
4. هدف نهایی: فسخ زودهنگام، تمدید، یا فقط فهم؟ → intent routing
5. بعد از تحلیل، ثبت فسخ پایه لازمه یا فعلاً نه؟
**Questions to avoid:**
- «قراردادتون رو که کار دسته، بیخیال» — dismissive.
- Interpreting clauses as advice («پس حق فسخ دارید») — must stay at extraction level.
- Asking for the counterparty's signature pages as identity proof.
**Required info:** uploaded document, `analysis_focus`, explicit token confirmation
**Optional info:** `source_type`, `contract_ref` (if registered in Mahalino), `intent_note`
**Conditional questions:** If scan quality poor → deterministic OCR-quality check blocks analysis, asks for re-upload. If intent=early termination → route results toward WF-T registration flow after analysis.
**Alternative paths:** (a) Analysis only, no registration; (b) analysis → registration → termination record; (c) human review suggestion (external, informational).
**Completion criteria:** Analysis delivered as clause extraction with neutral phrasing; token charged only after confirmation; clear "این تحلیل توصیه نیست" disclaimer; results linkable to a termination record.

### Transcript 1 — normal success
**کاربر:** سلام. یه قرارداد اجاره‌ی مغازه دارم که پر از متن سنگینه. می‌خوام بفهمم فسخش چه شرایطی داره.
**دستیار:** سلام! سرویس «تحلیل سند هوشمند» دقیقاً برای همین هست: بندها رو استخراج و ساده توضیح میده — توصیه‌ی حقوقی نمی‌ده. عکس یا PDF سند رو بفرستید.
**کاربر:** (آپلود اسکن ۶ صفحه‌ای)
[decision point: deterministic OCR-quality check passes]
**دستیار:** سند با کیفیت خوب خونده شد ✓. کدوم بخش‌ها براتون اولویته؟ فسخ، ودیعه، تحویل و تخلیه، تمدید؟
**کاربر:** فسخ و ودیعه.
**دستیار:** هزینه‌ی تحلیل **۳۰ توکنه**، موجودی شما ۹۰ توکن. تأیید می‌کنید؟
[decision point: TOKEN-COST CONFIRMATION before charging]
**کاربر:** تأیید.
**دستیار:** تحلیل انجام شد — نتایج:
- بند ۴ (فسخ زودهنگام): «فسخ پیش از پایان مدت صرفاً با پرداخت معادل سه ماه اجاره به موجر ممکن است.»
- بند ۶ (ودیعه): «ودیعه ۴۵۰ میلیون؛ بازگشت ظرف ۳۰ روز پس از تحویل ملک با کسر بدهی‌های مستند.»
- بند ۹ (تمدید): «تمدید با توافق کتبی طرفین، با حداکثر ۲۰٪ افزایش اجاره.»
یعنی سند برای فسخ زودهنگام یه شرط مالی مشخص تعریف کرده و برای ودیعه هم زمان‌بندی داره. این استخراج متن سنده، نه توصیه.
[decision point: extraction-level only; no "پس شما باید..."]
**کاربر:** سه ماه اجاره یعنی چقدر؟
**دستیار:** اجاره‌ی ماهانه‌ی سند شما ۳۵ میلیونه، پس شرط مالی بند ۴ معادل ۱۰۵ میلیونه — محاسبه‌ی مستقیم از عدد سند.
**کاربر:** می‌فهمم. حالا اگه بخوام ثبتش کنم چی؟
**دستیار:** می‌تونیم مستقیم بریم سراغ ثبت فسخ — ثبت پایه رایگانه و بند ۴ رو به‌عنوان دلیل و شرط مالی ثبت می‌کنیم. انجام بدم؟
**کاربر:** باشه.
**دستیار:** ثبت شد (رایگان): فسخ زودهنگام، شرط مالی ۱۰۵ میلیون طبق بند ۴، وضعیت «در انتظار تأیید موجر». لینک رکورد فقط برای موجر — اطلاعات حساس مالی داره.

### Transcript 2 — incomplete/ambiguous
**کاربر:** قراردادمو می‌فرستم برام تحلیل کن.
**دستیار:** خیلی خب، فایل سند رو بفرستید.
**کاربر:** (عکس تار از صفحه‌ی دوم)
[decision point: OCR-quality check fails deterministically]
**دستیار:** کیفیت این عکس برای استخراج دقیق کافی نیست — متن بندها ناخواناست. صفحه‌ها رو تک‌تک، نزدیک و با نور کافی عکس بگیرید یا PDF اسکن بفرستید.
**کاربر:** باشه یه لحظه.
**کاربر:** (آپلود مجدد، ۳ صفحه)
**دستیار:** خونده شد ✓ ولی فایل شما ۳ صفحه‌ست و سندهای اجاره معمولاً امضا و شماره‌صفحه دارن؛ این همه‌ی سنده یا بخشی ازش؟
**کاربر:** فقط صفحات مهمش رو گرفتم.
**دستیار:** اوکی؛ تحلیل روی همین ۳ صفحه انجام میشه و تو خروجی قید می‌کنم که تحلیل ناقصه. کدوم بندها براتون مهمه؟
**کاربر:** همه‌ش مهمه.
**دستیار:** پس کل ۳ صفحه رو استخراج می‌کنم. هزینه‌ی تحلیل **۳۰ توکنه**، موجودی ۵۵ توکن. تأیید؟
**کاربر:** آره.
**دستیار:** (تحلیل) بندهای این ۳ صفحه استخراج شد؛ توجه: تحلیل روی بخشی از سند انجام شده و بندهای غایب (مثلاً تمدید) ممکنه پاسخ سؤال‌های بعدی‌تون باشن. سؤال خاصی از نتایج دارید؟
[decision point: partial-analysis disclaimer mandatory]

### Transcript 3 — preference change/correction
**کاربر:** راستی بند ۶ رو دوباره بگو — موجر می‌گه بازگشت ودیعه ۳۰ روزه اجباری نیست چون «تا تسویه شرایط» نوشته.
**دستیار:** متن دقیق بند ۶ اینه: «بازگشت ظرف ۳۰ روز پس از تحویل ملک با کسر بدهی‌های مستند.» یعنی شرط کسر بدهی مستند در سند هست، ولی بازگرداندنش ظرف ۳۰ روز پس از تحویل قید شده — بازخوانیِ متن سنده، نه تفسیر حقوقی. اگه اختلاف‌تون سر همین بند جدی شد، همون رکورد فسخ و مدارک می‌تونه مبنای گفتگو باشه.
**کاربر:** پس بذار رکورد فسخ رو هم با ارجاع به بند ۶ ثبت کن.
**دستیار:** ثبت شد (رایگان) با ارجاع متنی به بند ۶. چیز دیگه‌ای از تحلیل لازم دارید؟
**کاربر:** نه مرسی، همین کافیه.

---

## T-FI — Termination × User evaluating financial consequences (سنجش پیامد مالی)
**Persona definition:** Mr. Dehghan, 31, tenant in a 2-year contract (rahn 800M, rent 12M), 7 months in; considering moving to a cheaper unit; wants to *simulate* consequences before deciding.
**Motivation:** Compare "terminate now vs wait 9 more months" financially; understand every deduction scenario.
**Circumstances:** No dispute with landlord; purely a calculation-driven decision; also weighing converting part of rahn into rent.
**Priorities:** (1) exact numbers under each scenario, (2) no premature commitment, (3) understanding the rahn/rent conversion math.
**Initial approach:** «اگه الان فسخ کنم چقدر ضرر می‌کنم؟ فقط عدد بده، هنوز تصمیم نگرفتم.»
**Questions to ask (5–8 adaptive, simulation-mode):**
1. قرارداد فعلی و اجاره‌ی ماهانه؟ → context
2. کدوم سناریوها شبیه‌سازی بشن؟ (الان / ۳ ماه بعد / پایان مدت) → simulation params
3. شرط فسخ زودهنگام تو سندتون چیزی میگه؟ (اگه سند ثبت محلینوئه از بندش استفاده می‌کنیم؛ وگرنه تحلیل سند پیشنهاد میشه)
4. اجاره معوق دارید؟ → `outstanding_rent`
5. انتظار بازگشت ودیعه چقدره؟ → `deposit_return_split` (simulated)
6. خسارت احتمالی تحویل؟ → optional
7. بعد از شبیه‌سازی: ثبت واقعی فسخ یا فقط گزارش؟
**Questions to avoid:**
- «پس چرا می‌خواید برید؟» — not needed for math.
- Advising which scenario is "better" financially as a directive — present numbers + neutral framing.
- Recommending real-estate market timing.
**Required info:** `contract_ref` or declared amounts, simulation parameters
**Optional info:** `outstanding_rent`, `penalty_assumption`, `surrender_date` (hypothetical)
**Conditional questions:** If original contract not registered in Mahalino and penalty clause unknown → offer AI analysis (30 tokens) as prerequisite for exact numbers; otherwise simulations use user-declared assumptions labeled clearly as assumptions.
**Alternative paths:** (a) Simulation-only (no records written); (b) simulation → real registration; (c) rahn/rent conversion calculator mid-contract (WF-C reference).
**Completion criteria:** Deterministic math per scenario; clear assumption labels; nothing written to contract state unless user says "ثبت کن"; free registration if proceeding.

### Transcript 1 — normal success
**کاربر:** اگه قراردادم رو الان فسخ کنم چقدر ضرر می‌کنم؟ فقط عدد می‌خوام، هنوز تصمیم نگرفتم.
**دستیار:** کاملاً اوکیه — حالت «شبیه‌سازی» داریم و هیچی ثبت نمی‌شه مگه خودتون بگید. قراردادتون: رهن ۸۰۰، اجاره ۱۲، دوساله، ۷ ماه گذشته؟
**کاربر:** آره.
**دستیار:** شرط فسخ زودهنگام تو سندتون چیزی داره؟
**کاربر:** نمی‌دونم، قرارداد رو خودمون بالای مغازه بستیم، تو محلینو نیست.
**دستیار:** پس دو راه برای دقیق شدن: سند رو آپلود کنید تا با تحلیل هوشمند بند فسخ استخراج بشه (**۳۰ توکن**)، یا فعلاً با فرض خودتون شبیه‌سازی کنیم که همه‌چیز با برچسب «فرض» میاد.
**کاربر:** فرض بذار: می‌گن یه ماه اجاره جریمه‌ست.
**دستیار:** شبیه‌سازی با فرض شما (جریمه فسخ = ۱ ماه اجاره):
- سناریوی «الان»: ودیعه ۸۰۰ − جریمه ۱۲ − اجاره معوق ۰ = بازگشت خالص **۷۸۸ میلیون**
- سناریوی «۳ ماه بعد»: اجاره‌ی ۳ ماه دیگه باید پرداخت بشه (۳۶ میلیون هزینه) ولی جریمه همونه → بازگشت همان ۷۸۸ ولی ۳۶ میلیون اجاره اضافه پرداخت‌شده
- سناریوی «پایان مدت (۱۷ ماه دیگه)»: ۱۷ × ۱۲ = ۲۰۴ میلیون اجاره بیشتر، بدون جریمه
همه‌ی این‌ها بر پایه‌ی فرض جریمه‌ی شماست، نه متن سند.
[decision point: deterministic math + explicit assumption labels]
**کاربر:** اگه رهن رو کم کنم و اجاره رو ببرم بالا چی؟ می‌شه وسط قرارداد؟
**دستیار:** تغییر رهن/اجاره وسط قرارداد فقط با توافق کتبی موجر ممکنه — من مشاور حقوقی نیستم، ولی اگه توافق کردید، می‌تونیم یه الحاقیه (قرارداد اصلاحی) با محاسبه‌گر نسبت ببندیم: هر یک میلیون رهن ≈ ۶۶ هزار تومن اجاره. مثلاً ۱۰۰ رهن → ۶.۶ میلیون کمتر اجاره. می‌خواید یه ترکیب حساب کنم؟
**کاربر:** آره، ۶۰۰ رهن بذار.
**دستیار:** رهن ۶۰۰ یعنی کاهش ۲۰۰ در برابر ۸۰۰ → معادل کاهش ۱۳.۲ میلیون اجاره؛ با اجاره‌ی فعلی ۱۲ در میاد **۰** — یعنی اجاره صفر، رهن ۶۰۰. این ترکیب در منحنی استاندارد ما دیده میشه. حالت‌های دیگه‌ای می‌خواید؟
**کاربر:** نه کافیه. فقط گزارش بمونه، چیزی ثبت نکن.
**دستیار:** هیچ رکوردی ثبت نشد ✓. هر وقت تصمیم گرفتید، فسخ پایه رایگانه و اگه سند اصلی رو خواستید دقیق بشه، تحلیل هوشمند ۳۰ توکنه همیشه در دسترسه.

### Transcript 2 — incomplete/ambiguous
**کاربر:** چند تا حالت برام حساب کن، نمی‌دونم چی می‌خوام.
**دستیار:** اوکی، از پایه شروع می‌کنیم: رهن و اجاره‌ی قرارداد فعلی‌تون چقدره؟
**کاربر:** یادم نیست دقیق، فکر کنم ۵۰۰ و ۲۰.
**دستیار:** تو پروفایل شما یه قرارداد finalized دیدم: رهن ۴۵۰، اجاره ۲۲. همینه؟
**کاربر:** آره احتمالاً همونه.
[decision point: "احتمالاً" — deterministic gate needs explicit confirmation before math]
**دستیار:** برای محاسبات مالی باید قطعی باشه: تأیید نهایی — رهن ۴۵۰، اجاره ۲۲؟
**کاربر:** آره تأیید.
**دستیار:** چه سناریوهایی شبیه‌سازی بشن؟ الان فسخ، بعداً، یا پایان مدت؟
**کاربر:** نمی‌دونم... همه.
**دستیار:** جریمه فسخ تو سندتون چیه؟
**کاربر:** نمی‌دونم.
**دستیار:** بدون جریمه، عددها فرضی می‌مونن. دو گزینه: تحلیل سند (۳۰ توکن) برای عدد واقعی، یا ادامه با فرض صفر که میگم «فرض: بدون جریمه». کدوم؟
**کاربر:** فعلاً بدون جریمه.
**دستیار:** شبیه‌سازی با فرض «بدون جریمه»: فسخ الان → بازگشت ۴۵۰ (منهای هر بدهی). فقط یادتون باشه عدد واقعی احتمالاً کمتر از اینه چون جریمه رو صفر فرض کردیم.
**کاربر:** خب این که فایده نداره...
**دستیار:** حق با شماست؛ برای عدد واقعی سند لازمه. هر وقت فایلش رو فرستادید، تحلیل ۳۰ توکنی عدد دقیقِ بند جریمه رو میده.
[decision point: user realizes simulation is only as good as inputs — no forced sale of the paid service]

### Transcript 3 — preference change/correction
**کاربر:** یه چیز دیگه: اگه فقط اجاره رو بالا ببرم و رهن کم کنم، همین امسال فرقش چیه؟
**دستیار:** با رهن فعلی ۴۵۰ و اجاره ۲۲: مثلاً رهن ۳۰۰ بذارید → کاهش ۱۵۰ → معادل کاهش ۹.۹ میلیون اجاره → اجاره‌ی جدید ≈ ۳۱.۹ میلیون. صرفه‌جویی نقدی امسال: ۱۵۰ میلیون رهن کم می‌کنید ولی ماهی ۹.۹ بیشتر میدید → در ۱۲ ماه ≈ ۱۱۸.۸ میلیون. یعنی خالص نقدینگی امسال ۳۱.۲ میلیون به نفع شما با این ترکیب. این محاسبه‌ی مستقیمِ نسبت استاندارد ماست (۱ رهن ≈ ۰.۰۶۶ اجاره)، نه مشاوره‌ی مالی.
**کاربر:** مرسی، خیلی بهتر فهمیدم. چیزی ثبت نکن.
**دستیار:** ثبت نشد ✓. هر وقت توافق با موجر قطعی شد، الحاقیه رو با هم می‌بندیم.

# SECTION C — WORKFLOW P: PAYMENT AGREEMENTS (توافق پرداخت اقساطی)

## P-BY — Payment × Buyer (خریدار اقساطی)
**Persona definition:** Mr. Fallah, 36, buying a 780M toman apartment in Ekbatan; cash for 350M down, wants the remaining 430M in installments over 12 months.
**Motivation:** Own a home without bank loans; keep the seller comfortable with a precise, enforceable schedule.
**Circumstances:** Salaried; monthly payment capacity max ~38M; seller open to installments but wants guarantees.
**Priorities:** (1) installment amounts that fit his cashflow, (2) no compounding surprises, (3) documented delivery date tied to payment milestones.
**Initial approach:** «می‌خوام خونه رو قسطی بخرم، برنامه‌ش رو باهم بچینیم.»
**Questions to ask (5–8 adaptive):**
1. قیمت کل و پیش‌پرداخت؟ → `total_amount`, `down_payment`
2. چند قسط؟ → `installment_count`
3. فاصله‌ی اقساط ماهانه یا نامنظم؟ → `installment_interval`
4. تاریخ اولین قسط؟ → `first_payment_date` (validator: not in past)
5. ضمانت پرداخت چی بذاریم؟ (چک تضمینی، ضامن، اسکرو) → `guarantee_type`
6. تأخیر پرداخت چه پیامدی داشته باشه؟ → `late_penalty_note`
7. تحویل ملک به کدام قسط گره بخوره؟ → `delivery_milestone`
**Questions to avoid:**
- «چقدر پس‌انداز داری؟» — only via total/down/installment framing.
- Advising on whether installment buying is "smart" — financial advice.
- Collecting cheque numbers/images inside chat (sensitive; cheque handling outside scope).
**Required info:** `total_amount`, `down_payment`, `installment_count`, `installment_amount` (derived deterministically or manual), `first_payment_date`, `installment_interval`, both party identities
**Optional info:** `guarantee_type`, `late_penalty_note`, `delivery_milestone`, `early_settlement_note`
**Conditional questions:** If (down + count×max_capacity) < total → deterministic feasibility card: schedule cannot cover the total; propose higher down, fewer installments with bigger amounts, or longer horizon. If seller demands escrow → 25-token confirmation flow.
**Alternative paths:** (a) Equal installments (auto-calculated); (b) irregular schedule (user-defined per-installment amounts, sum-validated); (c) escrow-backed schedule.
**Completion criteria:** Sum(down + installments) == total exactly; validator passes; token cost only for escrow (25) — schedule itself free; sensitive-info warning on sharing schedule.

### Transcript 1 — normal success
**کاربر:** سلام. یه آپارتمان ۷۸۰ میلیونی رو قسطی می‌خرم. ۳۵۰ پیش‌پرداخت میدم، بقیه قسطی.
**دستیار:** خوش اومدید! باهم برنامه‌ی اقساط رو می‌چینیم. باقی‌مانده میشه ۴۳۰ میلیون. چند قسط فکر می‌کنید؟
**کاربر:** ۱۲ قسط ماهانه.
**دستیار:** محاسبه‌گر: ۴۳۰ ÷ ۱۲ ≈ ۳۵.۸ میلیون در ماه — اقساط مساوی از ۳۵.۹ با قسط آخر متفاوت. بذارید دقیق بشه: ۱۱ قسط ۳۵ میلیون + قسط آخر ۴۵ میلیون، یا قسط‌های مساوی ۳۵.۸ و گرد کردن قسط آخر؟
[decision point: rounding strategy — deterministic, user picks]
**کاربر:** قسط آخر رو گرد کن، مساوی بهتره.
**دستیار:** اوکی: ۱۱ × ۳۵ + ۴۵ = ۴۳۰ ✓. اولین قسط کی؟
**کاربر:** یه ماه بعد از معامله، اول تیر.
→ field: first_payment_date=1405/04/01, installment_interval=monthly
**دستیار:** فروشنده ضمانت پرداخت خواسته؟ چک تضمینی، ضامن، یا اسکرو (امانت‌گذاری اقساط تو سیستم ما)؟
**کاربر:** گفت چک خودش می‌خواد، ولی اسم اسکرو رو هم شنیده. فرقش چیه؟
**دستیار:** اسکرو یه سرویس پرداختی ماست: برنامه‌ی اقساط ثبت میشه و هر پرداخت قبل از رسیدن به فروشنده امانت می‌مونه — هزینه‌ش **۲۵ توکن**. ضمانت حقوقی چک رو جایش نمی‌گیره؛ یه ابزار شفافیت پرداخت هست. من توصیه نمی‌کنم کدوم؛ انتخاب با شما و فروشنده‌ست.
[decision point: scope guard on guarantee options]
**کاربر:** فعلاً چک کافیه، اسکرو نه.
**دستیار:** بدون هزینه‌ی اضافه. پیام تأخیر پرداخت چی درج بشه؟
**کاربر:** بنویس هر هفته تأخیر، مبلغ موردتوافق طرفین جریمه میشه — عدد قطعی نداریم.
**دستیار:** ثبت شد به همین صورت (بدون عدد، چون محاسبه‌گر عدد نامشخص رو قفل می‌کنه). خلاصه: ۳۵۰ پیش‌پرداخت + ۱۲ قسط = ۷۸۰ ✓، اولین قسط ۱۴۰۵/۰۴/۰۱. برنامه‌ی اقساط رایگانه؛ برای فروشنده بفرستید — فقط یادتون باشه صفحه‌ش مبلغ‌ها و مشخصات شماست، فقط برای خودش.

### Transcript 2 — incomplete/ambiguous
**کاربر:** قسطی می‌خوام خونه بخرم ولی فروشنده هنوز قیمت نهایی نگفته.
**دستیار:** برنامه‌ی اقساط به قیمت کل گره خورده — بدون `total_amount` سیستم نمی‌تونه برنامه ثبت کنه (اعتبارسنجی مالی قطعیه). تا قطعی شدن قیمت، می‌تونیم مسیر پیش‌نویس رو بریم: پیش‌پرداخت حدوداً چقدر حرفش هست؟
**کاربر:** حدود ۳۰۰، ولی قسط‌ها هم بلدم باشه.
**دستیار:** قسط‌ها رو «حدودی» ثبت نمی‌کنم — جمع اقساط باید دقیقاً با باقی‌مانده برابر بشه و عدد مبهم رد میشه. پیشنهاد: وقتی قیمت قطعی شد، دو تا عدد بفرستید (قیمت کل و پیش‌پرداخت)؛ تعداد قسط و مبالغ رو باهم حساب می‌کنیم.
**کاربر:** باشه، امشب ازش می‌پرسم.
**دستیار:** چیز دیگه‌ای تا اون موقع؟ می‌تونیم مشخصات طرفین و فاصله‌ی اقساط رو از الان بگیریم.
[decision point: parallel capture of non-financial fields while financial fields pending]

### Transcript 3 — preference change/correction
**کاربر:** فروشنده گفت ۱۲ قسط زیاده، حداکثر ۸ تا. ولی ماهی ۴۵ برام سنگینه.
**دستیار:** چک امکان‌سنجی: ۴۳۰ ÷ ۸ = ۵۳.۷۵ در ماه — از سقف توان‌تون (۳۸) بالاتره و سیستم این ترکیب رو به‌عنوان «برنامه‌ی فراتر از توان اعلامی» علامت می‌زنه. سه راه: پیش‌پرداخت بیشتر، تعداد قسط بیشتر (مثلاً ۱۴ تایی که ۳۰.۷ در میاد)، یا قسط‌های نامنظم.
**کاربر:** بذار ۱۴ قسط بشه.
**دستیار:** ۱۳ × ۳۰ + قسط آخر ۴۰ = ۴۳۰ ✓. آپدیت شد. اولین قسط همون اول تیر بمونه؟
**کاربر:** آره.
**دستیار:** ثبت نهایی شد. تأخیر پرداخت همون بند توافقی بمونه؟
**کاربر:** آره.
**دستیار:** تمام. لینک فقط برای فروشنده — اطلاعات حساس مالی داخلشه.

---

## P-SL — Payment × Seller (فروشنده اقساطی)
**Persona definition:** Mrs. Zarei, 55, selling her Tehranpars flat (900M) to a young couple; needs the money but agrees to 10 monthly installments; worried about default.
**Motivation:** Guaranteed cashflow; protection against missed payments; clear ownership-handover timing.
**Circumstances:** Buyer seems reliable but is a stranger; seller's main fear: «چک‌ش بپره چی کار کنم».
**Priorities:** (1) guarantee structure, (2) late-payment terms written precisely, (3) escrow option understood.
**Initial approach:** «فروش قسطی می‌خوام بکنم ولی نمی‌خوام ضرر کنم.»
**Questions to ask (5–8 adaptive):**
1. قیمت کل و پیش‌پرداخت؟ → `total_amount`, `down_payment`
2. چند قسط و فاصله‌شون؟ → `installment_count`, `installment_interval`
3. چه ضمانتی قبول می‌کنید؟ (چک تضمینی/ضامن/اسکرو) → `guarantee_type`
4. جریمه تأخیر عدد مشخصی می‌خواید؟ → `late_penalty_amount` (deterministic validation)
5. سند و تحویل به کدوم قسط گره بخوره؟ → `delivery_milestone`, `deed_milestone`
6. تسویه زودتر از موعد چطور بشه؟ → `early_settlement_note`
**Questions to avoid:**
- «به خریدار اعتماد دارید؟» — trust isn't our metric; offer instruments instead.
- Advice on enforcing cheques legally.
- «شاید بدهکار بشه بدهی‌اش چه میشه؟» beyond scope.
**Required info:** `total_amount`, `down_payment`, `installment_count`, `installment_amount`, `installment_interval`, `first_payment_date`, `guarantee_type`, both party identities
**Optional info:** `late_penalty_amount`, `delivery_milestone`, `deed_milestone`, `early_settlement_note`, `escrow_enabled`
**Conditional questions:** If `guarantee_type` unset after schedule → hold registration with warning: «برنامه بدون ضمانت ثبت میشه». If escrow chosen → 25-token confirmation + explanation that escrow doesn't replace legal guarantee.
**Alternative paths:** (a) Escrow-backed installments; (b) plain schedule + cheque note; (c) milestone-linked deed handover.
**Completion criteria:** Sum check exact; penalty amount validated (positive, ≤ 10% of installment recommended — warning above); escrow token confirmation if chosen; sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** سلام. آپارتمانمو ۹۰۰ فروختم، ۳۰۰ نقد گرفتم، ۶۰۰ قسطی می‌خوام بگیرم.
**دستیار:** خوش اومدید! ۶۰۰ باقی‌مانده رو چند قسط؟
**کاربر:** ده قسط ماهانه.
**دستیار:** ۶۰۰ ÷ ۱۰ = ۶۰ میلیون در ماه — اقساط مساوی دقیق میشه ✓. اولین قسط کی؟
**کاربر:** دو ماه دیگه، اول مرداد.
**دستیار:** ضمانت پرداخت چی تنظیم می‌کنید؟
**کاربر:** چک‌هاش رو می‌گیرم. ولی خیال راحت‌ترم میشه اگه پرداخت‌هاش تو سیستم ثبت بشه.
**دستیار:** دقیقاً برای این حالت اسکرو هست: هر قسط قبل از رسیدن به شما امانت می‌مونه و تأخیرها ثبت میشه. هزینه‌ش **۲۵ توکنه**، موجودی شما ۷۰ توکن. این سرویس جای ضمانت حقوقی چک رو نمی‌گیره — مکملش هست. فعال کنم؟
[decision point: TOKEN-COST CONFIRMATION + scope honesty about what escrow does/doesn't do]
**کاربر:** بله فعال کن.
**دستیار:** اسکرو فعال شد ✓. جریمه تأخیر عددی می‌خواید؟
**کاربر:** روزی ۲۰۰ هزار تومن.
[decision point: late_penalty validation — 200k/day ≈ 0.33% of 60M installment/month → within recommended band]
**دستیار:** ثبت شد: جریمه روزانه ۲۰۰ هزار تومن. سند و تحویل به کدوم قسط گره بخوره؟
**کاربر:** تحویل بعد از قسط چهارم، سند بعد از تسویه کامل.
**دستیار:** ثبت شد. خلاصه‌ی توافق پرداخت: ۳۰۰ نقد + ۱۰ × ۶۰ = ۹۰۰ ✓، اولین قسط ۱۴۰۵/۰۵/۰۱، اسکرو فعال، تحویل پس از قسط ۴، سند پس از تسویه. برای خریدار بفرستید — فقط خودش؛ مبلغ‌ها و ضمانت‌ها حساسن.

### Transcript 2 — incomplete/ambiguous
**کاربر:** می‌خوام قسطی بفروشم ولی هنوز مطمئن نیستم چند قسط قبول کنم.
**دستیار:** مشکلی نیست. اول مبنا رو بگیریم: قیمت کل و نقدی که می‌گیرید؟
**کاربر:** ۷۵۰ کل، نقدی هم گفتم «هرچی بتونه».
[decision point: undetermined down payment blocks sum validation]
**دستیار:** پیش‌پرداخت باید عدد قطعی باشه چون باقی‌مانده = کل − نقد، و جمع اقساط باید دقیقاً باقی‌مانده بشه. از خریدار عدد بگیرید می‌فرستید؟
**کاربر:** باشه. ولی جریمه تأخیر رو می‌خوام الان بچینم.
**دستیار:** جریمه قابل ثبت پیش از برنامه‌ی اقساطه؛ عدد روزانه یا ماهانه دارید؟
**کاربر:** «هرچی قانون میگه».
**دستیار:** من مشاور حقوقی نیستم و عدد قانونی پیشنهاد نمی‌دم؛ عددی که خودتون تعیین می‌کنید درج میشه و سیستم فقط سقف منطقی‌ش رو چک می‌کنه. وقتی عدد خواستید، همینجا ثبت می‌کنیم.
**کاربر:** اوکی.
**دستیار:** پس تا این لحظه چک‌لیست مانده: total_amount (قطعی)، down_payment، تعداد و مبالغ اقساط. برنامه بدون این‌ها ذخیره نمیشه ولی گفتگو و پیش‌محاسبه آزاده.
[decision point: nothing persisted as a financial record yet; no tokens spent]

### Transcript 3 — preference change/correction
**کاربر:** خریدار گفت قسط هفتم و هشتمش رو بذار سه ماه فاصله، چون عروسی داره.
**دستیار:** می‌شه؛ قسط‌های نامنظم رو سیستم ساپورت می‌کنه به شرطی که جمع دقیق بمونه: قسط‌های ۷ و ۸ رو یک‌ماهه جابه‌جا می‌کنم و جمع همچنان ۶۰۰ می‌مونه ✓. تأخیر اضافه جریمه نداره، درسته؟
**کاربر:** آره، توافق ردیفه.
**دستیار:** آپدیت شد؛ تقویم اقساط جدید برای خریدار ارسال‌پذیره. اسکرو همچنان فعاله و تاریخ‌های جدید رو می‌گیره. چیز دیگه‌ای؟
**کاربر:** نه.
**دستیار:** یادآوری نهایی: لینک توافق فقط برای خریدار — اطلاعات حساس.

---

## P-LL — Payment × Landlord (موجودی‌دار پرداخت اقساطی اجاره)
**Persona definition:** Mr. Bakhtiari, 49, landlord of a 85m² unit in Gohardasht, Karaj (rent 18M/month); tenant (a nurse) asked to pay this month's rent in 3 installments after a hospital pay delay.
**Motivation:** Help a good tenant without losing the rent record; keep ledger clean for future renewals.
**Circumstances:** One-off situation, not chronic; wants it documented so next months aren't disputed.
**Priorities:** (1) full rent received by a fixed date, (2) no precedent-creep (one-time agreement), (3) simple, fast.
**Initial approach:** «مستأجرم اجاره رو قسطی می‌خواد بده، ماهی ۱۸.»
**Questions to ask (5–8 adaptive):**
1. این توافق فقط برای این ماهه یا الگوی دائمی؟ → `agreement_scope`
2. چند قسط و مبالغ؟ → `installment_count`, `installment_amount`
3. تاریخ‌های دقیق پرداخت؟ → `first_payment_date` + schedule
4. اگر تأخیر شد، پیامدش؟ → `late_penalty_note`
5. ثبت در قرارداد به‌صورت الحاقیه یا رکورد مستقل؟ → `attachment_flag`
**Questions to avoid:**
- «چرا حقوقش دیر رسیده؟» — beyond relevance.
- Moralizing about tenant reliability.
- Setting a rent reduction as "compensation" — that's a contract amendment, not payment agreement.
**Required info:** `rent_amount` (base), `installment_count`, `installment_amount`, schedule dates, `agreement_scope`
**Optional info:** `late_penalty_note`, `attachment_flag`, `renewal_note`
**Conditional questions:** If scope=permanent → route to formal contract amendment (WF-C الحاقیه) with rahn/rent ratio re-check. If sum of installments ≠ rent → deterministic block with exact difference shown.
**Alternative paths:** (a) One-off payment agreement record (free); (b) الحاقیه via WF-C (40 tokens if drafted); (c) decline politely with neutral framing.
**Completion criteria:** Sum == rent exactly; dates ≥ today; scope explicit; sensitive-info warning; free registration.

### Transcript 1 — normal success
**کاربر:** سلام. مستأجرم می‌گه اجاره‌ی این ماه رو سه تا قسط بده، حقوقش دیر رسیده.
**دستیار:** سلام! این جور توافق‌های پرداخت رو دقیق ثبت می‌کنیم که برای هر دو طرف مکتوب باشه. فقط برای این ماهه یا قراره الگوی همیشگی بشه؟
**کاربر:** نه، فقط همین ماه.
→ field: agreement_scope=one_time
**دستیار:** چند قسط و هر کدوم چقدر؟ (اجاره‌ی ماهانه ۱۸ میلیون)
**کاربر:** سه تا، شیش‌تاشی.
**دستیار:** چک محاسباتی: ۳ × ۶ = ۱۸ ✓ دقیقاً برابر اجاره. تاریخ‌های پرداخت؟
**کاربر:** پنج‌شنبه، دوشنبه، و آخر ماه.
**دستیار:** سه تاریخ دقیق لازمه برای تقویم پرداخت — با فرمت تاریخ بگید: مثلاً ۲۱ و ۲۵ و ۳۰ خرداد.
**کاربر:** ۲۱، ۲۵، ۳۰ خرداد.
→ field: schedule=[1405/03/21, 1405/03/25, 1405/03/30]
**دستیار:** اگه قسطی عقب افتاد، چی درج بشه؟
**کاربر:** بنویس با هماهنگی طرفین.
**دستیار:** ثبت شد (بدون جریمه عددی). این توافق به‌صورت رکورد مستقل ثبت میشه و **رایگانه**؛ اگه بخواید به قرارداد اصلی ضمیمه هم بشه، می‌تونم الحاقیه‌ش کنم. ثبت کنم؟
**کاربر:** آره.
**دستیار:** ثبت شد. لینکش فقط برای مستأجر — مبلغ‌ها و تاریخ‌ها اطلاعات حساس مالی هستن. و نکته: چون یک‌بارمصرفه، ماه بعد اجاره مثل همیشه کامل سر موعد محاسبه میشه.

### Transcript 2 — incomplete/ambiguous
**کاربر:** مستأجرم قسطی می‌خواد بده، ثبتش کن.
**دستیار:** خوش اومدید! چند قسط و هر کدوم چقدر؟
**کاربر:** سه قسط.
**دستیار:** مبلغ هر قسط؟
**کاربر:** «هرچی بشه».
**دستیار:** بدون عدد، سیستم رکورد مالی نمی‌سازه — جمع اقساط باید دقیقاً برابر اجاره‌ی ماهانه بشه و این چک قطعیه. اجاره‌ی ماهانه‌شون چقدره؟
**کاربر:** ۱۵.
**دستیار:** پس سه قسط باید جمعش ۱۵ بشه؛ مثلاً ۵ و ۵ و ۵. خودتون عدد بدید.
**کاربر:** باشه، ۵تایی.
**دستیار:** ✓ ۳ × ۵ = ۱۵. تاریخ پرداخت‌ها؟
**کاربر:** تعطیلات بعدی‌ها یه چیزایی...
**دستیار:** تاریخ دقیق لازمه — تقویم پرداخت بدون تاریخ قابل ثبت نیست. از مستأجر بپرسید و سه تاریخ بفرستید.
**کاربر:** اوکی بعداً.
**دستیار:** چک‌لیست مانده: سه تاریخ پرداخت. رکورد تا اون موقع ساخته نمیشه و هزینه‌ای هم ندارید.
[decision point: sum-validated but date-incomplete → no record; checklist persisted]

### Transcript 3 — preference change/correction
**کاربر:** مستأجر گفت قسط دوم رو بذار اول شهریور، حقوقش باز دیره.
**دستیار:** یعنی فاصله‌ی قسط دوم تا سوم میشه دو ماه. اوکیه، ولی چون scope یکی «فقط این ماه» بود و قسط سوم به شهریور می‌خوره، scope رو به «توافق پرداخت تا ۱۴۰۵/۰۶/۳۰» گسترش بدم؟
**کاربر:** آره همون بهتره.
**دستیار:** آپدیت شد: تقویم ۲۱ خرداد / ۱۰ شهریور / ۳۰ شهریور، جمع ۱۸ ✓. تأیید نهایی شما لازمه چون رکورد قبلاً ثبت شده — تأیید؟
[decision point: post-registration edit requires explicit re-confirmation]
**کاربر:** تأیید.
**دستیار:** شد. لینک به‌روز فقط برای مستأجر.

---

## P-TN — Payment × Tenant (مستأجر درخواست اقساط اجاره)
**Persona definition:** Ms. Taheri, 27, freelance graphic designer; rent 22M/month in Saadat-Abad; income arrives irregularly and this month she needs the rent split in two.
**Motivation:** Get landlord's agreement without awkwardness; use Mahalino as neutral channel; preserve trust for renewal.
**Circumstances:** Good payment history; first time asking for flexibility; embarrassed to negotiate directly.
**Priorities:** (1) respectful framing, (2) schedule she can actually meet, (3) written record so it isn't held against her later.
**Initial approach:** «می‌خوام از صاحب‌خونه بخوام اجاره رو دوتا قسط بده، ولی نمی‌دونم چطور بگم.»
**Questions to ask (5–8 adaptive):**
1. اجاره‌ی ماهانه‌تون چقدره؟ → `rent_amount`
2. چند قسط می‌خواید؟ → `installment_count`
3. توان پرداخت هر قسط؟ → `installment_amount`
4. تاریخ‌های پیشنهادی؟ → schedule
5. مالک به قرارداد تو محلینو دسترسی داره؟ (درخواست از داخل چت قرارداد فرستاده بشه) → channel
6. این درخواست یک‌بارمصرفه یا الگوی درآمدتون دائماً نامنظمه؟ → `agreement_scope`
**Questions to avoid:**
- «چقدر درآمد داری؟» — only via installment-capacity framing.
- Judging the request («بهتره مال‌ات رو مدیریت کنی») — no personal finance advice.
- Promising the landlord will accept.
**Required info:** `rent_amount`, `installment_count`, `installment_amount`, schedule dates, `agreement_scope`
**Optional info:** `message_to_landlord` (neutral phrasing), `late_penalty_note`
**Conditional questions:** If sum ≠ rent → deterministic block with exact gap. If scope=permanent → suggest formal الحاقیه instead of one-off record. If landlord declines → neutral options: adjust amounts, different dates, or drop request (no pressure).
**Alternative paths:** (a) Request via shared contract thread; (b) one-off record; (c) الحاقیه drafting (40 tokens).
**Completion criteria:** Sum == rent; dates valid; landlord confirmation captured; free registration; sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** سلام. راستش رو بخواید از صاحب‌خونه خجالت می‌کشم... می‌خوام اجاره‌ی این ماه رو دوتا قسط بدم.
**دستیار:** اصلاً نگران نباشید؛ این درخواست‌ها خیلی معمولیه و ما فقط مکتوب و منصفش می‌کنیم. اجاره‌ی ماهانه‌تون چقدره؟
**کاربر:** ۲۲.
**دستیار:** دو قسط یعنی ۱۱ و ۱۱ — یا مبالغ متفاوت؟
**کاربر:** ۱۱تایی خوبه.
**دستیار:** ✓ ۲ × ۱۱ = ۲۲. تاریخ پیشنهادی پرداخت؟
**کاربر:** ده تیر و سی تیر.
**دستیار:** ثبتی. این درخواست رو می‌خواید مستقیم از چت قراردادتون به مالک بفرستم یا متنش رو اول خودتون ببینید؟
[decision point: neutral-channel vs preview — user control over communication]
**کاربر:** اول متنش رو نشونم بده.
**دستیار:** پیش‌نویس پیام: «سلام، درخواست پرداخت اجاره‌ی این ماه به‌صورت دو قسط ۱۱ میلیونی در تاریخ‌های ۱۰ و ۳۰ تیر. جزئیات و تأیید در لینک توافق پرداخت.» تأیید می‌کنید ارسال بشه؟
**کاربر:** بفرست.
**دستیار:** ارسال شد. تا مالک تأیید کنه، رکورد در وضعیت «در انتظار تأیید» می‌مونه و هیچ چیز قطعی نیست. اگه رد کرد هم مشکلی نیست — می‌تونیم مبالغ یا تاریخ‌ها رو عوض کنیم یا درخواست رو بدون رکورد رها کنیم.
**کاربر:** مرسی.
**دستیار:** فقط یادآوری: توافق پرداخت رایگانه و ثبتش هیچ هزینه‌ای نداره. لینکش هم اطلاعات حساس مالی داره — فقط بین شما و مالک.

### Transcript 2 — incomplete/ambiguous
**کاربر:** می‌خوام اجاره‌م قسطی بشه، اصلاً چه شکلیه این سرویس؟
**دستیار:** توافق پرداخت یعنی یه برنامه‌ی پرداخت مکتوب بین شما و مالک که تو سیستم ثبت و تأیید میشه. سه چیز لازمه: مبلغ اجاره، تعداد و مبلغ قسط‌ها، و تاریخ‌ها. اجاره‌تون چقدره؟
**کاربر:** نمی‌دونم دقیق... تو قراردادم هست ولی بازش نکردم.
**دستیار:** تو پروفایل شما یه قرارداد finalized فعاله: رهن ۲۰۰، اجاره ۲۵. همینه؟
**کاربر:** آره همونه.
**دستیار:** چند قسط مدنظرتونه؟
**کاربر:** چهار قسط؟ نمی‌دونم، هر چی زودتر اوکی بشه.
[decision point: indecision — agent proposes, user disposes]
**دستیار:** ۲۵ ÷ ۴ = ۶.۲۵ در ماه؛ یا ۳ قسط ≈ ۸.۳. کدوم برای پرداختتون راحت‌تره؟ عدد رو شما انتخاب کنید، من فقط چک می‌کنم.
**کاربر:** سه قسط بذاریم.
**دستیار:** ۳ × ۸.۳۳۳ گرد نمی‌شه مساوی؛ پیشنهاد دقیق: ۸ + ۸ + ۹ = ۲۵ ✓ یا ۸.۵ + ۸.۵ + ۸ = ۲۵ ✓. کدوم؟
**کاربر:** اولی.
**دستیار:** ثبت شد: ۸، ۸، ۹. حالا سه تاریخ پرداخت؟
**کاربر:** از مالک بپرس.
**دستیار:** تاریخ‌ها رو شما پیشنهاد بدید و مالک موقع تأیید می‌تونه تغییرش بده — این سریع‌ترین مسیره. مثلاً ۵، ۱۵، ۲۵ ماه جاری؟
**کاربر:** باشه همینا.
**دستیار:** درخواست آماده‌ی ارسال به مالک — تأیید ارسال؟
**کاربر:** آره.
[decision point: proposal sent; record pending landlord confirmation]

### Transcript 3 — preference change/correction
**کاربر:** مالک گفت اوکیه ولی قسط آخر رو نذار آخر ماه، بذار ۲۰.
**دستیار:** تقویم جدید: ۵، ۱۵، ۲۰ — مبالغ ثابت ۸ و ۸ و ۹، جمع ۲۵ ✓. تأیید می‌کنید؟
**کاربر:** آره.
**دستیار:** ثبت شد و وضعیت میره رو «توافق‌شده». یک نکته: چون این توافق یک‌بارمصرفه، ماه بعد اجاره طبق قرارداد اصلی محاسبه میشه. اگه خواستید پرداخت قسطی دائمی بشه، اون یه اصلاح قرارداده (الحاقیه) و ساختش ۴۰ توکن هزینه داره — فعلاً لازم نیست.
**کاربر:** فعلاً نه، مرسی.

---

## P-ES — Payment × User evaluating escrow (بررسی سرویس امانت‌گذاری)
**Persona definition:** Mr. Ravanbakhsh, 40, selling his car lot's adjacent property (1.2B) to a buyer he met through Mahalino; heard about escrow; skeptical and price-sensitive; wants to understand before paying anything.
**Motivation:** Reduce fraud risk on a big transaction; understand exactly what 25 tokens buys; compare with doing it manually.
**Circumstances:** First large deal via a digital platform; has heard scam stories from friends.
**Priorities:** (1) understanding mechanics before paying, (2) knowing limitations honestly, (3) low commitment to try.
**Initial approach:** «این اسکروی شما دقیقاً چیه؟ پولم دست کی می‌مونه؟»
**Questions to ask (5–8 adaptive):**
1. تراکنش‌تون چیه و چه مقدار؟ → context (type, total_amount)
2. نگرانی اصلی‌تون چیه — دریافت پول یا تحویل ملک؟ → escrow direction
3. می‌خواید فقط پرداخت اول رو امانت بذارید یا همه‌ی اقساط؟ → `escrow_scope`
4. طرف‌مقابل با اسکرو موافقه؟ → `counterparty_consent`
5. بعد از توضیح: فعال‌سازی انجام بشه؟ → 25-token confirmation
**Questions to avoid:**
- Overpromising («هیچ ریسکی نداره») — escrow is a transparency service, not a guarantee of performance.
- Pressure-selling after user hesitates.
- Explaining internal ledger architecture in user chat (confusing, unnecessary).
**Required info:** transaction context, `escrow_scope`, explicit 25-token confirmation, `counterparty_consent`
**Optional info:** `milestone_map` (which payments release which deliverables)
**Conditional questions:** If transaction is a rental deposit (رهن) → clarify escrow applies to payment agreements (WF-P), and rahn handover may be better handled in contract clauses. If counterparty consent missing → escrow can't activate; offer plain schedule instead.
**Alternative paths:** (a) Escrow on first payment only; (b) full-schedule escrow; (c) no escrow — plain documented schedule (free).
**Completion criteria:** User can articulate what escrow does/doesn't do (verification of understanding via confirmation step); token charged only after explicit yes; escrow enabled state reflected in agreement; sensitive-info warning.

### Transcript 1 — normal success
**کاربر:** سلام. شنیدم برای خریدوفروش امانت‌گذاری دارید. دقیقاً چیه؟
**دستیار:** سلام! اسکرو یعنی پرداخت‌های معامله‌تون طبق برنامه‌ی توافق‌شده ثبت میشه و هر پرداخت قبل از رسیدن به طرف‌مقابل، به‌صورت امانی در سیستم می‌مونه تا مرحله‌ش تأیید بشه — مثلاً پول قسط اول تا تأیید تحویل. یه سرویس شفافیت و ثبت هست، نه ضمانت حقوقی کامل.
**کاربر:** خب چه تضمینی داره طرف پول رو بگیره یا من ملک رو؟
**دستیار:** سؤال درستیه؛ صادقانه بگم: اسکرو جایگزین سند و ضمانت‌های قانونی نمیشه — تاریخ‌ها، مبالغ و وضعیت هر پرداخت رو قطعی و قابل استناد مکتوب می‌کنه. تراکنش شما چیه؟
**کاربر:** فروش یه ملک ۱.۲ میلیاردی، ۴۰۰ نقد، بقیه ۸ قسط.
**دستیار:** پس دو تا انتخاب دارید: اسکرو فقط روی پرداخت اول (۴۰۰)، یا روی کل برنامه‌ی اقساط. هزینه هر دو **۲۵ توکن** — یه‌بار فعال‌سازی.
[decision point: scope choice; single flat token cost]
**کاربر:** همه‌ی اقساط بهتره. طرف مقابل هم اوکیه؟ باید بپرسم.
**دستیار:** درست می‌گید — اسکرو بدون تأیید طرف‌مقابل فعال نمیشه. تا ایشون تأیید کنه، فعال‌سازی قفل می‌مونه.
**کاربر:** باشه، حرف می‌زنم باهاش.
**دستیار:** هر وقت هر دو تأیید کردید، همون‌جا با تأیید شما **۲۵ توکن** کسر میشه و فعال میشه — بدون اجازه‌ی شما هیچ هزینه‌ای برداشته نمیشه.
[decision point: deferred token confirmation at activation moment, not before consent]
**کاربر:** منطقیه. فعلاً همین قد.
**دستیار:** در خدمتم. یادآوری: هر لینک توافق پرداخت مبلغ‌های معامله‌ست؛ فقط بین شما و خریدار.

### Transcript 2 — incomplete/ambiguous
**کاربر:** اسکرو رو برای رهن مستأجرم می‌خوام بذارم.
**دستیار:** اسکرو برای «توافق‌های پرداخت اقساطی» طراحی شده — رهنِ یه قرارداد اجاره معمولاً یک‌جا تسویه میشه و تو بند ودیعه‌ی قرارداد ثبت میشه، نه به‌صورت قسط. رهن‌تون قسطی پرداخت میشه یا یک‌جا؟
**کاربر:** راستش نصفش رو دادم، نصفشو باید بعد تحویل بدم.
**دستیار:** این می‌تونه به‌صورت یه توافق پرداخت دو مرحله‌ای ثبت بشه و اسکروش فعال باشه: مرحله‌ی ۱ پرداخت‌شده، مرحله‌ی ۲ در انتظار تحویل. مبلغ هر مرحله؟
**کاربر:** ۳۵۰ و ۳۵۰.
**دستیار:** ✓ جمع ۷۰۰. موجر نقطه‌ی آزادسازی مرحله‌ی دوم رو تحویل ملک تعریف کنه؟
**کاربر:** آره ولی باید باهاش حرف بزنم.
**دستیار:** اوکی؛ فعال‌سازی اسکرو (۲۵ توکن) بعد از تأیید هر دو طرف انجام میشه. تا اون موقع هیچی قطعی و پرداختی نیست.
[decision point: escrow activation gated on counterparty consent — deterministic]

### Transcript 3 — preference change/correction
**کاربر:** خریدار نگذاشت اسکرو، می‌گه «چرا پولم تو سیستم شما بمونه». ولی من می‌خوام حداقل پرداخت اول امانی باشه.
**دستیار:** می‌شه اسکرو رو فقط برای پرداخت اول فعال کنیم و بقیه‌ی اقساط برنامه‌ی عادی باشه — این ترکیب رایجه. تأیید خریدار برای همین یه پرداخت هم لازمه، ولی بحثش کوچیک‌تره. امتحانش؟
**کاربر:** بله بذار همینو پیشنهاد بدم.
**دستیار:** درخواست ثبت شد. هر دو تأیید کردند؟ اگه آره، فعال‌سازی **۲۵ توکن** هزینه داره — تأیید نهایی شما؟
[decision point: TOKEN-COST CONFIRMATION at actual activation]
**کاربر:** هر دو اوکی دادن، تأیید.
**دستیار:** اسکرو روی پرداخت اول فعال شد ✓؛ پرداخت‌های ۲ به بعد برنامه‌ی عادی‌ان. لینک توافق فقط برای خریدار.

---

# SUMMARY — Cross-Persona Findings

## Key decision points (ranked by transcript frequency)
1. **Rahn/rent ratio override gate** — triggered in 5/17 personas; always deterministic, always requires explicit `override_confirmed`, warning recorded in contract.
2. **Token-cost confirmation moment** — 40 (contract draft), 30 (AI doc analysis), 25 (escrow); never batched silently (agent deals pay per-deal), always with balance shown.
3. **Sum-exactness gate for installments** — `Σ installments == remaining/total` blocks every incomplete attempt; rounding strategy offered as explicit choice, never auto-applied.
4. **Basic-vs-paid service disambiguation** — termination flow always states free basic registration before offering the 30-token analysis (T-LL, T-DG, T-DA, T-FI).
5. **Mutual-confirmation gates** — termination records and escrow activation are blocked until both parties explicitly confirm; post-confirmation edits require re-confirmation.
6. **Ambiguity handling** — «فکر کنم / احتمالاً / هرچی بشه» never accepted on financial fields; agent either disambiguates or parks the draft with a `missing_fields` checklist at zero cost.

## Notable rules surfaced by transcripts
- **Scope guard phrasing** converged to: «من مشاور حقوقی نیستم؛ این توضیحِ محتواست، نه توصیه» — used verbatim before clause explanations (T-DA, T-DG, C-NX) and before any شورای حل اختلاف mention (T-DG).
- **Sensitive-info warning** mandatory before every share-link action, phrased contextually (contract links, termination records, payment schedules).
- **Escrow honesty rule** (P-SL, P-ES): agent states explicitly that escrow «جای ضمانت حقوقی چک رو نمی‌گیره — مکملش هست»; overpromising is a persona failure mode.
- **Neutral dual-record** for disputes (T-DG): both claims recorded symmetrically with attachments; agent never writes verdict language, even when one side is obviously sympathetic.
- **Simulation mode** (T-FI): financial consequences computed without writing any contract state; every assumption labeled «فرض»; real numbers gated behind document analysis.
- **Progressive profiling payoff** (C-AG, C-SL): field corrections before finalization are free; template cloning requires explicit confirmation of every financial field per deal — silent clone blocked.
- **Communication control** (P-TN): user previews the message sent to counterparty before sending — trust-critical for embarrassed/novice users.

## Coverage matrix
| Workflow | Personas | Paid services exercised |
|---|---|---|
| C — Contract | C-LL, C-TN, C-BY, C-SL, C-AG, C-NX | 40-token draft generation (×6) |
| T — Termination | T-TN, T-LL, T-MU, T-DG, T-DA, T-FI | 30-token AI analysis (×3), free registration (×6) |
| P — Payment | P-BY, P-SL, P-LL, P-TN, P-ES | 25-token escrow (×2), free schedules (×4) |

Total: **17 personas**, 51 transcripts (success / incomplete / correction), all conforming to deterministic validation, progressive profiling, and scope-guard rules.

