import * as THREE from 'three';

/**
 * 🚦 DYNAMIC TRAFFIC LIGHT PHASE CONTROLLER (StVO § 37)
 * Handles automatic time-based phase transitions:
 * GREEN (22s) -> YELLOW (3.5s) -> RED (25s) -> RED_YELLOW (2s)
 */
export class TrafficLightController {
  constructor(junctions = []) {
    this.junctions = junctions;
    this.controllers = new Map();
    this.elapsedTime = 0;
    this.phaseDuration = {
      GREEN: 22.0,
      YELLOW: 3.5,
      RED: 22.0,
      RED_YELLOW: 2.0
    };
    this.totalCycleTime = 22.0 + 3.5 + 22.0 + 2.0; // 49.5s
    if (Array.isArray(junctions)) {
      junctions.forEach(j => this.registerJunction(j));
    }
  }

  registerJunction(junction) {
    if (!junction || !junction.id) return;
    const offset = Math.abs((junction.center?.[0] || 0) + (junction.center?.[1] || 0)) % 49.5;
    this.controllers.set(junction.id, {
      junction,
      phaseOffset: offset,
      currentNS: 'GREEN',
      currentEW: 'RED',
      meshes: []
    });
  }

  addMeshToJunction(junctionId, mesh) {
    const ctrl = this.controllers.get(junctionId);
    if (ctrl) {
      ctrl.meshes.push(mesh);
    }
  }

  /**
   * Cập nhật trạng thái đèn theo thời gian thực (Delta time)
   */
  update(dt, trafficLightMeshes = []) {
    this.elapsedTime = (this.elapsedTime + dt) % this.totalCycleTime;

    let nsState = 'GREEN';
    let ewState = 'RED';
    let t = this.elapsedTime;

    if (t < 22.0) {
      nsState = 'GREEN';
      ewState = 'RED';
    } else if (t < 25.5) {
      nsState = 'YELLOW';
      ewState = 'RED';
    } else if (t < 27.5) {
      nsState = 'RED';
      ewState = 'RED_YELLOW';
    } else if (t < 46.5) {
      nsState = 'RED';
      ewState = 'GREEN';
    } else if (t < 50.0) {
      nsState = 'RED';
      ewState = 'YELLOW';
    } else {
      nsState = 'RED_YELLOW';
      ewState = 'RED';
    }

    // Cập nhật tất cả các ngã tư đã đăng ký
    for (const [id, ctrl] of this.controllers.entries()) {
      const localT = (this.elapsedTime + ctrl.phaseOffset) % this.totalCycleTime;
      let localNS = 'GREEN';
      let localEW = 'RED';
      if (localT < 22.0) {
        localNS = 'GREEN'; localEW = 'RED';
      } else if (localT < 25.5) {
        localNS = 'YELLOW'; localEW = 'RED';
      } else if (localT < 27.5) {
        localNS = 'RED'; localEW = 'RED_YELLOW';
      } else if (localT < 46.5) {
        localNS = 'RED'; localEW = 'GREEN';
      } else if (localT < 50.0) {
        localNS = 'RED'; localEW = 'YELLOW';
      } else {
        localNS = 'RED_YELLOW'; localEW = 'RED';
      }

      ctrl.currentNS = localNS;
      ctrl.currentEW = localEW;

      ctrl.meshes.forEach((mesh, index) => {
        if (mesh) {
          const isNS = index % 2 === 0;
          this.updateMeshVisuals(mesh, isNS ? localNS : localEW);
        }
      });
    }

    // Cập nhật các mesh đơn lẻ nếu truyền vào
    if (Array.isArray(trafficLightMeshes)) {
      trafficLightMeshes.forEach((mesh, index) => {
        if (!mesh) return;
        const isNS = index % 2 === 0;
        this.updateMeshVisuals(mesh, isNS ? nsState : ewState);
      });
    }

    return { nsState, ewState };
  }

  getAllDebugInfo() {
    if (this.controllers.size > 0) {
      const info = [];
      for (const [id, ctrl] of this.controllers.entries()) {
        info.push({
          id,
          groups: [{ state: ctrl.currentNS || 'GREEN' }, { state: ctrl.currentEW || 'RED' }]
        });
      }
      return info;
    }
    let nsState = 'GREEN';
    let ewState = 'RED';
    let t = this.elapsedTime % this.totalCycleTime;

    if (t < 22.0) {
      nsState = 'GREEN';
      ewState = 'RED';
    } else if (t < 25.5) {
      nsState = 'YELLOW';
      ewState = 'RED';
    } else if (t < 27.5) {
      nsState = 'RED';
      ewState = 'RED_YELLOW';
    } else if (t < 46.5) {
      nsState = 'RED';
      ewState = 'GREEN';
    } else if (t < 50.0) {
      nsState = 'RED';
      ewState = 'YELLOW';
    } else {
      nsState = 'RED_YELLOW';
      ewState = 'RED';
    }

    return [{ id: 'Junction_Main_01', groups: [{ state: nsState }, { state: ewState }] }];
  }

  /**
   * Cập nhật hiệu ứng chiếu sáng 3D trên cột đèn
   */
  updateMeshVisuals(mesh, state) {
    const isRed = state === 'RED' || state === 'RED_YELLOW';
    const isYel = state === 'YELLOW' || state === 'RED_YELLOW';
    const isGrn = state === 'GREEN';

    const setLightState = (lightMesh, isActive, activeHex, offHex) => {
      if (!lightMesh || !lightMesh.material) return;
      lightMesh.material.color.setHex(isActive ? activeHex : offHex);
      if (lightMesh.material.emissive) {
        lightMesh.material.emissive.setHex(isActive ? activeHex : 0x000000);
        lightMesh.material.emissiveIntensity = isActive ? 3.0 : 0;
      }
    };

    if (mesh._redLight) setLightState(mesh._redLight, isRed, 0xff0000, 0x330000);
    if (mesh._yelLight) setLightState(mesh._yelLight, isYel, 0xffaa00, 0x332200);
    if (mesh._grnLight) setLightState(mesh._grnLight, isGrn, 0x00ff44, 0x003311);

    mesh.traverse(child => {
      if (child.name === 'redLight') setLightState(child, isRed, 0xff0000, 0x330000);
      if (child.name === 'yellowLight') setLightState(child, isYel, 0xffaa00, 0x332200);
      if (child.name === 'greenLight') setLightState(child, isGrn, 0x00ff44, 0x003311);
    });
  }
}
