// ðŸ—ï¸ audit_building_rail.mjs â€” Ä‘o vÃ  phÃ¢n loáº¡i building Ã— rail corridor overlap
// BÆ°á»›c 1: chÆ°a sá»­a gÃ¬ â€” chá»‰ Ä‘o, phÃ¢n loáº¡i A/B/C, in báº£ng
// Cháº¡y: node scripts/audit_building_rail.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));
const stripsDump = JSON.parse(readFileSync(join(root, 'scripts/strips_dump.json'), 'utf8'));

// â”€â”€ Corridor half-width theo elev â”€â”€
const corridorHalf = (rail) => {
  if (rail.elev === 0) return 1.8 + 1.5; // tram máº·t Ä‘áº¥t: ballast 1.8 + lá» 1.5
  return 1.9 + 1.5; // viaduct: tÆ°á»ng 1.9 + lá» 1.5
};

// â”€â”€ Resample polyline Ä‘á»u 2m vá»›i phÃ¡p tuyáº¿n â”€â”€
function polySamples(points, step = 2) {
  if (points.length < 2) return [];
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const n = Math.max(2, Math.ceil(total / step));
  const out = [];
  let seg = 0;
  for (let k = 0; k <= n; k++) {
    const s = (total * k) / n;
    while (seg < points.length - 2 && s > cum[seg + 1]) seg++;
    const segL = cum[seg + 1] - cum[seg] || 1;
    const t = (s - cum[seg]) / segL;
    const ax = points[seg][0], az = points[seg][1];
    const bx = points[seg + 1][0], bz = points[seg + 1][1];
    out.push({
      x: ax + (bx - ax) * t, z: az + (bz - az) * t,
      nx: -(bz - az) / segL, nz: (bx - ax) / segL,
    });
  }
  return out;
}

// â”€â”€ Point in AABB strip â”€â”€
function inStrip(px, pz, s) {
  return px > s[0] && px < s[2] && pz > s[1] && pz < s[3];
}

// â”€â”€ 1. XÃ¢y danh sÃ¡ch rail corridor samples â”€â”€
const railSamples = [];
for (const rail of map.rails || []) {
  const ch = corridorHalf(rail);
  const samples = polySamples(rail.points, 2);
  for (const s of samples) {
    railSamples.push({
      railId: rail.id, railName: rail.name || '', railway: rail.railway,
      elev: rail.elev, corridorHalf: ch,
      x: s.x, z: s.z, nx: s.nx, nz: s.nz,
      // 3 Ä‘iá»ƒm kiá»ƒm: tÃ¢m + 2 mÃ©p corridor
      pts: [
        { x: s.x, z: s.z },
        { x: s.x + s.nx * ch, z: s.z + s.nz * ch },
        { x: s.x - s.nx * ch, z: s.z - s.nz * ch },
      ],
    });
  }
}
console.log(`Rail samples: ${railSamples.length} (tá»« ${map.rails.length} tuyáº¿n)`);

// â”€â”€ 2. QuÃ©t building strips: má»—i strip kiá»ƒm tra cÃ³ sample corridor nÃ o rÆ¡i vÃ o khÃ´ng â”€â”€
// Building strips: má»—i building â†’ nhiá»u strip [a, b, c, d] (AABB theo sweep 3m)
// Map building roadId+s â†’ identifying info
const roadsById = new Map(map.roads.map(r => [r.id, r]));

// PhÃ¢n loáº¡i káº¿t quáº£: má»—i strip chá»©a â‰¥1 sample corridor â†’ building giao rail
const overlaps = [];
for (let si = 0; si < stripsDump.length; si++) {
  const [a, b, c, dd] = stripsDump[si];
  const stripMinX = Math.min(a, c), stripMaxX = Math.max(a, c);
  const stripMinZ = Math.min(b, dd), stripMaxZ = Math.max(b, dd);
  for (const rs of railSamples) {
    for (const pt of rs.pts) {
      if (pt.x > stripMinX && pt.x < stripMaxX && pt.z > stripMinZ && pt.z < stripMaxZ) {
        overlaps.push({ stripIdx: si, railId: rs.railId, railName: rs.railName, railway: rs.railway, elev: rs.elev, corridorHalf: rs.corridorHalf, px: pt.x, pz: pt.z });
        break; // 1 sample Ä‘á»§ cho strip nÃ y
      }
    }
  }
}

