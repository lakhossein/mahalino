# WORKFLOW × PERSONA MATRIX — V0.29

Compact matrix. Full field-level matrix (13 attributes per cell) is in `research/*.md`.

Legend: ✅ dedicated runtime variant implemented · 📋 researched + documented (deterministic engine serves via archetype/tone + slot frame)

| Workflow \ Persona group | Runtime archetypes | Phase coverage | Slot frame | Paid gates | Milestone→Library |
|---|---|---|---|---|---|
| Rental | 8 (student…shortterm) | ✅ | `FRAMES.rent` (7 slots) | listing detail, visit | s6 |
| Purchase | 5 (investor…buyer) | ✅ | `FRAMES.buy` (6 slots) | legal, escrow, valuation | s5 |
| Sales | urgency fast/maxvalue | 📋 (sell frame) | `FRAMES.sell` (4 slots) | valuation | — |
| Ownership/GRT | general | 📋 documented | — (page+chat flow) | management fee | — |
| Neighborhood | 8 | ✅ (paid deep-analysis) | — | hood_detail 40 | — |
| Valuation | 5 | 📋 documented | — | valuation 40 (configured) | — |
| Investment | 5 | 📋 documented | — | escrow 150 | — |
| Contract | role×type | ✅ (contract_draft gate) | `FRAMES.contract` (2 slots) | contract_draft 60 | — |
| Termination | 6 | ✅ (term_ai gate) | — | term_ai 80 | — |
| Payment | 5 | 📋 documented | — | escrow 150 | — |
| Reminders | any subject | ✅ (sidebar manager) | — | free | — |

## Cross-cutting rules (from research, implemented)
1. Confirm-before-reuse of stored profile values (Workstream B).
2. Latest self-correction wins; re-confirmation required after financial edits.
3. «فکر کنم/هرچی بشه» → ambiguity path, never blocks; slots may stay empty.
4. Money-like text never parsed as count; count texts never parsed as money.
5. One meaningful question per turn; no repeats of answered slots; out-of-order accepted.
6. Financial/contract validation stays deterministic (`ceVal`, `validNationalId`, postal validation).
7. Workflow switching preserves profile (rent↔buy↔sell share `S.profile`).
