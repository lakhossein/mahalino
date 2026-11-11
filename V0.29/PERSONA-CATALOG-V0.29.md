# PERSONA CATALOG — V0.29

Full research with dialogue transcripts lives in `research/` (Phase 1). This catalog is the runtime summary used by `E29.intel`.

## Workflow × Persona coverage (63 personas)

| Workflow | Personas (IDs in research files) | Runtime archetype |
|---|---|---|
| Rental (8) | R-STU, R-FAM, R-NMC, R-SPL, R-RMT, R-REL, R-RET, R-STR | student, family, couple, professional, roommates, relocating, retiree, shortterm |
| Purchase (8) | P-FTB, P-FUP, P-YCP, P-INV, P-PIN, P-REB, P-FMB, P-BCB | firsttime, upgrader, couple, investor, professional-investor, relocating, family-buyer, budget-constrained |
| Sales (6) | quick-cash, max-value, multi-property, investor-exit, relocating-seller, inherited co-owners | urgency fast/maxvalue |
| Ownership (4) | first-time landlord, professional landlord, dual-asset, remote owner + GRT stable-income | general |
| Neighborhood (8) | N-FAM, N-STU, N-PRO, N-CPL, N-HOM, N-INV, N-OWN, N-ACC | family/student/professional/couple/buyer/investor/owner/accessibility |
| Valuation (5) | V-OWN, V-SEL, V-BUY, V-INV, V-POR | owner/seller/buyer/investor/portfolio |
| Investment (5) | I-IND, I-PRO, I-POR, I-FIR, I-CMP | individual/professional/portfolio/firsttime/comparing |
| Contract (6) | C-LL, C-TN, C-BY, C-SL, C-AG, C-NX | owner/tenant/buyer/seller/agent/no-experience |
| Termination (6) | T-TN, T-LL, T-MU, T-DG, T-DA, T-FI | tenant/landlord/mutual/dispute/doc-analysis/financial |
| Payment (5) | P-BY, P-SL, P-LL, P-TN, P-ES | buyer/seller/landlord/tenant/escrow |

## Runtime persona classifier (`E29.intel.personaOf`)
Signals from the progressive profile (household, occupation, housing situation, motivation, purpose):
- rent → `student | family | couple | roommates | retiree | relocating | professional | shortterm`
- buy → `investor | firsttime | upgrader | relocating | buyer`

## Per-archetype behavior deltas (implemented)
| Archetype | Opening | Priority defaults | Tone |
|---|---|---|---|
| student | نزدیک دانشگاه یا محل کار؟ | metro=4, school=1, work=4 | ساده و سریع |
| family | مدرسه و سکوت مهم است | school=4, metro=2 | گرم و باحوصله |
| couple | برای دو نفر یک خواب کافی است؟ | default | دوستانه |
| roommates | سهم هر نفر چطور حساب می‌شود؟ | metro=4 | دقیق در تقسیم هزینه |
| retiree | حمل‌ونقل راحت و طبقه؟ | work=1, metro=3 | محترمانه و شمرده |
| relocating | کار/تحصیل کدام سمت شهر است؟ | work=4 | راهنما |
| professional | مترو مهم‌تر است یا سکوت؟ | metro=4 | کارآمد |
| investor | سود اجاره یا رشد قیمت؟ | imps منصفانه، ppm محور | داده‌محور |
| firsttime | قدم‌به‌قدم همراهتان هستم | default | آموزشی |
| upgrader | ملک فعلی را هم می‌فروشید؟ | default | مسلط به بازار |

Question-to-avoid rules and conditional paths per persona are encoded in `research/*.md` (each persona: 5–8 adaptive questions, 3–5 avoid-list, required/optional field IDs, completion criteria, recovery scenarios).
