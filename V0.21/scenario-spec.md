# Mahalino V0.21 — Conversational-First Scenario Specification
**Source app:** `Mahalino+V0.20.html` (single-file, Persian RTL, local/rule-based, no backend)
**Author:** Sub-Agent D (Scenario Design) · **Status:** implementation-ready spec · **Rule zero:** nothing existing is removed or degraded; page wizards remain the execution engines; the assistant becomes the primary interface on top of them.

---

## 1. Coverage Matrix (feature-preservation map)

Legend — **Chat access today:** `SCRIPTS.<id>` = in-chat scripted flow; `RINT.<intent>` = intent router; `page-only` = no conversational path. **V0.21:** what changes/adds.

| # | Existing capability (all preserved) | Chat access today (V0.20) | V0.21 adds/changes |
|---|---|---|---|
| 1 | **Rent wizard** — 8 steps (WSTEPS.rent: بودجه/اولویت‌ها/محله/بازار/ملک/بازدید/قرارداد/فسخ) | `SCRIPTS.rent` (dep→rentb→imps→beds→who→age→m2→floor→elev→park→extra→hoods→mk→list→day→time→visit→vform→vadd→ctr0 + termq→tpay chain); keywords in `ceSmart` («اجاره/رهن/بازدید») | Budget slider (S-CMP-01), confirmation panel before visit (S-CMP-02), interruption-safe numeric steps (S-CTX-01), correction jumps (S-CTX-02), multi-slot prefill via CTX (S-CTX-03), attachments on visit checklist (S-ATT-06) |
| 2 | **Rent visit checklist** (`defVlist` 8 items, `CBACT.vcT`, step vform/vadd) | in-chat cards (SCRIPTS.rent vform) | Attachment tie-in: photo attachment can mark «عکس از ایرادها» item — labeled «پیوست شد، تحلیل نشد» |
| 3 | **Rent termination flow** (termq/treason/tdate/tmin/totp/tai/tpay; `termTpl`, `ACT.tpay`) | in-chat (jump via «فسخ» keyword when `D.signed`); page step 8 | Unchanged + confirmation panel reuse before `ACT.tpay`; tai step keeps explicit «شبیه‌سازی» label even with real attached photos |
| 4 | **Buy wizard** — 8 steps incl. **legal report** (lgsc/lg, 100 tokens, LGD) and **staged escrow** (escA/escN/escP/escC, `ACT.besc`, escStages) | `SCRIPTS.buy`; keyword «خرید/مبایعه» | Budget slider on budg; summary+confirm panel before escrow release; PDF/DOC attachment hand-off to legal step (S-ATT-03) |
| 5 | **Contracts engine** (`conInit`, CON_STATUS, sign/approve flows, `ACT.cdoc`) | semi: chat `ctr0` opens the page form (`go('rent')` + `ceEnd`); `ceSmart` «قرارداد/کد رهگیری» → dash contracts tab | Confirmation/summary panel in chat before finalize (S-CMP-03 pattern); no engine changes |
| 6 | **Stay** — 4 steps (سفر/اقامتگاه/رزرو/ورود) + review (rev/revt) | `SCRIPTS.stay`; keywords «رزرو/اقامت/سفر» | Unchanged + city slot via CTX.city prefill; honest empty-result branch (S-FB-02) |
| 7 | **Mkt** — 4 steps (role/prj/bid+adj/send/st/trk) | `SCRIPTS.mkt`; keyword «پروژه» → page in `ceSmart` (but data-cf exists) | Keep both entries; guide intent already lists both; no change beyond interruption safety |
| 8 | **Build** — 3 steps (sup/ph/delivery, `ACT.pdone`) | `SCRIPTS.build` (guard: needs mkt confirmed/chosen); `ceSmart` «ساخت/مصالح» → page | Unchanged; mkt trk step already links `F:build` |
| 9 | **Invest rent (invr)** — 4 steps (props/cap/cmp/fund+pay/end; `sellTok`, `ACT.irdone`) | `SCRIPTS.invr` (uses scratch state via `wd`, not wf — preserve); keyword «سرمایه/درآمد» | Money slider reuse on cap/fund; unchanged otherwise |
| 10 | **Invest build (invb)** — prjs/scn/cap/yld/price/pay/trk; PPM live price (`ppmTick`) | `SCRIPTS.invb` (scratch; reachable from invest page, not sidebar) | Unchanged; documented in matrix so it is not accidentally "chat-ified" with a parallel engine |
| 11 | **GRT (اجاره تضمینی)** — intro page + **9-step wizard** (prop/cond/exp/elig/offer/tenant/contract/manage/return), owner+tenant panels, documents, inspections, damage, cycles | **page-only by design**: no `SCRIPTS.grt`; `ceStart('grt')`/`ceSmart` route to `v-grt` with toast; Q&A via `RINT.scGrtInfo`; progress via `RINT.scGuide('grt')` | Formalize **guided hand-off** (S-GRT-01): explain (`rcProg(WSTEPS.grt)`), collect intent/context in chat, navigate with `grtPrefill()` prefill, continue after return |
| 12 | **Services (svc)** — catalog (SVCS/svcCfg), quote→wallet pay, orders, timeline, receipts, refunds | **page-only**: `ceSmart` «خدمات/تعمیر/نظافت» → `go('svc')`; modal order form | Guided hand-off (S-SVC-01): category/item/date/address collected in chat → open prefilled order modal (extend `ACT.svcOpen` with prefill arg) |
| 13 | **Map + place registration** — Leaflet view, pins, `openPickMap`, `upsertPlace`, work/school places | partial: gate script steps work/school use `openPickMap` inside chat; «نقشه» keyword → page | Guided hand-off (S-MAP-01) for arbitrary place registration; gate steps unchanged |
| 14 | **Wallet / tokens** — spend/earn, packs (PACKS), `CBT.tok`, `ACT.wallet`, tokchip | `CBT.tok` («توکن»), «کیف پول», `!wl`, `F:sub/F:wallet` | Unchanged; token cost always disclosed in confirmation panels |
| 15 | **Requests follow-up** — S.reqs, addReq/setReq, dash req tab, `ACT.reqDetail`, `resumeChips` | `RINT.scContinue` («کجا بودم/ادامه») + ACT.resume | Keep; S-CONT-01 formalizes + adds «بازگشت» resume after interruption |
| 16 | **Multiple concurrent flows** — S.wfs, wfBar/wfManage, flowNew | page + `resumeChips` in chat | Chat scenario must never assume single flow; hand-off returns to `wf()` active flow |
| 17 | **Account tabs** — overview/wallet/plan/contracts/settings (ACC_TABS) | nav chips (`ACT.account data-tab`) | Unchanged; linked from OOS/fallback answers |
| 18 | **Subscription** — plan tab, packs | `F:sub` | Unchanged |
| 19 | **Persona context** — 'who' step, PERSONA_NOTE, CTX.persona prefill | SCRIPTS.rent 'who' + pre-hook | Unchanged; consumed by multi-requirement extractor (S-CTX-03) |
| 20 | **Market stats** — scMarket/scCompareAll, MARKET.asOf, kilid attribution, trendSeries | `RINT` market / امتیاز محله | Unchanged; distribution intent (توزیع آگهی‌ها) documented as expected chip target (rcDonut) — currently a chip label without dedicated handler → V0.21 adds `scDist` (B-group note) |
| 21 | **Comparisons** — scCompare, cmpHoodTable, cmpListModal | `RINT` «مقایسه/کدوم بهتر» | Unchanged |
| 22 | **Explanations** — scExplain (امتیاز تطبیق/فاصله هوایی/آگهی vs معامله/توکن تعرفه) | `RINT` «یعنی چی…» | Unchanged; attached to results as follow-up chips |
| 23 | **Auth** — APH phone/OTP/name, demo OTP 1234, 500-token gift | page (VIEWS.auth) + gate for !S.auth | Unchanged; chat before auth limited to gate/menu/map/راهنما (ctxSuggestions) |
| 24 | **Honesty layer** — SRC badges, MARKET.note, sample labels, simulated timers | everywhere | Extended to attachments (no OCR/AI claims) and slider/confirm panels |

**Guided hand-off pattern (for every page-only row above) — 4 steps, one code path:**
1. **Explain** — assistant renders `rcProg(WSTEPS.<m>, cur)` + `rcNote(guardOK(m))` so the user knows the page journey (reuse `RINT.scGuide` body).
2. **Collect** — chat asks only for context the page cannot guess cheaply (e.g. GRT: hood+area+expectation; SVC: category+item+date+address; MAP: place label+kind). Values are stored in a hand-off payload (extend `CTX.pending` pattern) AND mirrored into CTX slots where applicable (hood/city).
3. **Navigate with prefill** — `go(MODBY[m].v)` after writing payload where the page reads it: GRT via existing `grtPrefill()`; SVC via prefilled `svcOrderFormHTML(ci,ii,prefill)`; MAP via `openPlaceModal(prefilled)`/`openPickMap`. Never a bare redirect.
4. **Continue after return** — when the user re-opens the assistant, first bot message reads live state (`grtCur()`, `wf(m)`, `S.svcOrders[0]`) and offers: «تکمیل شد؟ ادامه در گفت‌وگو / مشاهدهٔ نتیجه». Page stays authoritative; chat never duplicates the wizard logic.

---

## 2. Scenario Specifications (32 scenarios)

Format per scenario — 12 fields: ID · Intent · Examples · Required info (CTX) · Steps · Branches · Expected responses (builders) · Components · State transitions · Errors/fallback · Completion · Tests.
All monetary inputs run through `parseMoneyFA` (toman×10, ambiguity guard), counts through `parseCountFA`, text through `normFa` (ي/ی ك/ک, Persian/Arabic digits, half-space). Honesty labels are mandatory wherever data is simulated.

---

### Group A — Core workflow scenarios (9)

---

