// Audit 3 map: đèn / biển / vạch / bot / scenarios — chạy lần lượt Stadt → Land → Autobahn
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 150)));

await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 60000 });

const openMenu = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Menu/.test(x.innerText) && x.innerText.length < 12); if (b) b.click(); });
const pick = (pat) => page.evaluate((pp) => { const c = [...document.querySelectorAll('div[title]')].find(d => d.getAttribute('title').includes(pp)); if (c) c.click(); }, pat);
const wait = () => page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 120000 });
const resume = async () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Tiếp tục bài thi/.test(x.innerText)); if (b) b.click(); });

const audit = (name) => page.evaluate((nm) => {
  const r = window.refs.current;
  const mgr = r.trafficAIManager;
  let counts = { sign: 0, light: 0, gantry: 0, crosswalk: 0, cone: 0, Leitpfosten: 0 };
  r.scene.traverse(o => {
    const n = o.name || '';
    if (/sign|schild|vorfahrt|stop|zebra_sign|vz_/i.test(n)) counts.sign++;
    if (/trafficLight|ampel/i.test(n)) counts.light++;
    if (/gantry/i.test(n)) counts.gantry++;
    if (/crosswalk|zebra/i.test(n)) counts.crosswalk++;
    if (/cone/i.test(n)) counts.cone++;
    if (/leitpfosten/i.test(n)) counts.Leitpfosten++;
  });
  const scen = (r.currentScenarios || []).map(s => s.type);
  return {
    mapId: r.currentMapId,
    bots: (mgr?.botCars || []).length,
    lightGroups: (mgr?.sceneLightGroups || []).length,
    scenCount: scen.length,
    scenSample: [...new Set(scen)].slice(0, 10),
    counts
  };
}, name);

const run = async (pat, name, settle) => {
  await resume(); await openMenu(); await page.waitForTimeout(700);
  await pick(pat); await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")'); await wait(); await page.waitForTimeout(settle);
  const a = await audit(name);
  console.log('══', name, JSON.stringify(a, null, 1));
  await page.screenshot({ path: `scratch/audit_shots/pp_washout/audit_${name}.png` });
};

await run('Stadt', 'stadt', 5000);
await run('land.pbf', 'land', 6000);
await run('autobahn.pbf', 'autobahn', 8000);
console.log('pageerrors:', errors.length, errors.slice(0, 3));
await browser.close();
