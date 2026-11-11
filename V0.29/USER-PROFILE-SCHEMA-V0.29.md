# USER PROFILE SCHEMA — V0.29

Persisted at `S.profile` (localStorage `mahalino_v29`).

```js
S.profile = {
  confirmed: { [slotId]: value },   // explicitly given or confirmed by user
  inferred:  { [slotId]: value },   // classifier guesses (never blocking)
  stale:     { [slotId]: value },   // previous values replaced by corrections
  log: [ { t, slot, val, confirmed } ]   // ≤80 entries
}
```

## Slots
| Slot | Type | Source |
|---|---|---|
| rent_budget, dep_budget, buy_budget, expected_price | [lo,hi] rial | parsers |
| household | single/couple/roommates/family | parser |
| family_members | number | parser |
| rooms, m2, prop_age, prop_area | number | parser |
| purpose | residence/invest | parser |
| sale_urgency | fast/maxvalue | parser |
| preferences | [parking,elevator,balcony,quiet,metro,minm2:N] | parser |
| persona | archetype id | classifier (inferred) |
| occupation, age_range, housing_situation, motivation | string | reserved (research schema) |

## Rules
- confirmed > inferred (classifier writes only to `inferred`; user answers promote to `confirmed`).
- Correction moves old value to `stale` and logs the change.
- UI: in-chat profile card (max 7 rows) with per-slot «اصلاح» → fix mode; «پاک کن» deletes.
- Workstream B: any confirmed slot may trigger «پارسه گفتی X — هنوز معتبره؟» with همان است/تغییر کرده chips; «تغییر کرده» → fix mode.
- Persistence: whole `S` via `save()`; survives reload (verified).
