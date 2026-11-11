# PROJECT MANAGEMENT SPEC — V0.29

Model (`S.projects[]`):
```js
{ id:'PRJ-…', name, desc, instructions, color, pinned, archived,
  createdAt, chatIds:[], artifacts:[] }
```
Conversation link: `S.chats[i].projectId`. Library link: `S.library[i].projectId` (back-filled by chatId or matching sourceTitle when the chat was archived after the artifact was created).

## Features (all verified in browser)
- Create (name+desc) from sidebar «جدید» or panel; rename; per-project instructions (used as conversational context); color dot identity.
- Pin/unpin; archive toggle; delete (explicit confirm) — conversations and library artifacts survive, links cleared only.
- Sidebar section: pinned first, expand/collapse per project (state persisted in `S.ui.prjOpen`), nested conversation rows open the archived chat.
- Panel: conversations list (open/remove), related library artifacts (open), «افزودن گفت‌وگوی موجود» picker (projectless chats), instructions editor.
- New chats via گفت‌وگوی جدید are projectless until assigned — no forced grouping.
- Search projects: sidebar shows all with readable names in expanded mode; panel lists all (archived tagged).
