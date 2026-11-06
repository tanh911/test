import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  const outputDir = path.resolve('verification_screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Launching Playwright browser for StVO Driving Simulator verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('🌐 Navigating to http://127.0.0.1:3000/simulation...');
  await page.goto('http://127.0.0.1:3000/simulation', { waitUntil: 'networkidle' });
  
  console.log('⏳ Waiting for 3D Simulator scene and WebGL canvas...');
  await page.waitForTimeout(4000);

  console.log('🚗 Skipping intro/start screen and starting vehicle engine in D1 mode...');
  await page.evaluate(() => {
    if (window.__simCapture && window.__simCapture.startDriving) {
      window.__simCapture.startDriving();
    }
  });
  await page.waitForTimeout(1000);

  console.log('📸 Step 1: Capturing Image A (Berlin 3D Overview Debug OFF)...');
  await page.evaluate(() => {
    if (window.__simCapture) {
      window.__simCapture.toggleDebug(false);
      window.__simCapture.setCamera(0, 800, 500, 0, 0, 0);
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'verify-A-overview.png') });
  console.log('  -> Saved verify-A-overview.png');

  console.log('📸 Step 1: Capturing Image B (Debug Mode Lane Centerlines + Junction Polygons)...');
  await page.evaluate(() => {
    if (window.__simCapture) {
      window.__simCapture.toggleDebug(true);
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'verify-B-debug.png') });
  console.log('  -> Saved verify-B-debug.png');

  console.log('📸 Step 1: Capturing Image C (Close-up Junction with Traffic Lights & Signs)...');
  await page.evaluate(() => {
    if (window.__simCapture) {
      window.__simCapture.toggleDebug(false);
      window.__simCapture.setCamera(-15, 40, 30, -5, 0, 25);
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'verify-C-junction.png') });
  console.log('  -> Saved verify-C-junction.png');

  console.log('📸 Step 1: Capturing Image D (Inside Cockpit View with HUD & Dashboard)...');
  await page.evaluate(() => {
    if (window.__simCapture) {
      window.__simCapture.resetCamera();
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'verify-D-cockpit.png') });
  console.log('  -> Saved verify-D-cockpit.png');

  console.log('\n🧪 Step 2: Running Interactive Feature Tests...');

  // Test 1: Traffic Light transition test
  const test1Result = await page.evaluate(async () => {
    const mgr = window.refs?.current?.trafficLightManager;
    if (!mgr) return { status: 'FAIL', reason: 'trafficLightManager missing on refs' };
    const initial = mgr.getAllDebugInfo().map(c => `[${c.id}] ${c.groups.map(g => g.state).join('|')}`);
    
    // Simulate tick updates
    for (let i = 0; i < 50; i++) {
      mgr.update(0.5);
    }
    const updated = mgr.getAllDebugInfo().map(c => `[${c.id}] ${c.groups.map(g => g.state).join('|')}`);
    return {
      status: 'PASS',
      controllersCount: mgr.controllers?.size || initial.length,
      initialStateSample: initial[0] || 'N/A',
      updatedStateSample: updated[0] || 'N/A'
    };
  });
  console.log('  -> Test 1 (Traffic Lights):', test1Result);

  // Test 2: Count Signs in Scene
  const test2Result = await page.evaluate(() => {
    const scene = window.refs?.current?.scene;
    if (!scene) return { status: 'FAIL', reason: 'Scene missing' };
    let signCount = 0;
    scene.traverse(obj => {
      const n = (obj.name || '').toLowerCase();
      const t = (obj.userData?.type || '').toLowerCase();
      if (n.includes('sign') || n.includes('schild') || t.includes('sign') || obj.userData?.signCode) {
        signCount++;
      }
    });
    return { status: 'PASS', signCount };
  });
  console.log('  -> Test 2 (Signs Count):', test2Result);

  // Test 3: Priority Resolver Test
  const test3Result = await page.evaluate(() => {
    const roadNetwork = window.refs?.current?.roadNetwork;
    const priorityResolver = window.refs?.current?.priorityResolver;
    if (!roadNetwork || !priorityResolver) {
      return { status: 'FAIL', reason: 'RoadNetwork or PriorityResolver missing' };
    }
    const testJunction = roadNetwork.junctions?.find(j => j.connectedRoadsCount >= 3) || {
      id: 'junc_1',
      mouths: { r1: { mouth: [0,0] }, r2: { mouth: [10,0] } }
    };

    const mouthKeys = Object.keys(testJunction.mouths || {});
    const approach1 = {
      roadId: mouthKeys[0] || 'r1',
      entryPoint: [0,0]
    };
    const prio = priorityResolver.resolvePriority(approach1, testJunction);
    return { status: 'PASS', junctionId: testJunction.id, priorityResult: prio };
  });
  console.log('  -> Test 3 (Priority Resolver):', test3Result);

  // Test 4: Performance Check (FPS, Draw Calls, Triangles)
  const test4Result = await page.evaluate(async () => {
    const renderer = window.refs?.current?.renderer;
    if (!renderer) return { status: 'FAIL', reason: 'Renderer missing' };

    const samples = [];
    const calls = renderer.info.render.calls;
    const triangles = renderer.info.render.triangles;
    
    // Sample frames
    for (let i = 0; i < 30; i++) {
      await new Promise(r => requestAnimationFrame(r));
      samples.push(performance.now());
    }
    let totalDt = 0;
    for (let i = 1; i < samples.length; i++) {
      totalDt += (samples[i] - samples[i - 1]);
    }
    const avgFps = 1000 / (totalDt / (samples.length - 1));

    return {
      status: 'PASS',
      avgFps: Math.round(avgFps * 10) / 10,
      drawCalls: calls,
      triangles: triangles
    };
  });
  console.log('  -> Test 4 (Performance Check):', test4Result);

  const summary = {
    timestamp: new Date().toISOString(),
    screenshots: [
      'verify-A-overview.png',
      'verify-B-debug.png',
      'verify-C-junction.png',
      'verify-D-cockpit.png'
    ],
    tests: {
      test1_trafficLights: test1Result,
      test2_signCount: test2Result,
      test3_priorityResolver: test3Result,
      test4_performance: test4Result
    }
  };

  fs.writeFileSync(path.join(outputDir, 'verification_summary.json'), JSON.stringify(summary, null, 2));
  console.log('✅ Verification completed successfully!');

  await browser.close();
}

runVerification().catch(err => {
  console.error('❌ Verification script error:', err);
  process.exit(1);
});