#### S-RENT-01 — Start rent flow in chat (with context prefill)
1. **ID:** S-RENT-01
2. **Intent:** کاربر می‌خواهد فرایند اجارهٔ بلندمدت را در گفت‌وگو شروع کند.
3. **Examples:** «می‌خوام خونه اجاره کنم» / «اجاره یه آپارتمان دوخوابه می‌خوام» / «دنبال رهن و اجاره‌ام، شروع کن» / «یه apartment برای rent می‌خوام» (EN-mixed → needs S-CTX-04 lexicon) / «مى‌خواهم خانه‌ای اجاره كنم» (Arabic ك).
4. **Required info:** ودیعه (CTX.dep via D.B.depB)، اجاره (CTX.rent)، اولویت‌ها (D.P)، خواب (CTX.beds)، persona (CTX.persona)، محله (CTX.hood).
5. **Steps:** ① کاربر پیام می‌دهد → `ceSend` → chip/keyword match یا `ceSmart('اجاره')` → `botC('فلوی اجاره را شروع می‌کنم.')` + `ceStart('rent')` (wfNew اگر فلو نهایی/نexistent) → ② step `dep` (pre-hook: اگر CTX.dep → auto-fill + note «✓ ودیعه از گفت‌وگوی قبلی…») → ③ `rentb` → ④ `imps` loop (CHIP5) → ⑤ `beds`/`who`/`age`/`m2`/`floor`/`elev`/`park`/`extra` → ⑥ `hoods` (chatHoodCard×3) → ⑦ `mk` بازار → ⑧ `list` (chatListCard) → ⑨ `day`/`time`/`visit` (S-CMP-02) → ⑩ `vform`/`vadd` → ⑪ `ctr0` → page.
6. **Branches:** فلوهای هم‌زمان: اگر wfLive('rent')>1 → پیشنهاد wfManage قبل از شروع؛ CTX خالی → بدون prefill؛ !S.auth → gate اول؛ کاربر «تغییر اولویت‌ها» → ceJump('imps').
7. **Expected responses:** step `mk`: متن بازار با rial()/pct() و برچسب «بازهٔ نمایشی، برآورد است»؛ step `hoods`: کارت‌های chatHoodCard + chips مقایسه/همه/نقشه؛ `list`: شمارش «(۳ از ۷)» + کارت‌ها.
8. **Components:** CHIP5 chips، until-loop برای extra، پیشنهادها (ctxSuggestions)، V0.21: rcSlider روی dep/rentb، rcConfirm روی visit.
9. **State:** SCRIPTS.rent + CE={f:'rent'}؛ wfNew/wf('rent')؛ ctxFromStep بعد از هر set؛ نوار fchSum/landingSum/dashSum از flowSummaryText.
10. **Errors:** مبلغ مبهم (<۱ میلیون بدون ضریب) → پیام دقیق parseMoneyFA؛ خارج بازه ۱–۶۰ میلیارد ریال → st.err؛ ورودی غیرعددی در step عددی → پیشنهاد S-CTX-01 (interruption check) یا پیام خطای count.
11. **Completion:** ceEnd بعد از ctr0 (یا tpay در فسخ) با chip «ادامه در فلو (قدم‌به‌قدم)» = F:step:rent.
12. **Tests:** «اجاره می‌خوام» → botC شروع + سوال ودیعه | «ودیعه ۱۵ میلیارد» → ✓ + rial(15000000000) و رفتن به rentb | «۱۵۰ میلیون تومان» (toman) → ×۱۰ با note ✓ | «سه» به‌عنوان ودیعه → پیام ابهام parseMoneyFA (نه قبول بی‌پرسش).

---

#### S-BUY-01 — Start buy flow in chat
1. **ID:** S-BUY-01
2. **Intent:** شروع فلوی خرید با بودجه و بازه‌ها.
3. **Examples:** «می‌خوام خونه بخرم» / «خرید آپارتمان تو پونک، بودجه ۳۰ میلیارد تومان» / «دنبال خریدم، راهنمایی کن» / «mikham apartment bekharam».
4. **Required info:** بودجه (CTX.budg→D.budg، کف ۵۰ میلیارد ریال)، بازه‌ها D.PR (age/m2/ppm/floorR)، beds، feat، محله (CTX.hood).
5. **Steps:** ① keyword/chip → `ceStart('buy')` → ② `budg` (pre-hook CTX.budg؛ V0.21: rcSlider) → ③ `imps` → ④ بازه‌ها (`age/m2/ppm/floor` moneyRange/range) → ⑤ `beds/feat` → ⑥ `hoods` → ⑦ `mk` (affordSpan متراژ) → ⑧ `liq` (اختیاری؛ «رد کردن») → ⑨ `list` → ⑩ `lgsc/lg` (۱۰۰ توکن) → ⑪ `escA…escC` → ⑫ `ut` → ceEnd.
6. **Branches:** liq skip؛ پرداخت یکجا (escN/escP pre=false)؛ escrow کامل vs ناتمام (!ok → پیام «ابتدا توافق پرداخت را نهایی کنید»).
7. **Expected responses:** `mk`: میانگین آگهی هر متر + «با بودجهٔ شما حدود X تا Y متر»؛ `lg`: ✓ + LGD[lsel].est؛ `escC`: مرحله/درصد/rial؛ همه جداول از rcTable در مقایسه‌ها.
8. **Components:** chips بازه‌ای، parsePercentListFA برای escP، V0.21: rcSlider(budg) + rcConfirm قبل از ACT.besc.
9. **State:** SCRIPTS.buy؛ spend('legal')/addReq حقوقی؛ ACT.besc → D.escrow؛ guardOK برای page parity.
10. **Errors:** بودجه <۵۰ میلیارد ریال → ERR؛ درصدها جمع ≠۱۰۰ → ERR با مثال؛ توکن ناکافی spend → مودال شارژ (رفتار موجود حفظ شود).
11. **Completion:** `ut` ثبت ۴ انشعاب → done + addReq «تحویل» → ceEnd.
12. **Tests:** «خرید می‌خوام با ۳۰ میلیارد» → سوال اول بودجه با مقدار پیش‌پر نشده (چون پیام مستقیم start است؛ مقدار در CTX فقط از afford/save می‌آید — مستقیم هم V0.21 استخراج می‌کند، بنگر S-CTX-03) | «۳۰ میلیارد تومان» → ۳۰۰ میلیارد ریال ✓ | «45-60» برای m2 → D.PR.m2=[45,60] | «20-30-40-10» → pcts OK | «20-30-60» → ERR جمع ۱۰۰.

---

#### S-STAY-01 — Stay booking in chat
1. **ID:** S-STAY-01
2. **Intent:** رزرو اقامتگاه کوتاه‌مدت.
3. **Examples:** «آخر هفته می‌خوایم بریم رامسر، ۴ نفر» / «اقامتگاه تو شیراز می‌خوام» / «رزرو سوئیت برای سفر» / «تهران، ۲ نفر، هفتهٔ بعد».
4. **Required info:** شهر (CTX.city→D.city)، تاریخ متنی (D.date)، نفرات (D.ppl)، اقامتگاه (D.stay)، شب‌ها (D.nights).
5. **Steps:** ① «رزرو/اقامت/سفر» یا chip → `ceStart('stay')` → ② `city` → ③ `date` → ④ `ppl` → ⑤ `list` (chatStayCardها + ☆) → ⑥ `ngt` → ⑦ `book` (۳۰ توکن، کد ۴ رقمی، تأیید شبیه‌سازی میزبان بعد ۲s) → ⑧ `chk` ورود با کد → ⑨ `rev/revt` نظر.
6. **Branches:** شهر بدون اقامتگاه → S-FB-02؛ نشان‌شده‌ها (!saved)؛ همهٔ شهرها (!all)؛ فاصله‌ها (!dist) اگر place دارید.
7. **Expected responses:** `book`: rial(nights×p) bold + «(۳۰ توکن)»؛ `chk`: کد + «فعال از ۱۴:۰۰».
8. **Components:** chips شهر/تاریخ، ☆ savS، V0.21: rcConfirm قبل از spend('stay').
9. **State:** SCRIPTS.stay؛ spend/addReq/setReq('تأیید شد') با timer؛ done در chk.
10. **Errors:** شهر خالی → ERR متن؛ انتخاب بدون stay → «اول یک اقامتگاه…» (acts.nx موجود).
11. **Completion:** revt ثبت نظر → S.reviews.unshift؛ فلوی done.
12. **Tests:** «رامسر ۴ نفر» بعد از شروع → ppl=4 | «۳ شب» → nights=3 | «اقامتگاه ساحلی نور» بدون تطابق → err یا بهترین کارت‌ها | «رزرو کن» بدون انتخاب → پیام انتخاب اول.

---

#### S-INV-01 — Rental-income investment (invr) in chat
1. **ID:** S-INV-01
2. **Intent:** خرید توکن صندوق درآمد اجاره.
3. **Examples:** «سرمایه‌م رو بذارم تو درآمد اجاره؟» / «۲ میلیارد توکن صندوق بخر» / «درآمد ماهانه از اجاره می‌خوام».
4. **Required info:** سرمایه (D.cap)، مبلغ خرید (D.amt)، نرخ مقایسه S.ui.navg.
5. **Steps:** ① «سرمایه/درآمد» → ceStart('invr') → ② `props` کارت‌های RPROPS → ③ `cap` (money) → ④ `cmp` finChatHTML (مقایسه با بانک) → ⑤ `fund` (ارزش توکن ۱۳.۲م ریال؛ chips همهٔ سرمایه) → ⑥ `pay` openGateway + ۰٫۵٪ → ⑦ `end` درآمد ماهانه rial(cnt×54000) → فروش/نگه‌داشتن (sellTok).
6. **Branches:** مبلغ <۱ توکن → «مبلغ برای ۱ توکن کافی نیست»؛ فروش همه/نصف/نگه‌داشتن؛ done وقتی cnt<1.
7. **Expected responses:** `cmp`: finChatHTML؛ `pay`: تعداد توکن bold؛ `end`: درآمد ماهانه bold.
8. **Components:** chips مبالغ، V0.21: rcSlider روی cap/fund.
9. **State:** SCRIPTS.invr روی scratch (wd بدون MODBY) — همین بماند؛ walletIn در فروش.
10. **Errors:** پرداخت لغو → همان step می‌ماند؛ مبلغ نامعتبر → ERR.
11. **Completion:** `e` → ACT.irdone + ceEnd؛ یا فروش همه → CE.f=null + پیام کیف پول.
12. **Tests:** «۲۰ میلیارد» → cap | «همهٔ سرمایه» chip → amt=cap | «فروش نصف» → walletIn نصف با ۰٫۵٪ | «۵۰۰ میلیون» برای fund → ۳۷ توکن (Math.floor).

---

#### S-MKT-01 — Marketplace role flow (mkt) with build chain
1. **ID:** S-MKT-01
2. **Intent:** ورود به‌عنوان پیمانکار (پیشنهاد) یا کارفرما (تأیید)، سپس گردش کار ساخت.
3. **Examples:** «می‌خوام روی پروژه‌ها پیشنهاد بدم» / «پیمانکارم، پروژه می‌خوام» / «کارفرما هستم، پیشنهادات رو ببینم» / «برج ارغوان» (نام پروژه).
4. **Required info:** نقش (D.role)، پروژه (D.prjI)، مبلغ (D.bidAmt)، تعدیل (D.adj)؛ برای build: سفارش SUPS و ph.
5. **Steps:** ① chip/data-cf mkt یا ceSmart «پروژه» → ② `role` → ③ `prj` کارت‌ها (bidPr/viewBids/pinfoPr/detPr؛ !np ثبت پروژهٔ جدید ACT.nprj) → ④ con: `bid/adj/send` (۲۰ توکن؛ تأیید شبیه‌سازی کارفرما ۳s) → ⑤ `st` وضعیت → ⑥ `trk` گردش کار (به build وصل: «برو به ساخت و تأمین» F:build) → build: `sup` (گارد: mkt confirmed) → `ph` (+۱۰٪/همه) → ACT.pdone.
6. **Branches:** emp مسیر: بدون bid/adj/send؛ chosen از viewBids؛ گارد build بدون پروژه → پیام + chip F:mkt.
7. **Expected responses:** `send`: rial + تعدیل + «(۲۰ توکن)»؛ `trk`: چک‌لیست ✓/— + faI پیشرفت؛ detPr: جزئیات کامل پروژه.
8. **Components:** کارت‌های پروژه CBACT، chips نقش، ثبت پروژهٔ جدید مودال.
9. **State:** SCRIPTS.mkt + SCRIPTS.build روی wfهای مستقل؛ addReq پیشنهاد/تأیید؛ spend('bid').
10. **Errors:** نام پروژه ناهمخوان → projectIndexFromText<0 → ERR «نام پروژه را دقیق بگویید»؛ بدون bid در st → «ابتدا پیشنهاد ثبت کنید».
11. **Completion:** mkt `!end` یا build pdone → ceEnd هرکدام.
12. **Tests:** «پیمانکار» → role=con | «۸ میلیارد» → bidAmt | «نرخ رسمی» chip → adj=full | «برج ارغوان» → prjIx تطبیق | ورود به build بدون پروژه → گارد + chip بازگشت.

