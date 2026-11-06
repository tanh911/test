import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildAutobahnDistrict } from './autobahnDistrict.js';
import { buildLandstrasseDistrict } from './landstrasseDistrict.js';
import { buildBerlinMitteDistrict } from './berlinMitteDistrict.js';

describe('District Builders Unit Tests (Autobahn, Landstraße, Berlin Mitte)', () => {
  it('should fail fast if scenery is omitted in buildAutobahnDistrict', () => {
    expect(() => buildAutobahnDistrict(null, null, [], {}, false)).toThrow('[AutobahnDistrict] scenery group is required.');
  });

  it('should correctly build 3D Autobahn A9 district with gantry accumulation and boundary penalty config', { timeout: 30000 }, () => {
    const scene = new THREE.Scene();
    const scenery = new THREE.Group();
    scene.add(scenery);
    const colliders = [];
    const sharedMaterials = {};

    const roadGen = buildAutobahnDistrict(scene, scenery, colliders, sharedMaterials, false, { boundaryPenalty: 25 });

    expect(roadGen).toBeDefined();
    expect(scenery.userData.roadGen).toBe(roadGen);
    expect(scenery.userData.mapSource).toBe('OSM_PBF');

    const mapInfo = scenery.userData.mapInfo;
    expect(mapInfo).toBeDefined();
    expect(mapInfo.source).toBe('OSM_PBF_AUTOBAHN');
    expect(mapInfo.roadCount).toBeGreaterThan(0);
    expect(mapInfo.signCount).toBeGreaterThan(0);

    // Verify boundary collider penalty override (25)
    const boundaryCollider = colliders.find(c => c.id === 'osm_pbf_autobahn_boundary');
    expect(boundaryCollider).toBeDefined();
    expect(boundaryCollider.penalty).toBe(25);

    // Verify 3D sign group content
    const signsGroup = scenery.getObjectByName('PBF_Autobahn_StVO_Signs_3D');
    expect(signsGroup).toBeDefined();
    // Graph v2 (OSM đầy đủ): số biển sinh theo số đường/nút giao — assert robust theo ngưỡng
    expect(signsGroup.children.length).toBeGreaterThan(100);
    expect(mapInfo.signCount).toBeGreaterThan(30);
  });

  it('should fail fast if scenery is omitted in buildLandstrasseDistrict', () => {
    expect(() => buildLandstrasseDistrict(null, null, [], {}, false)).toThrow('[LandstrasseDistrict] scenery group is required.');
  });

  it('should correctly build 3D Landstraße B2 district with country road signs', () => {
    const scene = new THREE.Scene();
    const scenery = new THREE.Group();
    scene.add(scenery);
    const colliders = [];
    const sharedMaterials = {};

    const roadGen = buildLandstrasseDistrict(scene, scenery, colliders, sharedMaterials, false);

    expect(roadGen).toBeDefined();
    expect(scenery.userData.roadGen).toBe(roadGen);
    expect(scenery.userData.mapSource).toBe('OSM_PBF');

    const mapInfo = scenery.userData.mapInfo;
    expect(mapInfo).toBeDefined();
    expect(mapInfo.source).toBe('OSM_PBF_LANDSTRASSE');
    expect(mapInfo.roadCount).toBeGreaterThan(0);
    expect(mapInfo.signCount).toBeGreaterThan(0);

    const signsGroup = scenery.getObjectByName('PBF_Landstrasse_StVO_Signs_3D');
    expect(signsGroup).toBeDefined();
    expect(signsGroup.children.length).toBe(mapInfo.signCount);
  });

  it('should delegate mapType autonavigation in buildBerlinMitteDistrict', { timeout: 30000 }, () => {
    const scene = new THREE.Scene();
    const scenery = new THREE.Group();
    scene.add(scenery);

    // Landstraße delegation
    const landGen = buildBerlinMitteDistrict(scene, scenery, [], {}, false, {}, 'landstrasse_b2');
    expect(scenery.userData.mapInfo.source).toBe('OSM_PBF_LANDSTRASSE');

    // Autobahn delegation
    const autobahnScenery = new THREE.Group();
    const autoGen = buildBerlinMitteDistrict(scene, autobahnScenery, [], {}, false, {}, 'autobahn_a9');
    expect(autobahnScenery.userData.mapInfo.source).toBe('OSM_PBF_AUTOBAHN');
  });
});
