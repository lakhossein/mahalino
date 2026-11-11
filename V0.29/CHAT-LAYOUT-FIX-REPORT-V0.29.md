# CHAT LAYOUT FIX REPORT — V0.29

## Root cause (V0.28)
- `main{padding:22px 20px 56px}` + `.ch-main{height:calc(100vh - 52px)}` + `body{min-height:100vh}` → total content height = 100vh + ~78px → **the document scrolled ~78px on the chat page**.
- `html{scroll-behavior:smooth}` left residual animation offsets (measured 11px drift after programmatic scroll).
- The 640px `min-height` from the design-system reference lived in the dormant `.ds-chat-app` layer — not applied to live DOM, therefore not the cause here; it stays dormant.

## Fix (src/v29.css §1)
```css
html:has(> body.widemain){overflow:hidden;scroll-behavior:auto}
body.widemain{overflow:hidden;height:100dvh}
body.widemain main{padding:0 16px}
body.widemain .app{gap:0;align-items:stretch;height:calc(100dvh - 52px)}
body.widemain #appwrap>div{min-width:0;min-height:0;height:100%;overflow:hidden}
body.widemain .side{top:60px;max-height:calc(100dvh - 68px)}
body.widemain .ch-main{height:calc(100dvh - 52px)}
.ch-b{overscroll-behavior:contain}
```
Legacy page views (rent/buy/etc.) keep their document scroll by design.

## Verification (programmatic, Chromium 1440×900)
- `window.scrollTo(80)` with 40 injected long messages → `window.scrollY` stays **0** (document cannot move).
- Transcript `.ch-b` scrollHeight 3332 vs clientHeight 702 → internal scroll works (`scrollTop` moves).
- Composer and topbar remain visible; sidebar scrolls independently (`max-height` + internal overflow).
- Mobile: `100dvh` handles dynamic viewport; drawer overlay locks background scroll.