---

#### S-GRT-01 — GRT guided hand-off (page-only 9-step wizard)
1. **ID:** S-GRT-01
2. **Intent:** واگذاری مدیریت اجاره (اجارهٔ تضمینی) — توضیح، شروع و همراهی؛ ویزارد کامل صفحه‌ای است.
3. **Examples:** «اجاره تضمینی چیه؟» / «می‌خوام ملکم رو بسهپارم به محلینو» / «ملک دارم، اجارهٔ تضمینی شروع کن» / «تفاوت اجاره تضمینی با معمولی؟».
4. **Required info (chat-collected):** محله (CTX.hood)، متراژ، انتظار اجاره؛ بقیه در صفحه (اسناد، بازرسی، مستأجر).
5. **Steps:** ① «تضمینی» → ceSmart/scGrtInfo → توضیح با rcProg(WSTEPS.grt,0) + لیست GRT_INCLUDED + کارمزد ۷٪ + rcTable تفاوت‌ها (اگر «تفاوت») → ② chip «شروع در صفحهٔ اختصاصی» → اگر کاربر محله/متراژ نگفته: دو سوال کوتاه chat → ذخیره در payload → ③ `go('grt')` با پیش‌پر `grtPrefill()` (الگوی موجود: «اطلاعات ملک از فلوی اجاره قابل بازیابی است») → ④ بازگشت کاربر به دستیار → پیام خوش‌آمد بازگشتی: خواندن grtCur() → «پروندهٔ شما مرحلهٔ X است» + rcProg + chips ادامه صفحه/درخواست‌ها/نمای مستأجر.
6. **Branches:** کاربر مستأجر است → ارجاع به نمای مستأجر (grtRole tenant)؛ پرسش حقوقی (تضمین تا چند ماه؟) → پاسخ متنی از grtOfferOf یا برچسب «در قرارداد مدیریت»؛ بدون auth → gate.
7. **Expected responses:** rcTable تفاوت، rcProg ۹ مرحله، rcNote کارمزد/سلب مسئولیت، کارت وضعیت بازگشت با rcard.
8. **Components:** chips داده‌ای، بدون مؤلفهٔ صفحه‌ای تکراری — قانون: هیچ فرم GRتی در chat بازسازی نمی‌شود.
9. **State:** CTX.hood آپدیت؛ S.grt از طریق صفحه؛ ADDReq های grt دست‌نخورده.
10. **Errors:** ورودی عددی مبهم → همان پیام‌های پارسر؛ بازگشت بدون ثبت ملک → «پرونده‌ای ثبت نشده؛ دوباره از صفحه شروع کنید».
11. **Completion:** تعریف می‌شود توسط صفحه (بستن پرونده/تسویه)؛ chat فقط پیام پایان با rcProg کامل ✓.
12. **Tests:** «اجاره تضمینی یعنی چی» → توضیح + rcProg | «شروع کن با سعادت‌آباد ۷۵ متر» → payload + go('grt') با prefill | بازگشت → کارت وضعیت grtCur | «کارمزد چنده؟» → ۷٪ + rcNote.

---

#### S-SVC-01 — Services guided hand-off (catalog/order)
1. **ID:** S-SVC-01
2. **Intent:** سفارش خدمات ملک (نظافت/تعمیر/…) و پیگیری.
3. **Examples:** «نظافتر بیارید خونه» / «کولر گازی تعمیر می‌خواد» / «خدمات نظافت سفارش بدم» / «سفارش‌های خدمتم چیه؟».
4. **Required info:** دسته/آیتم (ci,ii)، تاریخ، بازهٔ ساعتی، نشانی، تعداد؛ پرداخت از کیف پول.
5. **Steps:** ① «خدمات/تعمیر/نظافت» → ceSmart → `go('svc')` (امروز) — V0.21: پاسخ گفت‌وگویی: کارت دسته‌های SVCS (rcActs با آیتم‌های پرتکرار) → ② انتخاب آیتم → ۲–۳ سوال chat (تاریخ/بازه/نشانی؛ تعداد اگر unit≠fixed با گارد min) → ③ باز کردن مودال سفارش **پیش‌پر** (`ACT.svcOpen` امضاگرفته prefill؛ svcQuote داخل مودال همان‌طور) → ④ پرداخت/پیگیری در صفحه؛ ⑤ «سفارش‌های خدمتم» → خلاصهٔ S.svcOrders با svcStatusBadge متن معادل در chat + chip «پیگیری سفارش» (svcReqOpen).
6. **Branches:** کیف پول ناکافی → مودال موجود svcGoWallet؛ کاتالوگ API تنظیم نشده → برچسب «نمایشی» svcIsDemo باید در chat هم بیاید؛ خطای quote → «دریافت قیمت ممکن نشد…».
7. **Expected responses:** فهرست دسته‌ها با ico(svc)؛ خلاصهٔ سفارش با rial(amount) + rcNote نمایشی/واقعی.
8. **Components:** rcActs، chips تاریخ؛ مودال سفارش (page engine).
9. **State:** S.svcOrders/wallet/wlog/svcAudit فقط از مسیر موجود svcPayOrder — chat هرگز سفارش مستقل ثبت نمی‌کند.
10. **Errors:** مقدار < min → «حداقل متراژ/ساعت X»؛ تغییر فرم پس از quote → پیام موجود «قیمت را دوباره دریافت کنید».
11. **Completion:** openSvcOrderDetail باز می‌شود؛ chat پیام تأیید + کد SO-….
12. **Tests:** «نظافت» → کارت دسته‌ها | «پاکسازی مبل، جمعه ۱۰ صبح، ولنجک» → مودال پیش‌پر | «سفارش‌هام» → خلاصه با وضعیت | بدون موجودی → مودال کیف پول.

---

#### S-MAP-01 — Map & place-registration hand-off
1. **ID:** S-MAP-01
2. **Intent:** دیدن نقشه / ثبت محل کار، مدرسه یا مکان مهم.
3. **Examples:** «نقشه رو باز کن» / «محل کارم رو ثبت کنم» / «مدرسه بچه‌م تو نقشه علامت بزن» / «فاصله‌ها رو نشون بده».
4. **Required info:** نوع مکان (work/school/other)، برچسب، موقعیت (ll یا hood).
5. **Steps:** ① «نقشه» → `go('map')` (سریع، بدون گفت‌وگوی اضافی) — ② ثبت: از gate script steps work/school با openPickMap داخل chat (موجود، حفظ) یا V0.21 پیام آزاد «محل کارم رو ثبت کن» → تشخیص intent → اگر نام محله در پیام (hoodFromText) → upsertPlace مستقیم + پیام «فاصله‌های املاک به‌روز شد»؛ وگرنه openPickMap(title,cb) همان مودال → ③ «فاصله‌ها» → اگر فلو فعال و listing انتخاب شده → placesHTML مثل acts.dist؛ وگرنه دعوت به انتخاب.
6. **Branches:** Leaflet در دسترس نیست → openPickMap حالت فهرست محله‌ها (موجود)؛ کاربر مکان دلخواه (kind دیگر) → openPlaceModal پیش‌پر.
7. **Expected responses:** تأیید ثبت + toast؛ placesHTML با placeDistText؛ rcNote منبع OSM (فاصلهٔ هوایی).
8. **Components:** openPickMap مودال؛ chips محله.
9. **State:** S.prof.places/upsertPlace؛ MT toggles دست‌نخورده.
10. **Errors:** بدون نقطه → «یک نقطه یا محله انتخاب کنید» (موجود).
11. **Completion:** ثبت ll → cb اجرا → پیام موفق.
12. **Tests:** «نقشه» → go('map') | «محل کارم سعادت‌آباده» → upsertPlace بدون مودال | «مدرسه رو نقشه انتخاب می‌کنم» → openPickMap | «فاصله‌ها» بدون ملک → دعوت به انتخاب.

---

#### S-CONT-01 — Continue / resume unfinished work
1. **ID:** S-CONT-01
2. **Intent:** ادامهٔ فلوی نیمه‌تمام یا یافتن «کجا بودم».
3. **Examples:** «کجا بودم؟» / «کارهای نیمه‌تمامم» / «از سر بگیر» / «ادامهٔ فلوی اجاره» / «resume».
4. **Required info:** — (از S.wfs خوانده می‌شود).
5. **Steps:** ① پیام → RINT.scContinue → ② اگر wfRunning خالی → «فعلاً فلو… ندارید» + topicsHTML؛ وگرنه کارت‌های rcard full با wfName/wfState/rcProg(steps, step-1) → ③ chip «ادامه» → ACT.resume (صفحه) یا «ادامه در گفت‌وگو» → ceStart(m) + wfSet فعال — V0.21: chip دوم «ادامه در گفت‌وگو» برای SCRIPTS‌دارها اضافه شود (امروز فقط F:step در ceEnd هست).
6. **Branches:** چند فلو در یک ماژول → wfBar/wfManage ارجاع؛ فلو در گارد (مثلاً rent step3 بدون hood) → rcNote(guardOK) قبل از ادامه.
7. **Expected responses:** rcards با rcProg؛ درخواست‌های باز هر فلو (reqsOfWf).
8. **Components:** data-act="resume"؛ V0.21 data-cf هوشمند.
9. **State:** wfSet/wfRebind (بازنشانی CE برای ماژول) — حفظ رفتار فعلی.
10. **Errors:** فلو لغوشده در لیست نمی‌آید (wfRunning)؛ done → فقط شمارش wfDoneCount در greet.
11. **Completion:** انتخاب مسیر ادامه.
12. **Tests:** بدون فلو → پیام خالی + topics | با rent step4 → کارت با rcProg(8,3) | «ادامه» → صفحهٔ فلو | بعد از interruption (S-CTX-01) همین مسیر «بازگشت» را می‌دهد.

---

### Group B — Market & analysis scenarios (6)

---

