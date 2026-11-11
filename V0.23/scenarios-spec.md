# Mahalino V0.23 — Assistant Scenario Completion Specification
**Input:** `Mahalino/V0.22/Mahalino+V0.22.html` · **Output:** `Mahalino/V0.23/Mahalino+V0.23.html`
**Dominant objective:** complete the deterministic assistant's scenario families using verified research findings (`.mahalino-development/real-estate-research.md` §7–§9), expand triggers/normalization, and fix the documented imps-loop limitation. No AI engine; no new business engines; page wizards stay authoritative; honesty rules carry over verbatim (V0.21 spec §4 constraints 1–6 apply).

## S1 — رهن↔اجاره converter (research P0; pure math, no fabrication)
- Intent triggers: «تبدیل رهن به اجاره», «این رهن چند اجاره می‌شه», «X میلیون رهن…چقدر اجاره», «اجارهٔ X تومن چند رهن», «نرخ تبدیل».
- Bidirectional: dep→rent uses the SAME documented rate as V0.20's rentAfford (نرخ فرضی ۳٪ ماهانه — verify the exact constant in `RINT.scRentAfford`/`RINT.moneyOf` region and REUSE it; do not invent a second rate). rent→dep = rent/rate.
- Output: rcConfirm-style rows (ودیعه/اجارهٔ معادل) + rcNote «نرخ فرضی ماهانه X٪ — توافق مالک و مستأجر ملاک قانونی است؛ این فقط محاسبهٔ راهنماست.» + chips: «شروع اجاره با همین ودیعه» (sets CTX.dep + data-cf="rent"), «بازار محله‌ها».
- Ambiguity: bare money with both keywords («۵ میلیارد رهن یا اجاره؟») → one focused clarification (preserve parsed money in E23.temp).
- Numbers through parseMoneyFA on the moneyOf-extracted fragment; Persian digits; toman phrases accepted (parseMoneyFA already handles تومان×10).

## S2 — Contract & کد رهگیری guide (research P0; education only)
- Triggers: «کد رهگیری», «ثبت قرارداد», «قرارداد رسمی», «خودنویس», «سند رهن و اجاره».
- Content (from research §8, source-verified): the contract engine here creates a code + printable form (route chips: «شروع پیش‌نویس قرارداد» → data-cf per ctr0 entry — reuse the existing contract entry path; «مشاهدهٔ قراردادها» → dash contracts tab). Official registration: explain that ثبت الکترونیک رسمی اجاره (سامانه املاک و اسكان / خودنویس — srem.mrud.ir) صادرکنندهٔ کد رهگیری ۱۳ رقمی است — EDUCATIONAL pointer with rcNote «محلینو ثبت رسمی انجام نمی‌دهد؛ برای ثبت رسمی به سامانهٔ رسمی مراجعه کنید.» Never claim Mahalino produces an official tracking code. Mahalino's own code labeled «کد داخلی محلینو».

## S3 — Viewing checklist (research P0; informational + tie-in)
- Triggers: «چک‌لیست بازدید», «بازدید چی ببینم», «هنگام بازدید».
- Renders rcTable (بخش / چه چیز را ببینید): نور طبیعی، رطوبت/نم، فشار آب، برق و پریزها، کف و صافی، درب و پنجره، انباری/پارکینگ، همسایگی و رفت‌وآمد، حمل اثاثه (آسانسور/پله). Note: «چک‌لیست راهنمای عمومی است؛ در فلوی اجاره، چک‌لیست بازدید همان‌جا قابل علامت‌زدن است.» + chip «شروع فلوی اجاره» (existing). If rent vform checklist active → chip to jump (existing vform path).
- Pure information — no state changes.

## S4 — Budget-first entry (research P1)
- Pattern: money + اجاره/بخرم without hood («با ۱۵ میلیارد کجا اجاره کنم») → route to existing RINT afford paths (scAfford/scRentAfford) — verify current routing handles money-gated afford; if the phrase lacks «بتونم/توان خرید» keywords, extend the guard regex in the E23 route wrapper (additive matchers only, before `_rintRoute` fallback, NOT shadowing existing matches).

## S5 — Neighborhood duel (research P1)
- Pattern: «X یا Y» / «X بهتره یا Y» where both X,Y ∈ HOODS names (hoodsIn returns exactly 2) → render existing cmpHoodTable for the pair + rcNote (منبع کیلید/آگهی) + chips (امتیاز محله‌ها، شروع اجاره). Wired in E23 route wrapper; if only 1 hood → existing single-hood market path unchanged.

## S6 — imps-loop «تمام» fix (known limitation 6b)
- In ceVal's loop branch (wrap ceVal — E23 wraps like E21's did; chain ordering: E23 wraps E21's wrapped ceVal), if v==='تمام' or v==='تمام!' during an `st.loop` step → set remaining unrated loop items to the neutral importance (verify parseImportance scale; use the middle value, typically 3) + bot note «موارد باقی‌مانده با اهمیت متوسط لحاظ شد؛ بعداً با «بازگشت» قابل تغییر است.» → advance the flow (CE.i++, ceStep()). Must not alter non-loop behavior.
- Read the loop code carefully first (D.P[k]=parseImportance(v); CE.li++) and mirror its save()/renderCurrent() side effects exactly.

## S7 — Trigger & normalization expansion (additive only)
- E23 normalizer (applied INSIDE the existing ceSend wrapper chain — wrap E21's ceSend wrapper or preSend? read E21's ceSend wrapper structure and hook minimally) maps colloquial synonyms BEFORE the pipeline: کرایه→اجاره، میخرم/می‌خرم handled by existing normFa half-space (verify), خریدن→خرید only as whole-word, منطقه/محله‌سردار→محله (only «منطقه» as standalone word), خونه→خانه (already? check normFa), جوون→جوان skip (out of domain). Keep table small and safe; word-boundary via Persian-letter guards like R10's (^|[^خ]) pattern where needed.
- New EN additions to E21-style enNorm list: deposit→ودیعه exists; add landlord→موجر, tenant→مستأجر, agent→مشاور, agency→آژانس.
- Ambiguity handling: when a message matches BOTH a new scenario (S1/S2/S3/S5) and an active flow's numeric step — existing interruption logic already handles numeric steps (E21); ensure new intents are checked ONLY when E21's pipeline would otherwise fall through (hook placement: inside the ceSend wrapper chain AFTER preSend returns false — i.e., wrap ceSend: if preSend-intercepted, done; else try E23 scenarios; if matched, render + return; else original).

## Acceptance criteria
1. All 6 new behaviors verified in browser: trigger phrases (≥2 variants each), honest outputs, correct math (3% rate cross-checked against the existing rentAfford constant), no state corruption, zero console errors.
2. Regression: V0.22 walkthrough (dark, sessions, busy) + V0.21 core (rent slider flow, GRT hand-off, attachments, interruptions) still pass.
3. No shadowing: existing intents (market/compare/afford/gate/chips) respond exactly as before for their established trigger phrases.

## Constraints
Engine `v023-scenarios.js` (E23 namespace) inserted before boot marker of the V0.22 build; wraps only; build_v023.js = 3 structural replacements (marker/css/js) like V0.22; no CSS delta expected (reuse rcTable/rcConfirm/rcActs/rcNote); LF/UTF-8/node --check/no </script>; persistence only via CTX/save; honesty labels mandatory.
