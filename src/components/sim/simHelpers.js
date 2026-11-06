// 🧰 Helpers dùng chung cho DrivingSimulation — tách từ DrivingSimulation.jsx (refactor phase A)
import * as THREE from 'three';

export const GLB_STEER_AXIS = new THREE.Vector3(0, 0, 1);

// 🚀 SCRATCH VECTORS DÙNG CHUNG (preallocated): camera & collision cấp phát lại mỗi frame
// trước đây → GC spikes gây giật khung hình. Tái sử dụng các temp này (chỉ 1 frame dùng
// tại một thời điểm nên an toàn tuyệt đối).
export const _camEyeLocal = new THREE.Vector3();
export const _camTargetLocal = new THREE.Vector3();
export const _camTargetOffset = new THREE.Vector3();
export const _collisionCorners = [
  { x: 0, z: 0 }, { x: 0, z: 0 }, { x: 0, z: 0 }, { x: 0, z: 0 }
];

// 💡 Mẹo StVO xoay vòng trên loading screen
export const DRIVING_TIPS = [
  'Mẹo StVO: Gạt cần số về [ D ] để khởi hành, xe đỗ ở [ P ] đạp ga sẽ chỉ rú máy.',
  'Mẹo StVO: Quan sát gương chiếu hậu và ngoái đầu (Schulterblick) trước khi chuyển hướng.',
  'Mẹo StVO: Quy tắc "Rechts vor Links" (ưu tiên bên phải) tại các ngã ba, ngã tư không biển báo.',
  'Mẹo StVO: Dừng xe hoàn toàn trước vạch dừng tại biển STOP ít nhất 3 giây.',
  'Mẹo StVO: Bật xi-nhan trước khi tấp lề hoặc chuyển làn đường ít nhất 30 mét.'
];

/**
 * 🧹 Giải phóng GPU memory khi bỏ một group khỏi scene (chống leak khi chuyển map A→B→A):
 * geometry LUÔN per-build → dispose an toàn; material/texture chỉ dispose khi own=true
 * (GLB loader tạo material mới mỗi lần nạp — còn material procedural dùng shared cache
 * toàn cục (getSharedTexturedMaterial) tuyệt đối KHÔNG được dispose).
 */
export const disposeGroupDeep = (root, ownMaterials = false) => {
  if (!root) return;
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (ownMaterials && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        for (const k of Object.keys(m)) {
          const v = m[k];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose();
      });
    }
  });
};

/**
 * 🎯 Chiếu điểm spawn lên TÂM LÀN CÙNG HƯỚNG gần nhất trong LaneGraph (chỉ dùng cho map PBF).
 * Trước đây spawn cố định lệch sang làn ngược chiều ~9.5m → cảm giác "xe và đường rất lệch".
 * @returns {{x, z, rot}} toạ độ world đã snap (giữ nguyên nếu không tìm được lane phù hợp)
 */
export const snapSpawnToLaneCenter = (laneGraph, worldX, worldZ, rot) => {
  if (!laneGraph || !Array.isArray(laneGraph.lanes)) return { x: worldX, z: worldZ, rot };
  let best = null;
  for (const lane of laneGraph.lanes) {
    const pts = lane.drivableWaypoints || lane.centerline;
    if (!pts || pts.length < 2) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1];
      const bx = pts[i + 1][0], bz = pts[i + 1][1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) continue;
      let t = ((worldX - ax) * dx + (worldZ - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const qx = ax + t * dx;
      const qz = az + t * dz;
      const d = Math.hypot(worldX - qx, worldZ - qz);
      if (d > 15) continue;
      const L = Math.sqrt(lenSq);
      // Heading của lane theo khung người chơi: forward = (sin rot, -cos rot) = (dx, dz)/L
      const laneHeading = Math.atan2(dx / L, -dz / L);
      let diff = Math.abs(rot - laneHeading);
      while (diff > Math.PI) diff -= Math.PI * 2;
      if (Math.abs(diff) > Math.PI * 0.3) continue; // chỉ làn CÙNG hướng đi
      if (!best || d < best.d) best = { d, x: qx, z: qz, rot: laneHeading };
    }
  }
  return best ? { x: best.x, z: best.z, rot: best.rot } : { x: worldX, z: worldZ, rot };
};