#### S-ANALY-01 — Market info for a hood (sale or rent mode)
1. **ID:** S-ANALY-01
2. **Intent:** وضعیت بازار/قیمت یک محله.
3. **Examples:** «بازار سعادت‌آباد چنده؟» / «قیمت‌های پونک رو نشون بده» / «بازار اجارهٔ نارمک» / «میانگین قیمت هر متر تو سعادت آباد» (بدون نیم‌فاصله) / «نرخ‌ها تو پونک؟».
4. **Required info:** محله (hoodsIn یا CTX.hood یا wfData); CTX.pending='market' اگر غایب.
5. **Steps:** ① ceSend → چون فلو فعال نیست/متن آزاد → RINT.route → market → ② hoodsIn: ۲+ محله → scCompare؛ ۰ → CTX.hood؟ → rThink(700ms) «در حال مرور دادهٔ بازار…» → ③ حالت اجاره: rcards(اجاره/ودیعه) + rcBars همهٔ محله‌ها؛ حالت فروش: rcards(میانگین/بازه/تغییر سال/ماه) + rcLine(trendSeries ۱۲ماهه) + rcBars مقایسه + rcActs.
6. **Branches:** بدون محله → سوال «کدام محله؟» + hoodChipsAct؛ «همهٔ محله‌ها» → scCompareAll؛ «امتیاز محله‌ها» → scScores.
7. **Expected responses:** builders بالا + rcNote «قیمت پیشنهادی آگهی‌اند نه معامله؛ منبع: کیلید» + تاریخ MARKET.asOf.
8. **Components:** rcTable مرتب‌شدنی در scCompareAll (CBACT.sortTbl).
9. **State:** CTX.hood/lastIntent='market'.
10. **Errors:** نام ناشناخته → سوال محله؛ پارسی‌سازی عدد لازم نیست اینجا.
11. **Completion:** نمایش پاسخ + chips اقدام (شروع فلو/مقایسه/توزیع).
12. **Tests:** «بازار سعادت‌آباد» → rcLine+rcBars | «بازار اجاره سعادت‌آباد» → rcBars اجاره | «بازار زعفرانیه» (ناموجود) → سوال محله | «بازار» فقط → CTX.hood یا سوال.

---

#### S-ANALY-02 — Compare two hoods
1. **ID:** S-ANALY-02
2. **Intent:** مقایسهٔ دو محله با معیارهای عینی.
3. **Examples:** «مقایسه سعادت‌آباد و پونک» / «کدوم بهتره، نارمک یا پونک؟» / «پونک در مقابل سعادت آباد» / «compare Ponak va Narmak».
4. **Required info:** دو محله (hoodsIn×2 + CTX.hood تکمیل‌کننده).
5. **Steps:** ① route compare → ② <2 محله → راهنما «دو محله را نام ببرید» + chips → ③ rThink → rcTable هفت‌ستونه (محله/هر متر/بازه/مترو/مدرسه/پارک/اجاره) + rcBars + fit-note بر پایهٔ CTX.budg یا CTX.rent.
6. **Branches:** CTX.budg موجود → متراژ تقریبی هرکدام؛ CTX.rent موجود → مقایسهٔ اجارهٔ نمونه؛ نام تکراری → dedupe (موجود).
7. **Expected responses:** rcTable با مرتب‌سازی + rcNote منبع کیلید/OSM.
8. **Components:** sortTbl روی عنوان ستون.
9. **State:** CTX.hood=اولین؛ lastIntent='compare'.
10. **Errors:** فقط یک نام → درخواست دومی.
11. **Completion:** جدول + rcActs (بازار هرکدام/شروع خرید).
12. **Tests:** «مقایسه پونک و نارمک» → جدول | «کدوم بهتره سعادت‌آباد یا پونک» → همان | بعد از afford با CTX.budg → fit-note متراژ | یک محله → درخواست دوم.

---

#### S-ANALY-03 — Purchase affordability
1. **ID:** S-ANALY-03
2. **Intent:** «با X پول کجا/چند متر می‌توانم بخرم؟»
3. **Examples:** «با ۳ میلیارد کجا می‌تونم بخرم؟» / «با ۳۰ میلیارد تومان چقدر خونه می‌شه گرفت؟» / «توان خریدم چقدره؟ ۵ میلیارد دارم».
4. **Required info:** مبلغ (RINT.moneyOf + parseMoneyFA) → CTX.budg.
5. **Steps:** ① route afford (نیازمند رقم+ضریب) → ② parse شکست → پیام pm.msg + مثال → ③ rThink → rcBars متراژ هر محله (مرتب) + rcard بیشترین متراژ + rcNote «آگهی نه معامله… بودجه ذخیره شد» → ④ chip «شروع فلوی خرید با همین بودجه» → ceStart('buy') با pre-hook CTX.budg.
6. **Branches:** بودجه زیر کف همهٔ محله‌ها → همچنان نمودار + note؛ تومان → ×۱۰.
7. **Expected responses:** rcBars + rcard + rcActs.
8. **Components:** — (نموداری).
9. **State:** CTX.budg/lastIntent='afford' → مصرف توسط S-BUY-01 pre-hook.
10. **Errors:** مبلغ بدون ضریب کوچک → پیام ابهام؛ بدون رقم → راهنما با مثال.
11. **Completion:** پاسخ + انتقال اختیاری به فلو.
12. **Tests:** «با ۳ میلیارد کجا بخرم؟» → bars | «۳۰ میلیارد تومان» → ×۱۰ در CTX.budg | «پولم کافیه؟» بدون عدد → راهنما | بعدش «خرید» → pre-fill بودجه ✓.

---

#### S-ANALY-04 — Rent affordability (deposit→rent conversion)
1. **ID:** S-ANALY-04
2. **Intent:** «رهن کامل، اجاره چقدر می‌شود؟»
3. **Examples:** «رهن ۱۰ میلیارد، اجاره چقدر می‌شه؟» / «با ودیعهٔ ۲۰ میلیارد چقدر اجاره می‌خوره؟» / «۱۵ میلیارد رهن کامل می‌ذارم».
4. **Required info:** ودیعه → CTX.dep؛ نرخ فرضی ۳٪/ماه (داخلی).
5. **Steps:** ① route rentAfford (رقم + رهن/ودیعه + کلمهٔ اجاره) → ② rThink → rent=dep×0.03 bold + rcBars اجارهٔ محله‌ها با hi برای بالای سقف + rcNote «این نرخ بازار نیست؛ مبنای مقایسهٔ داخلی…» → ③ chip «شروع فلوی اجاره با همین ودیعه» → pre-hook dep.
6. **Branches:** تومان؛ مبلغ غیرقابل‌پارس.
7. **Expected responses:** rcard اجارهٔ متناظر + rcBars.
8. **Components:** —.
9. **State:** CTX.dep/lastIntent='rentafford'.
10. **Errors:** پیام pares؛ صریح: هرگز نرخ واقعی ادعا نشود.
11. **Completion:** پاسخ + انتقال اختیاری.
12. **Tests:** «رهن ۱۰ میلیارد اجاره چقدر» → ۳۰۰م ریال | «۲۰ میلیارد تومان» → ×۱۰ | «رهن کافیه؟» → راهنما | بعدش «اجاره» → dep prefill ✓.

---

#### S-ANALY-05 — Hood match scores for me
1. **ID:** S-ANALY-05
2. **Intent:** رتبه‌بندی محله‌ها بر اساس اولویت‌های من.
3. **Examples:** «امتیاز محله‌ها» / «برای من کدوم محله بهتره؟» / «امتیاز محله برای شرایط من».
4. **Required info:** P از ctxP() (فلو rent یا defP).
5. **Steps:** ① route market+«امتیاز محله» → scScores → ② rThink → rcBars امتیاز تطبیق همهٔ محله‌ها (cur برای CTX.hood) + rcNote «کیفیت کلی محله نیست…» + rcActs بازار برتر/شروع اجاره.
6. **Branches:** P شخصی‌سازی‌شده اگر فلو rent داده دارد؛ پیش‌فرض defP.
7. **Expected responses:** rcBars + rcNote.
8. **Components:** —.
9. **State:** خواندن wfData('rent').P.
10. **Errors:** — (همیشه defP هست).
11. **Completion:** نمایش + اقدام.
12. **Tests:** «امتیاز محله‌ها» → bars مرتب | بعد از تنظیم imps در فلو → ترتیب عوض می‌شود | chip «بازار …» → S-ANALY-01.

---

#### S-ANALY-06 — Explain a result/concept
1. **ID:** S-ANALY-06
2. **Intent:** توضیح شفافیت روش/منبع.
3. **Examples:** «امتیاز تطبیق یعنی چی؟» / «فاصله‌ها بر اساس چیه؟ هوایی‌ه؟» / «قیمت‌ها معامله‌ست یا آگهی؟» / «چرا این محله امتیازش بالاتره؟» / «توکن چیه و کجا مصرف می‌شه؟».
4. **Required info:** —.
5. **Steps:** ① route explain → scExplain: امتیاز → rcards عوامل (factorData) + rcNote؛ فاصله → rcNote OSM هوایی؛ آگهی/معامله → rcNote کیلید؛ توکن → rcTable COSTS/COSTL + rcActs اشتراک.
6. **Branches:** توکن تنها (بدون «یعنی») → CBT.tok موجود (موجودی) — این تمایز حفظ شود؛ توضیح توکن با قید «یعنی/کجا» → جدول تعرفه.
7. **Expected responses:** rcTable/rcards/rcNote.
8. **Components:** sortTbl روی جدول تعرفه.
9. **State:** —.
10. **Errors:** مفهوم ناشناخته → fallback S-FB-01.
11. **Completion:** پاسخ + بازگشت به مسیر قبلی (اگر CE.f → chip «بازگشت به فلو» V0.21 !re).
12. **Tests:** «امتیاز تطبیق یعنی چی» → عوامل | «توکن» → موجودی | «توکن یعنی چی» → جدول تعرفه | «فاصله هواییه؟» → rcNote OSM.

---

### Group C — Context & interruption scenarios (5)

---

