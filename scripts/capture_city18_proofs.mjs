import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/3f6fc1ca-4bc8-424b-b6fa-9c60cbb485b1';

if (!existsSync('docs/screenshots')) {
  mkdirSync('docs/screenshots', { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 850 } });
  const page = await context.newPage();

  console.log('1. Chụp Top-down Overview toàn bộ khu phố 18 nút (map=city18)...');
  await page.goto(`${BASE}/sim-dev?map=city18`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2000);

  // Đặt camera ở độ cao 450m nhìn xuống tâm khu vực (x = -40, z = 180)
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(-40, 520, 180);
    s.camera.lookAt(-40, 0, 180);
  });
  await sleep(1500);

  const shotOverview = 'docs/screenshots/city18-topdown-overview.png';
  await page.screenshot({ path: shotOverview });
  if (existsSync(ARTIFACT_DIR)) copyFileSync(shotOverview, path.join(ARTIFACT_DIR, 'city18-topdown-overview.png'));
  console.log('Saved', shotOverview);

  // Chuyển sang drive mode để chụp 5 góc nhìn Cabin
  console.log('Navigating to drive mode for Cabin views...');
  await page.goto(`${BASE}/sim-dev?map=city18&drive=1`);
  await page.waitForFunction(() => !!window.__simScene?.vehicle, null, { timeout: 60000 });
  await sleep(2500);

  // Helper đặt vị trí xe và camera buồng lái
  async function snapCabin(name, x, z, headingDeg) {
    console.log(`Capturing cabin view: ${name} at (${x}, ${z}, ${headingDeg}°)...`);
    await page.evaluate(({ px, pz, hdg }) => {
      const s = window.__simScene;
      const v = s.vehicle;
      if (!v) return;
      const rad = (hdg * Math.PI) / 180;
      v.state.x = px;
      v.state.z = pz;
      v.state.heading = rad;
      v.state.speed = 0;
      v.syncPose();
      const seat = v.seatPose();
      s.camera.position.set(seat.x, seat.y, seat.z);
      const fx = Math.sin(seat.yaw);
      const fz = Math.cos(seat.yaw);
      s.camera.lookAt(seat.x + fx * 15, seat.y - 0.05, seat.z + fz * 15);
    }, { px: x, pz: z, hdg: headingDeg });
    await sleep(1200);

    const shotPath = `docs/screenshots/${name}`;
    await page.screenshot({ path: shotPath });
    if (existsSync(ARTIFACT_DIR)) copyFileSync(shotPath, path.join(ARTIFACT_DIR, name));
    console.log('Saved', shotPath);
  }

  // 2. Cabin tại Vòng xuyến n06_round: từ r05_fried_main (x: -130, z: 125, heading: 180° nhìn về phía Nam vào vòng xuyến)
  await snapCabin('city18-cabin-roundabout.png', -130, 128, 180);

  // 3. Cabin tại Ngã tư Đèn n04_ampel: từ r03_to_ampel (x: 0, z: 255, heading: 0° nhìn về phía Bắc qua ngã tư đèn)
  await snapCabin('city18-cabin-ampel.png', 0, 255, 0);

  // 4. Cabin tại Mid-block Zebra n03_zebra: từ r02_to_zebra (x: 0, z: 165, heading: 0° nhìn về vạch Zebra)
  await snapCabin('city18-cabin-zebra.png', 0, 165, 0);

  // 5. Cabin tại Đường một chiều (Einbahnstraße) r14a_oneway_in: x: -265, z: 230, heading: 180° nhìn theo hướng 1 chiều
  await snapCabin('city18-cabin-oneway.png', -265, 230, 180);

  // 6. Cabin tại Đoạn đường cong Landstraße r20_land_east: x: 80, z: 433, heading: 255° nhìn ôm cua theo đường
  await snapCabin('city18-cabin-curve.png', 80, 433, 255);

  await browser.close();
  console.log('All 6 screenshots captured successfully!');
}

main().catch(console.error);
