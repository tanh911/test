import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Tuan Anh\\.gemini\\antigravity\\brain\\60daeb8c-3553-4bc0-b3c2-5c2b34552985';

async function main() {
  console.log('🚀 Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--ignore-gpu-blocklist',
      '--enable-webgl'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('[AutobahnDistrict]') || txt.includes('simCapture') || txt.includes('RoadGraph')) {
      console.log('BROWSER LOG:', txt);
    }
  });

  console.log('🌐 Navigating to http://localhost:5173/simulation ...');
  await page.goto('http://localhost:5173/simulation');

  await page.waitForFunction(() => typeof window.__simCapture !== 'undefined' || typeof window.refs !== 'undefined', { timeout: 15000 });
  console.log('✅ Simulation mounted!');

  console.log('🛣️ Loading autobahn_a9 map...');
  await page.evaluate(() => {
    if (window.refs && window.refs.current) {
      if (window.refs.current.setCurrentMapId) {
        window.refs.current.setCurrentMapId('autobahn_a9');
      }
      if (window.refs.current.loadMapIntoScene) {
        window.refs.current.loadMapIntoScene('autobahn_a9');
      }
    }
  });

  await page.waitForTimeout(4000);

  // Exact Autobahn A9 Motorway Spawn: x: 6790.38, z: -1319.93, heading: -0.1295 rad
  const spawnX = 6790.38;
  const spawnZ = -1319.93;
  const heading = -0.1295;
  const dirX = Math.sin(heading); // ~ -0.1291
  const dirZ = -Math.cos(heading); // ~ -0.9916

  // 1. Top View (300m height directly over Autobahn trunk)
  console.log('📸 Capturing Top View (300m height)...');
  await page.evaluate(({ sx, sz }) => {
    if (window.__simCapture) {
      window.__simCapture.setCamera(sx, 300, sz + 1, sx, 0, sz);
    }
  }, { sx: spawnX, sz: spawnZ });
  await page.waitForTimeout(1500);

  const topViewDataUrl = await page.evaluate(() => window.__simCapture ? window.__simCapture.capture() : null);
  if (topViewDataUrl && topViewDataUrl.length > 500) {
    const base64Data = topViewDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'autobahn_topview.png'), base64Data, 'base64');
    console.log('✅ Saved WebGL canvas autobahn_topview.png');
  }

  // 2. Low Ground View (3m height looking down Autobahn lanes)
  const lookX50 = spawnX + 50 * dirX;
  const lookZ50 = spawnZ + 50 * dirZ;
  console.log(`📸 Capturing Low Ground View (3m height looking towards ${lookX50.toFixed(2)}, ${lookZ50.toFixed(2)})...`);
  await page.evaluate(({ sx, sz, tx, tz }) => {
    if (window.__simCapture) {
      window.__simCapture.setCamera(sx, 3, sz, tx, 1.5, tz);
    }
  }, { sx: spawnX, sz: spawnZ, tx: lookX50, tz: lookZ50 });
  await page.waitForTimeout(1500);
  const lowViewDataUrl = await page.evaluate(() => window.__simCapture ? window.__simCapture.capture() : null);
  if (lowViewDataUrl && lowViewDataUrl.length > 500) {
    const base64Data = lowViewDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'autobahn_lowview.png'), base64Data, 'base64');
    console.log('✅ Saved WebGL canvas autobahn_lowview.png');
  }

  // 3. Gantry View (Looking 150m ahead along Autobahn)
  const lookX150 = spawnX + 150 * dirX;
  const lookZ150 = spawnZ + 150 * dirZ;
  console.log(`📸 Capturing Gantry / Sign View looking towards ${lookX150.toFixed(2)}, ${lookZ150.toFixed(2)}...`);
  await page.evaluate(({ sx, sz, tx, tz }) => {
    if (window.__simCapture) {
      window.__simCapture.setCamera(sx, 3.5, sz, tx, 4.5, tz);
    }
  }, { sx: spawnX, sz: spawnZ, tx: lookX150, tz: lookZ50 });
  await page.waitForTimeout(1500);
  const gantryViewDataUrl = await page.evaluate(() => window.__simCapture ? window.__simCapture.capture() : null);
  if (gantryViewDataUrl && gantryViewDataUrl.length > 500) {
    const base64Data = gantryViewDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'autobahn_gantryview.png'), base64Data, 'base64');
    console.log('✅ Saved WebGL canvas autobahn_gantryview.png');
  }

  // 4. Default Chase / Cockpit View
  console.log('📸 Capturing Standard Game Chase View...');
  await page.evaluate(() => {
    if (window.__simCapture) {
      window.__simCapture.resetCamera();
    }
  });
  await page.waitForTimeout(1500);
  const chaseViewDataUrl = await page.evaluate(() => window.__simCapture ? window.__simCapture.capture() : null);
  if (chaseViewDataUrl && chaseViewDataUrl.length > 500) {
    const base64Data = chaseViewDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'autobahn_chaseview.png'), base64Data, 'base64');
    console.log('✅ Saved WebGL canvas autobahn_chaseview.png');
  }

  await browser.close();
  console.log('🎉 Screenshot capture complete!');
}

main().catch(err => {
  console.error('❌ Capture script failed:', err);
  process.exit(1);
});
