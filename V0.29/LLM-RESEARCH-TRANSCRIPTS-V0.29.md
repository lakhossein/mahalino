# LLM RESEARCH TRANSCRIPTS — V0.29

Research performed with LLM agents (spec §4.4). Runtime is deterministic — research and capability are clearly distinguished (spec §4.5).

| Agent | File | Personas | Transcripts |
|---|---|---|---|
| Rental + Purchase | `research/persona-rental-purchase.md` | 16 | 48 |
| Sales + Owner | `research/persona-sales-owner.md` | 12 | 36 |
| Neighborhood + Valuation + Investment | `research/persona-neighborhood-valuation-investment.md` | 18 | 54 |
| Contract + Termination + Payment | `research/persona-contract-termination-payment.md` | 17 | 51 |
| **Total** | 4 documents (~4,500 lines) | **63** | **189** |

Each persona entry contains: definition, motivation, circumstances, priorities, initial conversational approach, 5–8 adaptive questions, questions-to-avoid (with reasons), required/optional info field IDs, conditional questions, alternative paths, completion criteria, recovery scenarios, and 3 transcripts (normal success / incomplete-ambiguous / preference change) with inline `[decision point]` annotations.

## Method
Each agent simulated real multi-turn Persian conversations (user-persona ↔ assistant), annotated branching points, and consolidated cross-persona rules (budget fallbacks, «ما» disambiguation, purpose-driven question sets, duration-driven switching, location-change revalidation, rahn/rent sanity ratio, sum-exactness gates, sensitivity warnings before sharing).

## Runtime honesty
- No runtime LLM API exists in the app. `E29.llm` adapter is present and disabled by default; configuring a real endpoint enables `complete(history, cb)`.
- Research transcripts drive the deterministic slot frames, persona tones, and question-selection logic — they are not live model responses.