// â”€â”€ 3. Map strip index â†’ building (tá»« thá»© tá»± trong dump) â”€â”€
// stripsDump táº¡o theo thá»© tá»± buildings â€” cáº§n map ngÆ°á»£c
// buildings.ts buildingStrips: má»—i building cÃ³ nhiá»u strips (SWEEP_STEP=3)
// rebuild stripâ†’building map báº±ng cÃ¡ch cháº¡y láº¡i tÆ°Æ¡ng tá»±
const bldStrips = [];
for (const b of map.buildings) {
  const road = roadsById.get(b.roadId);
  if (!road) continue;
  const side = b.side === 'right' ? 1 : -1;
  const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
  const frontOff = half + 2.0;
  const s0 = Math.max(0, b.s), s1 = Math.min(b.s + b.length, 1e9); // cÃ³ thá»ƒ vÆ°á»£t
  if (s1 - s0 < 6) continue;
  // samples dá»c building
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (let s = s0; s <= s1; s += 3) {
    // roadPointAt tÆ°Æ¡ng tá»± â€” dÃ¹ng polyline road
    const rp = road.points;
    let rem = s, px = rp[0][0], pz = rp[0][1], tx = 0, tz = 1;
    let acc2 = 0;
    for (let i = 1; i < rp.length; i++) {
      const seg = Math.hypot(rp[i][0] - rp[i-1][0], rp[i][1] - rp[i-1][1]) || 1;
      if (rem <= seg) {
        const t = rem / seg;
        px = rp[i-1][0] + (rp[i][0]-rp[i-1][0]) * t; pz = rp[i-1][1] + (rp[i][1]-rp[i-1][1]) * t;
        tx = (rp[i][0]-rp[i-1][0]) / seg; tz = (rp[i][1]-rp[i-1][1]) / seg;
        break;
      }
      rem -= seg; acc2 += seg;
    }
    const nx = -tz, nz = tx;
    for (const off of [frontOff, frontOff + 9]) {
      const x = px + nx * side * off, z = pz + nz * side * off;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
  }
  bldStrips.push({ roadId: b.roadId, s: b.s, side: b.side, floors: b.floors || 3, length: b.length,
    minX, minZ, maxX, maxZ });
}

// â”€â”€ 4. PhÃ¢n loáº¡i: má»—i overlap â†’ tÃ¬m building chá»©a strip â†’ phÃ¢n loáº¡i A/B/C â”€â”€
const results = { A: [], B: [], C: [] };
const seenBlds = new Set();
for (const ov of overlaps) {
  // tÃ¬m building cÃ³ strip chá»©a Ä‘iá»ƒm overlap
  for (const bs of bldStrips) {
    if (ov.px > bs.minX && ov.px < bs.maxX && ov.pz > bs.minZ && ov.pz < bs.maxZ) {
      const key = `${bs.roadId}:${bs.s}:${bs.side}:${ov.railId}`;
      if (seenBlds.has(key)) continue;
      seenBlds.add(key);
      const height = bs.floors * 3;
      const deckBottom = ov.elev - 0.5;
      let cat;
      if (ov.elev === 0) cat = 'A';
      else if (height >= deckBottom) cat = 'B';
      else cat = 'C';
      const isGen = true; // má»i building Ä‘á»u generator (roadId/s/side)
      results[cat].push({
        building: `${bs.roadId}@s=${bs.s} side=${bs.side} floors=${bs.floors} len=${bs.length}m h=${height}m`,
        rail: `${ov.railId} (${ov.railName || ov.railway}) elev=${ov.elev}`,
        cat, isGen,
      });
      break; // 1 building Ä‘á»§
    }
  }
}

// â”€â”€ 5. Báº£ng tá»•ng â”€â”€
console.log('\nâ•â•â• BÆ¯á»šC 1: PHÃ‚N LOáº I â•â•â•');
console.log(`Loáº¡i A (rail elev=0 Ã— building): ${results.A.length} â€” Lá»–I cháº¯c cháº¯n`);
console.log(`Loáº¡i B (viaduct, mÃ¡i nhÃ  â‰¥ Ä‘Ã¡y cáº§u): ${results.B.length} â€” Lá»–I`);
console.log(`Loáº¡i C (viaduct, mÃ¡i nhÃ  < Ä‘Ã¡y cáº§u): ${results.C.length} â€” CÃ³ thá»ƒ OK`);

for (const cat of ['A', 'B', 'C']) {
  if (!results[cat].length) continue;
  const osmCount = results[cat].filter(x => x.isGen).length;
  console.log(`\n  Loáº¡i ${cat} chi tiáº¿t (${results[cat].length} building, ${results[cat].length} generator):`);
  for (const r of results[cat].slice(0, 8)) {
    console.log(`    ${r.building} Ã— ${r.rail}`);
  }
  if (results[cat].length > 8) console.log(`    ... +${results[cat].length - 8} khÃ¡c`);
}

// â”€â”€ 6. Dump káº¿t quáº£ cho BÆ°á»›c 2/3 â”€â”€
const catA = results.A.slice(0, 3).map(x => x.building);
console.log(`\nDump catA_first3: ${JSON.stringify(catA)}`);
writeFileSync(join(root, 'scripts', 'building_rail_audit.json'), JSON.stringify({ results, railSamples: railSamples.length, overlaps: overlaps.length }, null, 2), 'utf8');
console.log('Dump â†’ scripts/building_rail_audit.json');
