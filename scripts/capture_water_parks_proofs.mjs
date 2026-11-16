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

  console.log('1. Chụp các góc nhìn tự do (FlyCam) với flyUpdate = null...');
  await page.goto(`${BASE}/sim-dev?map=city18`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2500);

  async function snapFreeCam(name, posX, posY, posZ, targetX, targetY, targetZ) {
    console.log(`Capturing freecam: ${name}...`);
    await page.evaluate(({ px, py, pz, tx, ty, tz }) => {
      const s = window.__simScene;
      s.camera.userData._flyUpdate = null;
      s.camera.position.set(px, py, pz);
      s.camera.up.set(0, 1, 0);
      s.camera.lookAt(tx, ty, tz);
      s.camera.updateMatrixWorld();
    }, { px: posX, py: posY, pz: posZ, tx: targetX, ty: targetY, tz: targetZ });
    await sleep(1000);

    const shotPath = `docs/screenshots/${name}`;
    await page.screenshot({ path: shotPath });
    if (existsSync(ARTIFACT_DIR)) copyFileSync(shotPath, path.join(ARTIFACT_DIR, name));
    console.log('Saved', shotPath);
  }

  // 1.1 Topdown overview toàn thành phố nhìn thấy sông Spree chạy ngang và 2 công viên xanh
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.userData._flyUpdate = null;
    s.camera.position.set(-20, 520, 200);
    s.camera.up.set(0, 0, -1);
    s.camera.lookAt(-20, 0, 200);
    s.camera.updateMatrixWorld();
  });
  await sleep(1200);
  const shotOverview = 'docs/screenshots/city18-topdown-water-parks.png';
  await page.screenshot({ path: shotOverview });
  if (existsSync(ARTIFACT_DIR)) copyFileSync(shotOverview, path.join(ARTIFACT_DIR, 'city18-topdown-water-parks.png'));
  console.log('Saved', shotOverview);

  // 1.2 Phối cảnh trên cao nhìn cầu Chausseebrücke qua sông Spree
  await snapFreeCam('city18-bridge-spree-aerial.png', 45, 20, 335, 0, 0, 335);

  // 1.3 Phối cảnh công viên bờ sông Lustgarten am Spreeufer
  await snapFreeCam('city18-park-lustgarten.png', 70, 28, 255, 70, 0, 310);

  // 1.4 Phối cảnh Großer Stadtpark (khu công viên trung tâm 60m x 110m)
  await snapFreeCam('city18-park-stadtpark.png', 55, 38, 105, 55, 0, 185);

  // 2. Chuyển sang drive mode để chụp Cabin view trực tiếp trên cầu Chausseebrücke
  console.log('2. Chuyển sang drive mode để chụp Cabin view trên cầu...');
  await page.goto(`${BASE}/sim-dev?map=city18&drive=1`);
  await page.waitForFunction(() => !!window.__simScene?.vehicle, null, { timeout: 60000 });
  await sleep(2500);

  await page.evaluate(() => {
    const s = window.__simScene;
    const v = s.vehicle;
    if (!v) return;
    v.state.x = 0;
    v.state.z = 328;
    v.state.heading = 0; // Hướng Bắc
    v.state.speed = 0;
    v.syncPose();

    // Click đổi sang góc nhìn buồng lái (Cabin) nếu đang ở chế độ Sau xe
    if (s.cycleCameraMode) {
      for (let i = 0; i < 3; i++) {
        const text = document.body.innerText;
        if (text.includes('Buồng lái')) break;
        s.cycleCameraMode();
      }
    }
  });
  await sleep(1500);

  const shotCabin = 'docs/screenshots/city18-bridge-spree-cabin.png';
  await page.screenshot({ path: shotCabin });
  if (existsSync(ARTIFACT_DIR)) copyFileSync(shotCabin, path.join(ARTIFACT_DIR, 'city18-bridge-spree-cabin.png'));
  console.log('Saved', shotCabin);

  await browser.close();
  console.log('All 5C-2 screenshots captured successfully!');
}

main().catch(console.error);
