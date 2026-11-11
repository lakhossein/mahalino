/* Extra real-browser regression checks against the unmodified V0.30 artifact. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const url = process.env.QA_BASE_URL || 'http://127.0.0.1:8730/Mahalino%2BV0.30.html';
const out = process.env.QA_RESULTS_DIR || process.cwd();
const results = [];
const diagnostics = { pageErrors: [], consoleErrors: [], requestsFailed: [], screenshots: [] };

function record(name, passed, detail) {
  const test = { name, result: passed ? 'PASS' : 'FAIL', detail: detail || null };
  results.push(test);
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(detail || '').slice(0, 500)}`);
}
async function check(name, run) {
  try {
    const outcome = await run();
    record(name, Boolean(outcome.ok), outcome.detail);
  } catch (e) {
    record(name, false, { exception: String(e && e.stack || e) });
  }
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on('pageerror', e => diagnostics.pageErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') diagnostics.consoleErrors.push(m.text()); });
    page.on('requestfailed', r => diagnostics.requestsFailed.push({ url: r.url(), error: r.failure() }));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1400);

    await check('Browser boots E30 0.30', async () => {
      const v = await page.evaluate(() => ({ booted: window.__BOOTED, ver: window.E30 && E30.VER }));
      return { ok: v.booted === true && v.ver === '0.30', detail: v };
    });

    await check('Toman range conversion is mathematically correct', async () => {
      const v = await page.evaluate(() => parseMoneyRangeFA('۴۰۰ تا ۵۵۰ میلیون تومان'));
      return { ok: v.ok && v.value === '4000000000|5500000000', detail: v };
    });

    await check('Explicit floor constraint filters high-floor rentals', async () => {
      const v = await page.evaluate(() => {
        const listing = { beds: 2, elev: true, park: true, floor: 6, m2: 100, rent: 100000000, dep: 500000000 };
        const demand = { P: { beds: 2, floor: 'low', elev: true, park: true }, B: { rentB: 150000000, depB: 600000000 } };
        return E30.flowsAPI.rentPass(listing, demand);
      });
      return { ok: v === false, detail: { acceptedAnExcludedListing: v } };
    });

    const viewports = [
      ['desktop-1280', 1280, 800], ['mobile-390', 390, 844],
      ['mobile-360', 360, 800], ['tablet-820', 820, 1180]
    ];
    for (const [name, width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(150);
      await check(`No horizontal overflow at ${name}`, async () => {
        const d = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, viewport: innerWidth }));
        return { ok: d.doc <= d.viewport + 2 && d.body <= d.viewport + 2, detail: d };
      });
      try {
        const filename = path.join(out, `${name}-landing.png`);
        await page.screenshot({ path: filename, animations: 'disabled', timeout: 15000 });
        diagnostics.screenshots.push(path.basename(filename));
      } catch (error) {
        diagnostics.screenshots.push(`${name} screenshot failed: ${String(error.message)}`);
      }
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await check('Landing service cards are keyboard operable', async () => {
      const d = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('#v-splash .spl-card')];
        const inaccessible = cards.filter(el => el.getAttribute('role') === 'button' && el.tabIndex < 0);
        return { total: cards.length, inaccessible: inaccessible.length };
      });
      return { ok: d.total > 0 && d.inaccessible === 0, detail: d };
    });

    await check('No payment without service execution callback', async () => {
      const d = await page.evaluate(() => {
        doLogin('Browser QA Test');
        S.tokens = 1000;
        save();
        const before = S.tokens;
        E30.pay.begin({ key: 'hood_detail', title: 'Browser audit callback check' });
        const payId = S.paySession && S.paySession.payId;
        E30.pay.go(payId);
        return {
          before, after: S.tokens,
          state: S.paySession && S.paySession.state,
          executed: S.paySession && S.paySession.executed,
          callbackProvided: false
        };
      });
      return { ok: d.before === d.after || d.executed === false && d.state !== 'completed', detail: d };
    });

    await check('No uncaught JS page errors during checked scenarios', async () => ({
      ok: diagnostics.pageErrors.length === 0,
      detail: { errors: diagnostics.pageErrors.slice(0, 15) }
    }));

    console.log('NETWORK/CONSOLE DIAGNOSTICS', JSON.stringify({
      consoleErrors: diagnostics.consoleErrors.slice(0, 15),
      requestsFailed: diagnostics.requestsFailed.slice(0, 15)
    }));
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'regression-results.json'), JSON.stringify({ results, diagnostics }, null, 2));
  }
  const fail = results.filter(x => x.result === 'FAIL').length;
  console.log(`REGRESSION SUMMARY ${results.length - fail} passed, ${fail} failed, ${results.length} checks`);
  process.exitCode = fail ? 1 : 0;
})().catch(err => {
  console.error('REGRESSION HARNESS CRASH', err);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'regression-harness-error.txt'), String(err && err.stack || err));
  process.exitCode = 2;
});