#### S-CTX-01 — Mid-flow interruption + return
1. **ID:** S-CTX-01
2. **Intent:** کاربر وسط فلو، سوال نامرتبط می‌پرسد و برمی‌گردد.
3. **Examples:** (در step خوابِ اجاره) «بازار پونک چنده؟» / (در بودجهٔ خرید) «توکن‌هام چنده؟» / (در imps) «مقایسهٔ پونک و نارمک» / «صبر کن، نقشه رو ببینم».
4. **Required info:** تشخیص: step عددی → parse شکست می‌خورد؛ step متنی → نیاز به confirm bar.
5. **Steps (V0.21 — تورفتگی در ceSend قبل از ceVal برای step جاری):** ① step عددی/count/money: اگر `parseCountFA/parseMoneyFA/parseRangeFA` شکست می‌خورد **و** `RINT.route(t)` true → جواب کامل رندر شود؛ CE.f/CE.i دست‌نخورده → ② به آخر پیام chips: `[['↩ ادامهٔ فلو','!re'],['بازگشت یک مرحله','!back']]` که `!re` (پیشوند جدید) فقط ceStep() می‌زند (سوال فعلی را تکرار می‌کند) — ③ step متنی (kind:'text'): اگر regex قوی نیت (بازار|مقایسه|توکن|نقشه|کیف پول|تضمینی|کدوم) مطابق شد و step از نوع until نیست → نوار تفکیک: «این پاسخِ همین مرحله باشد یا پرسش تازه؟» [پاسخ مرحله][پرسش تازه]؛ until-loop (مثل extra) → هرگز قطع خودکار نشود، فقط دستور !back.
6. **Branches:** پرسش OOS → scOOS + همان chips بازگشت؛ پرسش نیازمند go() (نقشه/داشبورد) → ناوبری + chips بازگشت در پیام خوش‌آمد بازگشت (V0.21: بعد از go، در بازگشت به chat پیام «برگردیم به فلو؟» اگر CE.f زنده است).
7. **Expected responses:** پاسخ کامل RINT + دو chip بازگشت؛ بدون تکرار بی‌مورد سوال فلو.
8. **Components:** chip !re (جدید)، confirm bar متنی.
9. **State:** CE حفظ؛ HIST ادامه‌دار؛ flowSummaryText/نوار مرحله زنده می‌ماند.
10. **Errors:** اگر بعد از جواب کاربر عدد داد → عدد را برای step فعلی بپذیر (فلو ادامه)؛ if CE.f گاردشده → همان گارد.
11. **Completion:** ادامهٔ فلو تا ceEnd عادی.
12. **Tests:** «بازار پونک چنده؟» در beds → bars + chips، سپس «۲» → beds=2 و ادامه | «مقایسه پونک و نارمک» در budg → جدول؛ «۳۰ میلیارد» → budg=3e10… (توجه: ۳۰ میلیارد=3e10 ریال) و ادامه | «نقشه» در extra → go + بازگشت پیشنهادی.

---

#### S-CTX-02 — Mid-flow correction (budget/beds/hood)
1. **ID:** S-CTX-02
2. **Intent:** تغییر یک مقدار قبلی وسط فلو.
3. **Examples:** «ودیعه رو بذار ۲۰ میلیارد» / «بودجه‌م عوض شد، ۵۰ میلیارد تومان» / «سه خواب می‌خوام نه دو» / «محله رو عوض کنم، پونک».
4. **Required info:** field هدف + مقدار جدید.
5. **Steps (V0.21 — CORR pre-pass در ceSend وقتی CE.f):** ① regex `(ودیعه|اجاره|بودجه|خواب|محله|متراژ|طبقه).*(بذار|کن|عوض|تغییر|شه)` یا الگوهای «X رو Y» → ② نقشهٔ field→stepId: ودیعه→dep، اجاره→rentb، بودجه→budg، خواب→beds، محله→hoods → ③ `ceJump(stepId)` (موجود) — چون پرچم‌های _setSet ست شده‌اند، pre-hook دوباره prefill نمی‌زند و سوال با مقدار فعلی پرسیده می‌شود → ④ کاربر مقدار جدید می‌دهد → ctxFromStep → CTX به‌روز → ⑤ اگر تغییر روی محله/ملک اثر دارد (hood عوض شد) → هشدار وارسی: «آگهی‌های انتخابی قبلی با محلهٔ جدید همخوان نیست؛ ملک را دوباره انتخاب کنید» + پرچم D.listing پاک نشود خودکار — فقط هشدار + chip «انتخاب ملک».
6. **Branches:** مقدار در همان پیام («ودیعه ۲۰ میلیارد کن») → jump + prefill خودکار مقدار در سوال (نمایش مقدار پیشنهضی در chips)؛ field نامربوط به فلو (مثلاً «شهر» در rent) → پیام «این فیلد در این فلو نیست».
7. **Expected responses:** پیام «می‌رویم به مرحلهٔ X برای اصلاح…» + سوال step.
8. **Components:** chips مقدار جدید.
9. **State:** cePush/ceJump موجود؛ CTX sync.
10. **Errors:** مقدار نامعتبر → همان اعتبارسنجی step.
11. **Completion:** set موفق → ادامه از همان step (رفتار ceVal عادی).
12. **Tests:** «ودیعه رو بذار ۲۰ میلیارد» در imps → سوال dep | «بعدش ۲۰ میلیارد» → depB=2e10، بازگشت جریان | «محله رو پونک کن» در list → hoods + هشدار ملک | «خواب ۳» در m2 → beds=3 (سوال دوباره پرسیده می‌شود یا مقدار مستقیم اگر regex مقدار هم گرفت).

---

#### S-CTX-03 — Multi-requirement first message (slot extraction)
1. **ID:** S-CTX-03
2. **Intent:** نیاز در یک جملهٔ متراکم.
3. **Examples:** «می‌خوام یه آپارتمان ۲ خوابه تو سعادت‌آباد با اجارهٔ ۵۰ میلیون بگیرم» / «با ۳۰ میلیارد تومان ۲ خواب تو پونک می‌خوام بخرم» / «خانواده‌ایم، ۳ خواب، نوساز، سعادت آباد».
4. **Required info:** CTX.beds/hood/rent/dep/budg/persona/متراژ/نوساز.
5. **Steps (V0.21 — SLOT extractor قبل از route وقتی CE.f=null):** ① استخراج با regex-sets روی normFa: خواب `(\d+)\s*خواب`، محله hoodsIn، اجاره/ودیعه/بودجه با moneyOf+واژهٔ مجاور، persona (خانواده/دانشجو/دو نفر/موقت)، نوساز→age=3 → ② خلاصه با rcards + تأیید: «این‌ها را برداشتم: [chips قابل حذف]؛ درست است؟» [شروع اجاره][شروع خرید][اصلاح می‌کنم] → ③ ceStart → pre-hookهای موجود dep/rentb/beds/who مقادیر را مصرف و پیام «✓ از گفت‌وگوی قبلی» می‌زنند (موتور موجود، بدون منطق موازی).
6. **Branches:** فقط تحلیل بدون فلو («تو سعادت‌آباد چنده؟») → market می‌گیرد و CTX.hood ثبت؛ تناقض (اجاره+خرید) → سوال تکلیفی.
7. **Expected responses:** rcards خلاصهٔ slots + rcNote «برای تغییر، روی مرحله بازگردید».
8. **Components:** chips قابل ویرایش (edit-summary مثل S-CMP-03).
9. **State:** CTX کامل؛ هیچ wf تغییری قبل از تأیید نمی‌کند.
10. **Errors:** مقدار مبهم → بدون slot، مسیر عادی؛ استخراج خالی → fallback عادی فلو-محور.
11. **Completion:** شروع فلو با prefill.
12. **Tests:** مثال ۱ → rcards ۳ اسلات + chips؛ «شروع اجاره» → dep از CTX? (نه—اجاره اسلات rent→rentb، dep اگر بود) | «۳ خواب نوساز» → beds=3, maxAge≤3 در فلو | «خرید ۳۰ میلیارد تومان پونک» → budg=3e11 ریال، hood=h?پونک.

---

#### S-CTX-04 — Mixed Persian/English input
1. **ID:** S-CTX-04
2. **Intent:** پیام با واژه‌های انگلیسی رایج.
3. **Examples:** «apartment برای rent می‌خوام» / «یه place تو Saadatabad می‌خوام برای family» / «mortgage می‌خوام بگیرم» (وام→OOS) / «token هام چنده؟».
4. **Required info:** واژه‌نامهٔ EN→FA.
5. **Steps (V0.21 — `RINT.enNorm(t)` در ابتدای ceSend، قبل از همهٔ مسیرها):** نگاشت: rent→اجاره، apartment/apt→آپارتمان (به ceSmart «اجاره» اضافه نمی‌شود بلکه متن نرمال می‌شود)، buy→خرید، hood/neighborhood→محله، Saadatabad/Ponak/Narmak→نام‌های محله (لیست کوچک)، family→خانواده (persona)، deposit→ودیعه، budget→بودجه، map→نقشه، token→توکن، mortgage/loan→وام (تا OOS بگیردش)، price→قیمت، compare→مقایسه. پیام اصلی کاربر در HIST بدون تغییر نمایش داده شود (فقط نسخهٔ نرمال‌شده به router می‌رود).
6. **Branches:** واژهٔ ناشناخته انگلیسی → همان fallback فارسی؛ انگلیسی+ارقام فارسی ترکیبی پشتیبانی شود (pd قبل از enNorm نیست — normFa ارقام را درست می‌کند).
7. **Expected responses:** بر اساس intent معادل فارسی؛ مثال mortgage → scOOS وام.
8. **Components:** —.
9. **State:** — (فقط ورودی).
10. **Errors:** اطمینان: enNorm هیچ پیام فارسی سالمی را خراب نکند (فقط جایگزینی واژهٔ کامل با مرز کلمه).
11. **Completion:** مسیر معادل.
12. **Tests:** «apartment برای rent می‌خوام» → ceStart('rent') | «token هام» → CBT.tok | «mortgage می‌خوام» → scOOS | «compare Ponak va Narmak» → scCompare.

---

#### S-CTX-05 — Informal phrasing & character/digit variants
1. **ID:** S-CTX-05
2. **Intent:** تضمین پایداری در برابر محاوره و نویسه‌های عربی/ارقام.
3. **Examples:** «می‌شه بگین اجاره چنده؟» (می‌شه) / «مىخوام» (بدون نیم‌فاصله/ى) / «كNevertheless» — نمونهٔ واقعی: «سكنت با كیفت» (ك عربی) / «ودیعه ۱۵۰۰۰۰۰۰۰۰۰ ریال» vs «15 میلیارد» / «۳،۵ میلیارد» (جداکننده).
4. **Required info:** — (پوشش پارسرها).
5. **Steps:** ① normFa: ي/ی ك/ک، ارقام فارسی/عربی، حذف ،٬, و ٫→. ، نیم‌فاصله→فاصله — همه موجود؛ ② V0.21: افزودن «می‌شه/میشه»، «چنده/چنده؟»، «می‌خوام/میخوام» به واژه‌نامهٔ intentهای market/flow-start (فقط در رگکس‌ها؛ بدون تغییر پارسرهای عددی) ③ «۳،۵ میلیارد» → 3.5e9 (normFa+parseNumberWords نقطه‌ای) — تست شود.
6. **Branches:** «چنده» با مبلغ → rentAfford؛ بدون → market.
7. **Expected responses:** همان مسیرهای استاندارد.
8. **Components:** —.
9. **State:** —.
10. **Errors:** اگر ترکیب جدیدی نشست → fallback S-FB-01 بی‌خطا.
11. **Completion:** —.
12. **Tests:** «می‌شه اجارهٔ سعادت آباد؟» → market-rent | «مىخوام خونه اجاره كنم» → ceStart rent | «۳،۵ میلیارد» در afford → 3.5e9 | «15 میلیارد» → همان ۱۵ میلیارد.

