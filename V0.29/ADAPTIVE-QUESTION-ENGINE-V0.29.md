# ADAPTIVE QUESTION ENGINE — V0.29 (`E29.intel`)

## Architecture
```
free text → E29.init ceSend wrapper → E29.intel.route(text)
  ├─ applyFix()        profile correction mode («پاک کن» clears slot)
  ├─ COL.active?       → feed(text): first matching pending slot wins (any order)
  └─ natural starters  → start('rent'|'buy'|'sell'|'contract') — no fixed questionnaire
```

## Slot frames
| Frame | Slots (priority order) |
|---|---|
| rent | rent_budget* → dep_budget → household* → rooms → m2 → prop_age → preferences |
| buy | buy_budget* → purpose* → rooms → m2 → prop_age → preferences |
| sell | prop_area* → sale_urgency* → prop_age → expected_price |
| contract | contract_type* → party_role* |

`*` = required. Conditional slots skipped via `cond(data)`. Skips: «بدون سقف»، «مهم نیست»، «فرقی نداره» → filled=null, never re-asked.

## Parsers (reuse V0.28 Persian NLU)
- `moneyRange`: pre-strip حدود/حداقل/حداکثر → `parseMoneyRangeFA` → [lo,hi] rial; single value → parseMoneyFA; «نمی‌دانم» → ambiguity.
- `count`: money-guard (rejects میلیون/تومان…), strip حدود/حداقل → parseCountFA, sane bounds 0–10000.
- `household`: single/roommates/couple/family keyword rules («ما دو نفریم»→couple, «ما» alone→ambiguity).
- `purpose`, `urgency`, `ctype`, `role`, `prefs` (parking/elevator/balcony/quiet/metro/minm2).

## Question selection
Next question = first pending slot (order-adaptive). Answers fill **any** pending slot (first match per message). Contradictions: new value replaces, old → `S.profile.stale`. Repeats impossible (filled slots skipped).

## Completion & hand-off
All required slots resolved → profile card → deterministic hand-off:
- rent: inject `D.B` (depB/rentB), `D.P` (beds/persona/m2/age/elev/park + importance defaults per persona), `_depSet/_rentbSet` → `ceJump('hoods')`.
- buy: inject `D.budg`, `D.PR` (beds/m2/age/elev/park/balc), purpose defaults → `ceJump('hoods')`.
No question is re-asked; financial validation stays deterministic downstream.

## Progressive profile schema → see USER-PROFILE-SCHEMA-V0.29.md
## Milestones → see LIBRARY-SPEC-V0.29.md §6
