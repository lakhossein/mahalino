# CONVERSATION SCENARIOS — V0.29

Executable scenarios implemented by `E29.intel` (derived from the 189 research transcripts). Dialogue in Persian, engine behavior annotated.

## S1 — Rental, couple (verified end-to-end in browser)
```
User: سلام، می‌خوام یه خونه اجاره کنم
Engine: [adaptive start, persona=professional→couple] greets + asks budget (one question)
User: حدود چهارصد تا پانصد میلیون
Engine: rent_budget=[400M,500M rial] ✓ → asks deposit
User: ودیعه بدون سقف
Engine: dep skipped → asks household
User: ما دو نفریم
Engine: household=couple ✓ → asks rooms
User: دو خواب → rooms=2
User: مهم نیست (عمر بنا) → skipped
User: حداقل شصت متر → m2=60
User: پارکینگ و اسانسور → preferences=[parking,elevator]
Engine: [complete] profile card rendered → hand-off to deterministic rent engine,
        P.metro/work defaults by persona → jump to hoods results (12 cards)
```

## S2 — Previous-info confirmation (Workstream B)
```
Engine: دفعهٔ پیش بودجهٔ اجاره‌تان را ۴۰۰ تا ۵۰۰ میلیون گفته بودید — هنوز معتبر است؟
[chips: همان است / تغییر کرده]
همان است → slot kept, continue
تغییر کرده → stale value archived, new value requested
```

## S3 — Correction / out-of-order
- Any message can fill the first matching pending slot (any order).
- Profile card «اصلاح» chip → fix-mode: «پاک کن» clears; new value replaces (old → stale).

## S4 — Ambiguity
- «نمی‌دانم / مطمئن نیستم» (budget) → 'اشکالی ندارد — هر وقت مشخص شد بگویید' and continue.
- Money-like text is never consumed by count slots (guard).

## S5 — Paid deep neighborhood analysis (verified)
```
[hood info modal] → تحلیل کامل → cost card (تحلیل جامع محله — ۴۰ توکن، موجودی ۵۰۰)
پرداخت و اجرا → TXN id, −40 tokens, report artifact → Library (تحلیل جامع محلهٔ …)
→ notification 'تحلیل محله آماده شد' → deep link opens library detail
انصراف → 'هزینه‌ای کسر نشد'
```

## S6 — Contract drafting + termination AI (verified)
```
rent flow → visit (−20) → contract bubble form (parties/property/approvals)
ثبت داخلی → cost card (پیش‌نویس قرارداد — ۶۰ توکن) → confirm → contract registered
→ Library contract artifact + notification
فسخ → terminated + offer chip 'تحلیل هوشمند اسناد' → cost card (۸۰ توکن)
→ confirm → ai_process artifact + notification
```

## S7 — Workflow milestone → Library → resume
- Milestone reached during rent (s6)/buy (s5) → `wf_progress` item saved with snapshot of `data`.
- Library card → «ادامه از همین‌جا» → flow state restored exactly, conversation resumes.

## S8 — Free Q&A remains free
- Casual market questions via RINT router unchanged; only deep/complex analyses are paid (upsell with exact price before execution).
