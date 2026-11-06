// Diag: tại sao mount timeout — capture console + refs state
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message.slice(0, 300)}`));
await page.goto('http://localhost:3001/simulation?pp=none', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(4000);
  const st = await page.evaluate(() => ({
    hasRefs: !!window.refs,
    hasCurrent: !!window.refs?.current,
    hasLoad: typeof window.refs?.current?.loadMapIntoScene,
    bodyText: document.body.innerText.slice(0, 200).replace(/\n/g, ' | ')
  }));
  console.log(`t=${(i + 1) * 4}s`, JSON.stringify(st));
  if (st.hasLoad === 'function') break;
}
console.log('--- LOGS ---');
logs.slice(0, 30).forEach(l => console.log(l));
await browser.close();
