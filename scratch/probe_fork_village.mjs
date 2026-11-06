// Probe: teleport tới 2 điểm nghi vấn tối qua (fork thị trấn + junction làng) và chụp
import { chromium } from 'playwright';
import fs from 'fs';

const OUT_DIR = 'scratch/audit_shots';
fs.mkdirSync(OUT_DIR, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:3001';

const placeAlong = (pts, s, lat = 0) => {
  let a = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1];
    const L = Math.hypot(dx, dz);
    if (L === 0) continue;
    if (a + L >= s) {
      const t = (s - a) / L;
      const x = pts[i][0] + dx * t, z = pts[i][1] + dz * t;
      const nx = dx / L, nz = dz / L;
      return { x: x + nx * lat, z: z + nz * lat, dirX: nx, dirZ: nz };
    }
    a += L;
  }
  return null;
};

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

  await page.goto(BASE + '/babylon', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=Thoát', { timeout: 90000 });
  await page.waitForTimeout(6000);

  // Điểm 1: fork thị trấn — đứng giữa nhánh chính ngay trước chỗ phân chia
  const fork = await page.evaluate(() => {
    const e = window.__babylonSim;
    const pts = e._townPts;
    const forkS = (e._townForkS || 437) - 6;
    // replicate placeAlongPolyline (engine dùng cùng hệ toạ độ)
    let a = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1];
      const L = Math.hypot(dx, dz);
      if (L === 0) continue;
      if (a + L >= forkS) {
        const t = (forkS - a) / L;
        return { x: pts[i][0] + dx * t, z: pts[i][1] + dz * t, dirX: dx / L, dirZ: dz / L };
      }
      a += L;
    }
    return null;
  });
  if (fork) {
    await page.evaluate((f) => {
      const e = window.__babylonSim;
      e.carX = f.x; e.carZ = f.z;
      e.heading = Math.atan2(f.dirX, -f.dirZ);
      e.speed = 0; e.keys = {};
    }, fork);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: OUT_DIR + '/h01_fork_drive_view.png' });
    console.log('FORK at', Math.round(fork.x), Math.round(fork.z));
  }

  // Điểm 2: vị trí g03 tối qua trong làng (320, -815) heading 61°
  await page.evaluate(() => {
    const e = window.__babylonSim;
    e.carX = 320; e.carZ = -815; e.heading = 61 * Math.PI / 180; e.speed = 0; e.keys = {};
  });
  await page.waitForTimeout(1800);
  const st2 = await page.evaluate(() => {
    const e = window.__babylonSim;
    return { road: e.activeRoad?.name, onRoad: e._playerLatOff, x: e.carX, z: e.carZ };
  });
  console.log('VILLAGE SPOT:', JSON.stringify(st2));
  await page.screenshot({ path: OUT_DIR + '/h02_village_g03_spot.png' });

  await browser.close();
  console.log('DONE');
};
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
