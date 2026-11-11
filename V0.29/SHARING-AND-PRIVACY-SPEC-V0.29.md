# SHARING AND PRIVACY SPEC — V0.29

## What can be shared
1. Entire conversation (current session messages).
2. A single assistant response (share button on each bot message).
3. Any Library artifact (contract/report/AI result) — without exposing the conversation that produced it.

## Flow
Share action → **dialog**: title, type, **exact preview** of shared content, sensitivity warning for contract/financial content («پیش از تأیید بازبینی کنید»), scope note. Confirm → snapshot created.

## Snapshot model (`S.shares[]`)
```js
{ id:'SH-…', token: 20-char random, etype, title,
  snapshot:{kind:'conversation'|'library', title, ts, msgs|item, onlyArtifact},
  createdAt, revoked, expiresAt (+30d), views:[{ts}] }
```

## Access & enforcement
- Read-only snapshot view at `#s/<token>` — frozen copy; future messages/contract versions are NOT exposed.
- Revocation stops access immediately (verified in browser); original conversation/library item untouched.
- Update only via explicit «بهروزرسانی اسنپشات» action.
- Unpredictable 20-char tokens; no internal record IDs as authorization.
- Recipients get only the snapshot: no account, other conversations, project instructions, private files, or wallet.
- Access logging: `views[]` counts.

## ⚠️ Honest infrastructure limitation (spec §12.7 compliance)
This application is **fully client-side** (localStorage, no backend). Therefore:
- `#s/<token>` links work **on this device/browser** only (real access control exists in-app: token validation + revocation).
- For sending content to other people, the dialog offers **«دریافت فایل اشتراک‌گذاری»** (standalone read-only HTML export) and **native share sheet** (link on supported devices).
- The dialog states this plainly and never describes the link as private/secure beyond the device scope. No fake public-link claims.

## Privacy defaults
- Everything private by default; sharing requires explicit confirm.
- Contracts/financial content always show the sensitivity warning + full preview.
- Shared conversation scope is exactly the selected messages — never other chats, profile info, or wallet data.
