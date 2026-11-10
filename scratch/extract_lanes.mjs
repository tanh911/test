// Extract A2 lanes từ laneGraph trong sim → public/diag_lanes.json
import { chromium } from 'playwright';
import fs from 'fs';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(12000);
  const lanes = await page.evaluate(() => {
    const r = window.refs.current;
    const lg = r.scene?.userData?.roadGen?.laneGraph;
    if (!lg) return null;
    const out = [];
    for (const lane of lg.lanes) {
      const rn = lane.roadName || '';
      if (!rn.includes('A 2') && !rn.includes('A2')) continue;
      const pts = lane.drivableWaypoints || lane.centerline;
      if (!pts || pts.length < 2) continue;
      out.push({ road: rn, pts: pts.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]) });
      if (out.length >= 40) break;
    }
    return out;
  });
  console.log('A2 lanes extracted:', lanes ? lanes.length : null);
  fs.writeFileSync('public/diag_lanes.json', JSON.stringify(lanes || []));
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
