import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Tuan Anh\\.gemini\\antigravity\\brain\\63ce7363-26ed-4b70-8f5b-ff24fa250503';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
console.log(`Using browser: ${browserExe}`);

// 1. Start vite preview server on port 4173
const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4173'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

preview.stdout.on('data', d => console.log(`[Preview] ${d}`));
preview.stderr.on('data', d => console.error(`[Preview Err] ${d}`));

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  await sleep(2500); // Wait for preview server

  const profileDir = path.join(process.cwd(), 'scratch', 'chrome_temp_profile');
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(`"${browserExe}"`, [
    '--remote-debugging-port=9333',
    '--headless=new',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=default',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir="${profileDir}"`,
    '--window-size=1280,720',
    'http://localhost:4173/simulation'
  ], { shell: true });

  chromeProc.stderr.on('data', d => console.log(`[Chrome] ${d}`));

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    try {
      const res = await fetch('http://127.0.0.1:9333/json');
      const list = await res.json();
      const page = list.find(item => item.type === 'page' && item.url.includes('simulation'));
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        console.log(`Found page target: ${wsUrl}`);
        break;
      }
    } catch (e) {
      // Chrome starting up
    }
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome CDP WebSocket');
    chromeProc.kill();
    preview.kill();
    return;
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(resolve => ws.onopen = resolve);
  console.log('Connected to CDP WebSocket');

  // Wait until window.__simCapture is defined
  let ready = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const evalRes = await send('Runtime.evaluate', {
      expression: 'typeof window.__simCapture !== "undefined"',
      returnByValue: true
    });
    if (evalRes?.result?.result?.value === true) {
      ready = true;
      console.log('window.__simCapture is ready!');
      break;
    }
  }

  if (!ready) {
    console.error('Simulation timed out or failed to initialize window.__simCapture');
    ws.close();
    chromeProc.kill();
    preview.kill();
    return;
  }

  // Bật chế độ Debug Visualizer
  await send('Runtime.evaluate', {
    expression: 'window.__simCapture.toggleDebug(true);',
    returnByValue: true
  });
  console.log('Debug mode enabled (J / F2 activated)!');

  const views = [
    {
      name: 'photo1_intersection.png',
      title: 'Ngã tư Friedrichstraße x Unter den Linden',
      cam: [-7.5, 14.0, 38.0, -4.0, 0.5, 12.0]
    },
    {
      name: 'photo2_twoway_road.png',
      title: 'Vị trí Xe Người Lái & Vạch Dừng Haltelinie & Đèn Giao Thông',
      cam: [-2.88, 4.8, 44.0, -2.88, 1.2, 20.0]
    },
    {
      name: 'photo5_unter_den_linden.png',
      title: 'Góc nhìn người dùng tại vị trí ảnh lỗi cũ (X=-105.8, Z=-39.9)',
      cam: [-100.6, 2.2, -39.9, -117.8, 0.8, -39.9]
    },
    {
      name: 'photo6_linden_overhead.png',
      title: 'Toàn cảnh trên cao Unter den Linden (X=-120, Z=-35)',
      cam: [-120.0, 38.0, -35.0, -120.0, 0.0, -35.0]
    },
    {
      name: 'photo7_linden_westbound.png',
      title: 'Làn đường xuôi chiều Unter den Linden hướng Tây (X=-80, Z=4.5)',
      cam: [-80.0, 2.2, 4.5, -110.0, 0.8, 1.2]
    },
    {
      name: 'photo8_glinka_intersection.png',
      title: 'Giao lộ Unter den Linden x Glinkastraße (junc_658)',
      cam: [-185.0, 14.0, -40.0, -210.0, 0.5, -40.0]
    },
    {
      name: 'photo9_traffic_light_closeup.png',
      title: 'Cận cảnh cột đèn tín hiệu StVO Đức mới với Kontrastblende',
      cam: [-192.5, 2.6, -14.0, -195.2, 3.2, -14.8]
    }
  ];

  for (const v of views) {
    console.log(`Setting view: ${v.title}...`);
    await send('Runtime.evaluate', {
      expression: `window.__simCapture.setCamera(${v.cam.join(',')});`,
      returnByValue: true
    });

    await sleep(1200); // Allow render loop to draw frame with lines

    // Capture WebGL canvas
    const capRes = await send('Runtime.evaluate', {
      expression: 'window.__simCapture.capture();',
      returnByValue: true
    });

    const dataUrl = capRes?.result?.result?.value;
    if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
      const b64 = dataUrl.replace('data:image/png;base64,', '');
      const buf = Buffer.from(b64, 'base64');
      const outPath = path.join(ARTIFACT_DIR, v.name);
      fs.writeFileSync(outPath, buf);
      console.log(`Saved screenshot (${buf.length} bytes): ${outPath}`);
    } else {
      // Fallback to Page.captureScreenshot
      const cdpCap = await send('Page.captureScreenshot', { format: 'png' });
      if (cdpCap?.result?.data) {
        const buf = Buffer.from(cdpCap.result.data, 'base64');
        const outPath = path.join(ARTIFACT_DIR, v.name);
        fs.writeFileSync(outPath, buf);
        console.log(`Saved CDP page screenshot (${buf.length} bytes): ${outPath}`);
      } else {
        console.error(`Failed to capture ${v.name}`);
      }
    }
  }

  ws.close();
  chromeProc.kill();
  preview.kill();
  console.log('Done capturing all 3 photos!');
}

run().catch(err => {
  console.error(err);
  preview.kill();
});
