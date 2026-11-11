# TOKEN PRICING — V0.29

Single source: `COSTS` (existing config) extended by V0.29; `E29.PRICING` holds labels/defaults. **No unapproved invented prices — all new entries are Token Agent proposals at market-consistent scale with existing configured tiers.**

| Key | Cost (tokens) | Service | Charging moment | Status |
|---|---|---|---|---|
| detail | 10 | راستی‌آزمایی آگهی | on demand | existing |
| visit | 20 | هماهنگی بازدید | before booking | existing |
| valuation | 40 | تخمین ارزش ملک | before execution | existing (configured, surfaced) |
| legal | 100 | گزارش حقوقی | before report | existing |
| escrow | 150 | پرداخت امانی | before activation | existing |
| bid | 20 | پیشنهاد پیمانکار | before submit | existing |
| stay | 30 | رزرو اقامتگاه | before booking | existing |
| **hood_detail** | **40** | تحلیل جامع محله | before execution | **new — proposal, pending approval** |
| **hood_compare** | **40** | مقایسهٔ دو محله | before execution | **new — proposal (parity with hood_detail)** |
| **contract_draft** | **60** | پیش‌نویس قرارداد | at document finalization (never on opening the workflow or entering info) | **new — proposal** |
| **term_ai** | **80** | تحلیل هوشمند اسناد فسخ | before AI processing (basic termination registration stays free) | **new — proposal** |

Free (never charged): گفت‌وگو، منو، اطلاعات پایهٔ محله، ثبت فسخ پایه، جمع‌آوری اطلاعات کاربر، یادآورها، کتابخانه/پروژه‌ها/اعلان‌ها.

## Transaction rules (implemented)
- Cost card **before execution** (service, cost, balance) — explicit پرداخت/انصراف chips.
- Unique `TXN-…` id per deduction; ledger entry `{t,d,c,cat,id,svc}`.
- Balance check pre-confirmation; insufficient → شارژ توکن path, nothing charged.
- In-flight guard prevents duplicate deductions per service.
- Failure/cancel → `E29.pay.refund(txn,svc,cost,reason)` → refund entry + notification.
- Duplicate deduction prevention: txns keyed, `library.byTxn` dedupe on artifacts.
- Low balance (<30) → `wallet.low` notification (deduped per day).

Open item for product owner: approve/adjust the four proposed prices.
