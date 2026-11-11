# LIBRARY SPEC + ARTIFACT MODEL — V0.29

## Artifact model (`S.library[]`)
```js
{ id:'LIB-…', title, type, summary,
  artifact: { … },            // the real generated content (see below)
  createdAt, updatedAt, status:'complete'|'progress',
  sourceChat, sourceTitle,     // original conversation pointer
  projectId, workflowId, entityId,
  txnId, tokenCost,            // token transaction linkage
  versions:[{ts,note,artifact}],
  sharing:{shared} }
```

| type | tab | artifact payload |
|---|---|---|
| contract | قراردادها | `{doc: conSnapshot, kind}` — full contract document |
| hood_analysis | تحلیل محله | `{html, hood, mode}` — full report HTML |
| ai_process | پردازش هوشمند | `{html}` — analysis result |
| valuation/invest | ارزش‌گذاری و سرمایه‌گذاری | `{data\|html}` |
| other | سایر خروجی‌ها | generic |
| wf_progress | گردش‌های در جریان | `{m, step, data snapshot, done}` |

## Automatic saving rules (spec §8.2)
- Saved **only after successful generation**, keyed by `txnId` (`byTxn` dedupe → no duplicates).
- Failed/cancelled paid ops create nothing (confirmation precedes execution).
- Refunded ops keep artifact + accurate transaction history (no silent deletion).
- Multiple related files → one item (grouped).
- Cap 200 items; user-facing delete with explicit confirm — never touches source conversation, contract record, or transaction history.

## UI
- Slide-over panel, **7 tabs** over one dataset: همه / قراردادها / تحلیل محله / ارزش‌گذاری و سرمایه‌گذاری / پردازش هوشمند / سایر خروجی‌ها / گردش‌های در جریان (counters on tabs).
- Search box; responsive card grid; cards show type badge, title, summary, date, token cost, version count, status.
- Card click → detail: contract = full contract info/terms/financials/versions/transaction/PDF/open-chat; report = rendered artifact + txn + versions; wf = progress bar + collected data + resume.
- Actions per item: open, PDF (print dialog), rename, delete, share, txn view, open original conversation.
- Empty states per tab.

## In-progress workflows (spec §8.6)
- Milestones: rent step 6, buy step 5 → auto-save snapshot with summary + progress %.
- «ادامه از همین‌جا» restores exact `data` into the live flow (`wfOf` or active), returns to chat, no info lost. Trivial interactions are not saved.

## Persistence
localStorage via `S` — durable locally. Documented limitation: no cross-device sync (no backend).