---

### Group D — Attachment scenarios (6) — V0.21 new capability

Shared model: composer gets attach button (📄) + hidden `<input type=file multiple>` + drag-drop on `.fch-in`/`.ch-in` + paste handler; tray of up to 3 file chips (name · type · KB/MB via fa()); validation: png/jpg/jpeg/webp, pdf/doc/docx, xls/xlsx/csv, txt; ≤5MB each; removal ✕ per chip; blob: URLs, session-only — every card that shows an attachment must carry `rcNote('پیوست فقط در همین نشست معتبر است؛ با بازنشانی صفحه از بین می‌رود.')`. **Never** claim OCR/image-analysis/AI: the only «تحلیل تصویر» in the app is the explicitly-labeled simulated tai step.

---

#### S-ATT-01 — Image attachment + question (honest limitation)
1. **ID:** S-ATT-01
2. **Intent:** کاربر عکس ملک/نم/ایراد می‌فرستد و سوالی می‌پرسد.
3. **Examples:** (پیوست jpg از نشیمن) «این خانه به نظرت می‌ارزه؟» / (عکس نمر دیوار) «این خرابی حساب می‌شه؟» / «عکس‌های بازدید رو برات می‌فرستم نگه دار».
4. **Required info:** فایل تصویر معتبر؛ متن سوال.
5. **Steps:** ① پیوست → پیش‌نمایش واقعی محلی (blob img + ابعاد از `new Image().width/height` نمایش با fa()) + کارت فایل (نوع/حجم) → ② سوال → پاسخ صادقانه: «تصویر را می‌بینم و نگه می‌دارم، اما تحلیل محتوای عکس (تشخیص نم، ارزیابی قیمت از عکس) در این نسخه انجام نمی‌شود و حدس نمی‌زنم.» + اقدام‌های زمینه‌ای: [افزودن به فرم بازدید به‌عنوان «عکس از ایرادها»] [پیوست به پروندهٔ فسخ برای مقایسهٔ شبیه‌سازی‌شده] [حذف] ③ اگر سوال قیمتی/بازاری مستقل بود → S-ANALY-01 با rcNote «پاسخ از دادهٔ بازار است، نه از عکس».
6. **Branches:** فلو فعال rent در vform → پیشنهاد اول tick؛ فسخ فعال → tai با برچسب «شبیه‌سازی — نتیجهٔ واقعی از عکس شما استخراج نمی‌شود»؛ بدون فلو → فقط نگهداری + توضیح.
7. **Expected responses:** کارت پیش‌نمایش + rcNote محدودیت + rcActs.
8. **Components:** file card, preview, actions.
9. **State:** session tray (آرایهٔ ATT محلی) — هرگز در localStorage (حجم)؛ ارجاع id در D.vlist/D.term فقط به‌صورت شمارنده/پرچم، نه blob.
10. **Errors:** فایل تصویری خراب → «پیش‌نمایش ممکن نشد؛ فقط مشخصات نگه داشته شد».
11. **Completion:** پاسخ صادقانه + اقدام انتخابی.
12. **Tests:** عکس+«می‌ارزه؟» → عدم ادعا + بازار | عکس در vform → tick «عکس از ایرادها» با برچسب پیوست‌شده | عکس در فسخ → tai با برچسب شبیه‌سازی.

---

#### S-ATT-02 — CSV/TXT attachment → real local preview table
1. **ID:** S-ATT-02
2. **Intent:** فرستادن جدول (مثلاً لیست اجاره‌بها/اقلام) و دیدن پیش‌نمایش واقعی.
3. **Examples:** (rent-roll.csv) «این لیست اجاره‌هام رو ببین» / (items.txt) «اقلام خونه اینه» / «فایل هزینه‌های ساختمان رو پیوست کردم».
4. **Required info:** csv/txt سالم (حجم <۵MB).
5. **Steps:** ① پیوست → FileReader → پارس محلی: تشخیص جداکننده (`,` `;` tab)، حداکثر ۶ ستون×۵ سطر اول → ② rcTable واقعی با سطر «… و N سطر دیگر» + rcNote «پیش‌نمایش محلی فایل شماست؛ اطلاعاتی جای دیگری ارسال نمی‌شود.» → ③ اقدام‌های صادقانه: [شمارش سطر/ستون] [مجموع ستون عددی انتخابی] (فقط محاسبات ساده واقعاً انجام‌شده) — بدون تفسیر هوشمند.
6. **Branches:** encoding غیر UTF-8 (فارسی خراب) → «انکودینگ شناسایی نشد؛ پیش‌نمایش ممکن نیست» (بدون دروغ)؛ تک‌ستونه → rcLine نیست، فهرست متنی؛ xlsx → فقط متادیتا (پارس binary نمی‌شود — صادقانه).
7. **Expected responses:** rcTable + rcNote + شمارش‌ها با fa().
8. **Components:** rcTable (sortTbl فعال).
9. **State:** فقط session.
10. **Errors:** سطر ناقص → نمایش تا سطر سالم آخر + یادداشت.
11. **Completion:** پیش‌نمایش + اقدام.
12. **Tests:** csv سه‌ستونه → جدول ۵ سطر | txt اقلام → فهرست + شمارش | xlsx → کارت متادیتا + محدودیت | csv خراب → پیام صادقانه.

---

#### S-ATT-03 — PDF/DOC attachment (metadata-only + contextual actions)
1. **ID:** S-ATT-03
3. **Intent:** پیوند سند (قرارداد/مدارک) با گفت‌وگو.
3. **Examples:** (سند مالکیت.pdf) «سندم رو آپلود کردم» / (قرارداد.docx) «این قرارداد رو نگه دار» / «مدارک برای گزارش حقوقی».
4. **Required info:** فایل معتبر pdf/doc/docx.
5. **Steps:** ① کارت فایل فقط با متادیتا (نوع/حجم/نام) + rcNote صریح: «در این نسخه محتوای PDF/Word بازخوانی نمی‌شود؛ فقط مشخصات فایل ثبت است.» → ② اقدام‌ها: [باز کردن در تب جدید (blob)] [پیوند به مرحلهٔ حقوقی خرید (D.legalDocs فهرست نام فایل)] [پیوند به پروندهٔ GRT اسناد (grtPrefill)] ③ session-only هشدار.
6. **Branches:** در فلو buy بعد از lg → «نام فایل در کارت درخواست حقوقی یادداشت شد» (افزودهٔ کوچک به req.detail)؛ خارج فلو → فقط توضیح.
7. **Expected responses:** کارت متادیتا + rcActs.
8. **Components:** file card.
9. **State:** نام/نوع در req.detail در صورت انتخاب کاربر — بدون ادعای محتوا.
10. **Errors:** دانلود تصادفی نه؛ باز کردن در تب جدید با URL.revokeObjectURL بعد از استفاده.
11. **Completion:** ثبت ارجاع.
12. **Tests:** pdf → کارت+محدودیت | «باز کن» → تب جدید | در buy-lg → یادداشت در درخواست | docx → همان مسیر.

---

#### S-ATT-04 — Attachment validation (oversize / unsupported / too many)
1. **ID:** S-ATT-04
2. **Intent:** ورودی نامعتبر فایل.
3. **Examples:** تصویر ۸MB / فایل .exe یا .zip / چهارمین فایل / csv ۷MB.
4. **Required info:** —.
5. **Steps:** ① هر فایل بلافاصله اعتبارسنجی → رد با کارت خطای قرمز کوچک در tray (نمایش علت دقیق) + toast: «فایل «x.jpg» بیشتر از ۵ مگابایت است (۸٫۰)» / «نوع فایل پشتیبانی نمی‌شود: exe — تصویر، سند، صفحه‌گسترده و متن پذیرفته می‌شود» / «حداکثر ۳ پیوست؛ یکی را حذف کنید» ② فایل‌های معتبر همان لحظه پیش‌نمایش/متادیتا؛ دکمهٔ ارسال تا پایان اعتبارسنجی disabled نمی‌شود (پیام مستقل بهتر است) — تصمیم: ارسال مستقل از پیوست.
6. **Branches:** چند خطا همزمان → فهرست bullet؛ drag-drop چندتایی → اعتبارسنجی تک‌تک، معتبرها می‌مانند.
7. **Expected responses:** کارت خطا + toast؛ بدون سکوت.
8. **Components:** tray states.
9. **State:** —.
10. **Errors:** خودِ سناریو.
11. **Completion:** tray فقط معتبرها.
12. **Tests:** 8MB jpg → رد با علت | a.exe → رد نوع | فایل ۴م → پیام سقف | ۲ معتبر+۱ نامعتبر → ۲ می‌مانند.

---

#### S-ATT-05 — Multi-file, drag-drop, clipboard paste
1. **ID:** S-ATT-05
2. **Intent:** سه مسیر ورود پیوست + ترکیب انواع.
3. **Examples:** کشیدن ۳ عکس داخل جعبهٔ متن / paste اسکرین‌شات (Ctrl+V) / انتخاب دو csv + یک pdf از دکمه.
4. **Required info:** —.
5. **Steps:** ① dragover روی ناحیهٔ composer → هایلایت مرز (کلاس CSS) + برچسب «رها کنید تا پیوست شود» → ② drop → همان اعتبارسنجی S-ATT-04 → ③ paste: event.clipboardData.items type image/* یا فایل → پیش‌نمایش فوری با نام تولیدی «چسبانده-تصویر-۱.png» → ④ tray ترکیبی مرتب (تصویر/جدول/سند) → ارسال پیام با/بدون متن؛ بدون متن → پیام سیستم «n پیوست ارسال شد» به‌عنوان usrC.
6. **Branches:** paste متن ساده → رفتار عادی (تداخلی با ارسال Enter نداشته باشد: Shift+Enter سطر جدید — S-CMP composer upgrade)؛ drop حین rThink → صف می‌شود، پاسخ رندر شده سپس کارت پیوست.
7. **Expected responses:** tray + پیام سیستم.
8. **Components:** tray، dropzone، paste.
9. **State:** session tray مشترک بین هر سه سطح chat (landing/floating/dock)؟ — تصمیم: tray سطح-محور (هر composer مستقل)؛ باز تکرار عمدی برای سادگی.
10. **Errors:** مرورگر بدون paste فایل → ویژگی مخفی، بی‌سروصدا.
11. **Completion:** پیوست‌ها ضمیمهٔ پیام بعدی.
12. **Tests:** drop ۳ عکس → tray ۳ | paste → پیش‌نمایش فوری | بدون متن ارسال → usrC سیستمی | Enter با tray خالی → عادی.

---

#### S-ATT-06 — Attachment removal + visit-checklist tie-in
1. **ID:** S-ATT-06
2. **Intent:** حذف پیوست و کاربرد ساختاریافته در چک‌لیست بازدید.
3. **Examples:** «این یکی رو حذف کن» (روی ✕ کارت) / «عکس‌های بازدید رو بذار تو چک‌لیست» / قبل از ارسال پشیمانی از csv.
4. **Required info:** —.
5. **Steps:** ① ✕ روی chip پیش‌نمایش → حذف از tray + revokeObjectURL → ② در فلو rent step vform با پیوست تصویری موجود → دکمهٔ «پیوست‌ها را به «عکس از ایرادها» وصل کن» → vlist[7].ok=true با برچسب دقیق زیر کارت: «۲ عکس پیوست شد — بررسی چشمی با خودِ شماست؛ سامانه تحلیل نمی‌کند» ③ اگر پیوست بعداً حذف شد → ok=true می‌ماند اما برچسب «پیوست حذف شد» ظاهر شود (صداقت وضعیت).
6. **Branches:** حذف بعد از ارسال → کارت در HIST می‌ماند ولی تصویر می‌میرد بعد reload → از قبل در همهٔ کارت‌ها هشدار session-only داریم.
7. **Expected responses:** به‌روزرسانی tray/کارت‌ها.
8. **Components:** ✕، وضعیت vlist.
9. **State:** پرچم شمارشی در D (مثلاً D.vpics=2) — قابل ذخیره، بدون blob.
10. **Errors:** حذف ناموجود → noop.
11. **Completion:** چک‌لیست منسجم.
12. **Tests:** ✕ قبل از ارسال → حذف | وصل به vform → tick + برچسب | حذف بعدی → برچسب حذف | reload → هشدار session در کارت‌ها.

---

### Group E — Embedded conversational components (3)

---

#### S-CMP-01 — Money range slider (budget/deposit) with live readout + confirm
1. **ID:** S-CMP-01
2. **Intent:** انتخاب مبلغ با اسلایدر به‌جای تایپ.
3. **Examples:** (در step dep) کشیدن اسلایدر تا ~۱۵ میلیارد و «تأیید» / «همین» / تایپ میان‌بر همچنان مجاز.
4. **Required info:** بازهٔ مجاز step (dep: 1–60 میلیارد ریال؛ rentb: 1–15۰ میلیون تومان؛ budg: ≥50 میلیارد ریال).
5. **Steps:** ① در stepهای money (dep/rentb/budg/cap/fund) کارت اسلایدر زیر chips: `rcSlider({min,max,step,value,fmt:rial,onOK})` → نمایش لحظه‌ای مقدار با fa()/rial بالای دسته → ② دکمهٔ «تأیید مقدار» → همان مسیر ceVal عددی (بدون منطق دوم) → ③ تایپ آزاد همچنان کار می‌کند (اسلایدر مکمل است، نه جایگزین). مقیاس: لگاریتمی برای بازه‌های بزرگ (گام‌های ۱/۲/۵) تا انتهای بازه قابل استفاده باشد — پیاده‌سازی: نگاشت index→value از لیست گام‌ها.
6. **Branches:** مقدار خارج بازه غیرممکن (slider مقید)؛ گام درشت → نمایش دقیق مقدار گام انتخابی.
7. **Expected responses:** readout زنده + بعد از تأیید همان noteهای parseMoneyFA (✓ … ریال).
8. **Components:** input[type=range] + readout + دکمهٔ تأیید (data-cba="slSet" data-step / data-val).
9. **State:** هیچ — مقدار از همان set() step می‌گذرد.
10. **Errors:** — (slider مقید)؛ تأیید بدون تغییر → مقدار پیش‌فرض وسط.
11. **Completion:** set موفق → step بعد.
12. **Tests:** dep slider→تأیید ۱۵ میلیارد → depB=15e9 | تایپ «۱۵ میلیارد» همچنان OK | rentb slider min|max درست | cap slider → cap.

---

#### S-CMP-02 — Confirmation/summary panel before visit booking
1. **ID:** S-CMP-02
2. **Intent:** جمع‌بندی قابل ویرایش پیش از اقدام توکن‌دار/مالی.
3. **Examples:** (step visit) پنل خلاصه قبل از «ثبت کن» / قبل از ACT.besc / قبل از spend stay.
4. **Required info:** ملک، محله، روز، ساعت، هزینهٔ توکنی (COSTS.visit=20).
5. **Steps:** ① در step visit به‌جای متن خالی: `rcConfirm(rows=[['ملک',t],['محله',n],['زمان',vday+' '+vtime],['هزینه','۲۰ توکن']], edits=[[ceJump targets day/list]])` + دکمهٔ primary «ثبت درخواست بازدید» → همان `!go`/doRentVisit موجود → ② هر ردیف دکمهٔ «ویرایش» → ceJump به step متناظر (day/time/list) → بازگشت به پنل با مقادیر جدید (cePush تاریخچه را نگه می‌دارد) ③ توکن ناکافی → مودال spend موجود.
6. **Branches:** تغییر زمان → بازمحاسبه پنل؛ همین الگو برای book (stay) و escC (escrow) — سه نقطهٔ خطرناک مالی.
7. **Expected responses:** پنل rcConfirm + بعد از ثبت پیام موجود doRentVisit/addReq.
8. **Components:** rcConfirm (جدول خلاصه + actions) — builder جدید، رندر با rcard/مشابه.
9. **State:** بدون state جدید؛ فقط UI روی SCRIPTS.rent.visit موجود.
10. **Errors:** بدون listing/time → پنل این را با «—» نشان می‌دهد و دکمهٔ primary غیرفعال + راهنما.
11. **Completion:** ثبت بازدید (رفتار موجود).
12. **Tests:** پنل نمایش ۴ ردیف | «ویرایش زمان» → day | تأیید → addReq + ۲۰− توکن | بدون ملک → primary غیرفعال.

---

#### S-CMP-03 — Editable summary chips (flow summary bar)
1. **ID:** S-CMP-03
3. **Intent:** خلاصهٔ زندهٔ فلو قابل پرش برای ویرایش.
3. **Examples:** نوار fchSum/landingSum/dashSum: «ودیعه: X • اجاره: Y • محله: Z» با چیپ ویرایش هر آیتم / «جمع‌بندی رو نشون بده».
4. **Required info:** flowSummaryText موجود.
5. **Steps:** ① V0.21: هر سگمنت خلاصه به chip قابل کلیک تبدیل شود (data-cj="stepId" → ceJump) — نگاشت ماژول‌محور مثل S-CTX-02 ② درخواست «جمع‌بندی» در chat → rcConfirm کامل از همهٔ فیلدهای ثبت‌شدهٔ فلو با همان edit chips + rcProg(مراحل) ③ بعد از ویرایش، نوار خودش به‌روز می‌شود (renderChatMeta موجود).
6. **Branches:** فلو فعال نیست → خلاصهٔ آخرین فلو اگر wfRunning، وگرنه پیام خالی S-FB-02-مانند؛ فلو با گارد → rcNote گارد.
7. **Expected responses:** rcConfirm + rcProg.
8. **Components:** data-cj delegation (جدید، مشابه data-jump صفحه‌ای).
9. **State:** ceJump موجود.
10. **Errors:** stepId نامعتبر → noop.
11. **Completion:** ویرایش و بازگشت.
12. **Tests:** chip «ودیعه» → dep | «جمع‌بندی» → پنل کامل | بعد از ویرایش نوار به‌روز | بدون فلو → پیام مناسب.

---

### Group F — Fallback & error scenarios (3)

---

#### S-FB-01 — Unknown intent
1. **ID:** S-FB-01
2. **Intent:** پیام نامفهوم.
3. **Examples:** «هویی بلبل» / «رنگ آسمان چنده؟» / «abc123».
4. **Required info:** —.
5. **Steps:** ① همهٔ مسیرها رد شدند → پیام موجود fallback: «این را دقیق متوجه نشدم…» + RINT.topicsHTML() + chips راهنما/منو ② V0.21: اگر CE.f فعال → chips «بازگشت به فلو» (!re) هم اضافه شود ③ پیام کاربر در HIST نمایش عادی.
6. **Branches:** تکرار دوم پشت‌سرهم → پیشنهاد !help صریح‌تر + شاید اشتباه نگارشی (نرمال‌سازی اعمال شد؟)؛ ورودی کوتاه یک‌کلمه‌ای با نام محله → هوشمندی hoodsIn پیشنهاد «بازار X؟».
7. **Expected responses:** topicsHTML rcActs.
8. **Components:** chips.
9. **State:** بدون تغییر state (ایمن).
10. **Errors:** خودش fallback است؛ هرگز پاسخ ساختگی/الکی رندر نشود.
11. **Completion:** کاربر مسیر انتخاب کرد.
12. **Tests:** «هویی» → fallback | دومین بار → !help پیشنهاد | «پونک» تنها → «بازار پونک؟» | «رنگ آسمان» → fallback (OOS نیست چون فهرست OOS خاص است).

---

#### S-FB-02 — Empty results
1. **ID:** S-FB-02
2. **Intent:** جست‌وجو/فیلتر بدون نتیجه.
3. **Examples:** شهر بدون اقامتگاه در stay list / rent list با فیلتر سخت صفر / cmpH بدون دو محله.
4. **Required info:** —.
5. **Steps:** ① شمارش صفر → به‌جای ناحیهٔ خالی: پیام «با این شرایط نتیجه‌ای نیست (۰ از N)» + rcProg نیست، بلکه rcNote + chips شimirin: [کاهش محدودیت‌ها: چن diamante…] دقیق‌تر: rent: «کمتر از این خواب»(beds−1) / «همهٔ آگهی‌های محله» (!all موجود — بدون فیلتر سخت) / «محلهٔ دیگر» (!back)؛ stay: شهر نزدیک/همهٔ شهرها (!all) ② مقایسه با یک محله → درخواست دوم (موجود).
6. **Branches:** N=0 کل (شهر ناشناخته) → پیشنهاد شهرهای SLIST.
7. **Expected responses:** پیام صفر + chips اصلاح.
8. **Components:** chips.
9. **State:** بدون تغییر.
10. **Errors:** خودش هست؛ صادق: «دادهٔ نمونهٔ سامانه فقط ۶ محله دارد» وقتی مربوط است (rcNote).
11. **Completion:** تغییر فیلتر یا مسیر.
12. **Tests:** «قشم» در stay → صفر + پیشنهاد شهرها | rent با elev+park+3bed صفر → chips !all | «مقایسه پونک» → درخواست محلهٔ دوم.

---

#### S-FB-03 — Invalid money input
1. **ID:** S-FB-03
2. **Intent:** ورودی مالی نامعتبر در stepهای money.
3. **Examples:** «ودیعه سه» (عدد کلمه‌ای کوچک) / «۱۵ تومان» / «بین ۱۰ تا ۲۰ میلیارد» در فیلد تک‌مبلغی / «۳ ریال و ۵ ریال».
4. **Required info:** —.
5. **Steps:** ① parseMoneyFA/parseMoneyRangeFA پیام‌های دقیق موجود: ابهام واحد، بازه در فیلد تک، عدد مثبت، بازهٔ step (st.err) ② V0.21: بعد از ۲ شکست متوالی در همان step → پیشنهاد rcSlider (S-CMP-01) به‌عنوان خروجی آسان‌تر + chips مبالغ پیش‌فرض ③ سقف تلاش ندارد (صبور) — فقط پیشنهاد هوشمند.
6. **Branches:** «تومان» هم + «ریال» → پیام «واحد را مشخص کنید»؛ تومان خالص → ×۱۰ با note ✓.
7. **Expected responses:** پیام خطای سراغ‌پذیر + بعد از تکرار slider.
8. **Components:** chips مبالغ، rcSlider.
9. **State:** مقدار قبلی D دست‌نخورده می‌ماند.
10. **Errors:** خودش.
11. **Completion:** مقدار معتبر.
12. **Tests:** «ودیعه سه» → ابهام | «۱۵ تومان» → خارج بازه (st.err) | «بین ۱۰ تا ۲۰ میلیارد» → خطای بازه-در-تک | دومین شکست → slider پیشنهاد.

---

## 3. Interaction-State Inventory

| State | Entry | Surface behaviors (all three composers: landing #chatB, floating #fchB, dock #dashB) |
|---|---|---|
| **initial** | !HIST → ceStartGate / ACT.chatNew | welcome gate (work/school/menu), suggestions via ctxSuggestions per CURRENT, composer enabled, attach button visible |
| **active** | CE.f set, awaiting answer | step bar (renderChatMeta: فلو/گام X), summary bar (flowSummaryText), chips of current step + «↩ بازگشت» when CE.hist non-empty, suggestions trimmed to flow context |
| **processing** | rThink(label,fn) (~700ms) or simulated timers (mkt 3s, stay 2s, visit 2.5s) | typing bubble (proc), composer stays enabled but Enter during proc queues as next message (current behavior preserved), no decorative animation |
| **collecting** | loop steps (imps, CHIP5), until steps (extra, vadd), pending CTX («برای کدام محله؟») | numbered chips, «تمام» terminator chip, progress within loop shown by question index; V0.21: attachment tray visible during collecting |
| **results** | botC with builders/cards | rcards/rcTable(sortable)/rcLine/rcBars/rcDonut, chat cards with CBACT buttons, honesty rcNote + source attribution (SRC/kilid/OSM), scroll-to-charts logic in cr() preserved |
| **error** | parser/step errors | inline botC message (never modal except token top-up spend()), retry same step, no state loss; V0.21: slider rescue after 2 money failures |
| **empty** | zero results / no flows / no orders | explicit «0 از N» + corrective chips; dashboard .empty equivalents referenced, not duplicated |
| **long-conversation** | HIST>60 (trim in botC), CE.hist>40 | oldest messages dropped silently; summaries (fchSum) keep orientation; V0.21: attachments in trimmed messages already dead-by-design (session-only note covers it) |
| **reset** | ACT.chatNew (clears CE+HIST+ctxReset) / ACT.chatStop (keeps flow state, closes chat) | chatNew → gate again; chatStop → «گفت‌وگو بسته شد. مسیر فعلی شما حفظ شده است.» + menu chips; V0.21: chatNew also clears attachment tray + revokes blob URLs |

---

## 4. Integration Hooks Appendix (exact anchors — implementers extend, never duplicate)

**Chat engine (lines ~2550-2900):**
- `HIST`, `CE={f,i,li,hist}`, `cr()` (renders into `#chatB` + `#fchB` + `#dashB`; chart scroll; appends «↩ بازگشت» chip on last bot msg when CE.hist).
- `botC(html,chips)` / `usrC(text)` — only sanctioned writers to HIST.
- `ceStart(f)` (routes page-only modules to `MODBY[f].v` + toast — keep), `ceStartGate()`, `ceJump(stepId)` (used by corrections/summary edits), `ceStep()`, `ceBack()` (via `!back`), `ceEnd()`.
- `ceVal(v)` — validation dispatcher (`money/count/range/moneyRange`, `st.set/st.key/st.loop/st.until/st.pre/st.acts`, `ctxFromStep` call, note echo). Prefix commands: `!menu !help !back !wl !svc`, `F:<m>`, `F:step:<m>`, `F:dashx F:sub F:wallet`. **V0.21 adds:** `!re` (re-ask current step after interruption).
- `ceSend(t)` — **the tail is the integration spine**, order matters and must be preserved: prefix nav (درخواست/نقشه/کیف پول/داشبورد/راهنما/منو) → flow-chip match (matchChipText, numeric-step guard) → current-step text/num/set/loop/until swallow → keyword chain (توکن/کیف پول/فسخ/امضا/محله‌ها/مقایسه/نقشه/…) → RINT guarded routes (market money-gates) → `ceSmart` → `RINT.route` → fallback. **V0.21 insertion points:** (a) `RINT.enNorm` at the very top (S-CTX-04); (b) CORR regex + SLOT extractor (S-CTX-02/03) after chip-match, before the step-swallow; (c) interruption check inside the step-swallow for numeric steps (parse-fail && RINT.route → answer + !re chips), confirm-bar for text steps (S-CTX-01).
- `SCRIPTS` registry — gate/rent/buy/invb/invr/mkt/build/stay (no grt by design). Money steps list for slider: rent.dep, rent.rentb, buy.budg, invr.cap, invr.fund, invb.cap, invb.price, mkt.bid.
- Card actions `CBACT.*` (selH/hInfo/hMap/caddH/selL/detL/savL/selB/detB/savB/bidPr/detPr/pinfoPr/viewBids/selS/savS/detS/vcT/ipset/sortTbl) — global click delegation also handles `data-cv data-cq data-cf data-cba data-w data-jump data-act data-view data-imp`. **V0.21 new attributes:** `data-cj` (chat jump→ceJump), `data-cba="slSet"`, attachment tray actions; register in the same delegated listener block (~line 7957) — no inline onclicks.
- `CBT.tok` (token/wallet balance card) — keep precedence over explain for bare «توکن».

**Intelligence layer (~3620-4100):** `CTX` + `ctxReset/ctxFromStep` (slots hood/budg/dep/rent/beds/persona/city/lastIntent/pending), builders `rcard/rcards/rcNote/rcActs/rcProg/rcTable/rcLine/rcBars/rcDonut`, `rThink`, `RINT.route/scGreet/scContinue/scGuide/scGrtInfo/scExplain/scMarket/scScores/scCompareAll/scCompare/scAfford/scRentAfford/scOOS`, `hoodsIn/trendSeries/monthLabels/hoodChipsAct`. **V0.21 adds** `scDist` (توزیع آگهی‌ها → rcDonut) wired to the existing chip label; `enNorm`; CORR/SLOT helpers as pure functions before route.

**Page/wizard engines (do NOT duplicate):** `WSTEPS`, `stepper/wtop/wnav/wizardNav/jumpTo/guardOK`, `wf/wd/wfNew/wfSet/wfLive/wfRunning/wfRebind/resumeChips`, `doRentVisit`, `conInit` + contract actions, `ACT.tpay/besc/pdone/irdone`, `openGateway`, `spend/earn/walletIn/addReq/setReq/reqsOfWf`, `grtCur/grtGuard/grtCollect/grtPrefill` (hand-off prefill), `svcOrderFormHTML/svcQuote/svcPayOrder/svcIsDemo`, `openPickMap/upsertPlace/initPlaces`, `cmpHoodTable/cmpListModal/hoodInfoModal/openTourModal`.

**Composer markup ids:** `#chatIn/#chatSend` (landing), `#fchIn/#fchSend` (floating, bound at boot ~line 8767), `#dashIn/#dashSend` (dock, bindDockChat). Suggestion hosts `#chatSugg/#fchSugg/#dashSugg`; step bars `landingStep/fchStep/dashStep`; summary bars `landingSum/fchSum/dashSum` + `data-act="chatBack"`. **V0.21 composer upgrade (all three):** `<textarea rows=1>` replacing `<input>` — Enter=send, Shift+Enter=newline, auto-grow to ~4 rows, `disabled` + label «در حال پرداخت/ارسال…» during blocking ops (gateway/quote), attach 📄 button + hidden multi-file input + dropzone + paste.

**ACT anchors:** `ACT.chatNew` (extend: revoke blob URLs + clear tray), `ACT.chatBack/chatStop`, `ACT.resume`, `ACT.flowInChat`, `ACT.newRequest`, `ACT.wallet/dt/reqDetail`, `ACT.svcOpen` (extend signature with prefill object).

**Hard constraints:**
1. **Honesty:** no OCR/image-analysis/AI claims anywhere (the only simulated analysis is rent termination tai, already labeled; keep the label even with real photos attached). Sample data labeled (نمونهٔ سامانه), prices attributed «آگهی نه معامله — منبع: کیلید» (MARKET.asOf), distances «هوایی — OSM», svc demo label when no endpoint, GRT 7% fee note, simulated timers must remain perceptually honest (short, labeled).
2. **RTL & digits:** all UI strings Persian, numbers through `fa()`/`rial()`/`pct()`; `dir` inherited RTL; LTR runs (phone, codes) wrapped `dir="ltr"` as existing code does.
3. **Delegation attributes only** (a11yify runs on chat bodies; keep `role=button tabindex=0` behavior for non-button elements).
4. **Attachments session-only:** blob URLs revoked on removal and on chatNew; never persisted to localStorage; every attachment card carries the session-note.
5. **No parallel engines:** every scenario above routes through the named existing function; new builders render, they do not compute business logic.
6. **Multi-flow safety:** chat operates on `wf(m)` active flow; never assumes single flow; hand-offs return to the active flow.

---

## 5. Open Questions / Risks (for orchestrator)

1. **Slider scale:** linear range on 1–60 Milliard Rial is unusable at the low end — spec assumes logarithmic snap steps (1/2/5 ladder). Needs UX sign-off; fallback = keep chips+typed input as primary (slider purely assistive).
2. **Text-step interruption ambiguity:** auto-routing a market question out of a `kind:'text'` step can misfire (user's free-text answer containing «بازار»). Spec chose a 2-button clarify bar for text steps (auto only for numeric steps via parse-failure). Confirm this friction trade-off.
3. **Attachment lifecycle vs `ACT.chatNew`:** spec clears tray + revokes blobs on new-chat (simplest honest behavior). Alternative: keep a session tray across chats — rejected for now because HIST trim already orphans old cards.
4. **CSV parser scope:** spec limits to UTF-8, comma/semicolon/tab, no quoted-newline handling. Real-world Persian Excel CSVs (Windows-1256, BOM) will fail — acceptable with honest error message, but product may want a BOM/1256 fallback (small, still local).
5. **`scDist` (توزیع آگهی‌ها):** the chip label exists in scMarket today but has no handler; spec adds `rcDonut` over listing attributes (beds/age bands). Data basis must be labeled «توزیع در آگهی‌های نمونهٔ سامانه» — confirm which attribute set (beds/متراژ/سال بنا) before implementation.

---

*End of spec — 24 capabilities mapped (100% coverage), 32 scenarios (A:9, B:6, C:5, D:6, E:3, F:3), 9 interaction states, 6 constraint classes, 5 open questions.*
