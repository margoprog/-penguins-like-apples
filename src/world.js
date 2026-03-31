import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, water } from './scene.js';

// EMPREINTES
const footprints = [];

export function createFootprint(position, rotationY) {
  const geo = new THREE.PlaneGeometry(0.25, 0.4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e, transparent: true, opacity: 0.05, roughness: 1, metalness: 0,
  });
  const footprint = new THREE.Mesh(geo, mat);
  footprint.rotation.x = -Math.PI / 2;
  footprint.rotation.z = rotationY;
  footprint.position.copy(position);
  footprint.position.y = -0.25;
  scene.add(footprint);
  footprints.push({ mesh: footprint, life: 1.0 });
}

export function updateFootprints() {
  for (let i = footprints.length - 1; i >= 0; i--) {
    const f = footprints[i];
    f.life -= 0.01;
    f.mesh.material.opacity = f.life * 0.1;
    const scale = 0.8 + f.life * 0.2;
    f.mesh.scale.set(scale, scale, scale);
    if (f.life <= 0) {
      scene.remove(f.mesh);
      footprints.splice(i, 1);
    }
  }
}

export function updateWaves() {
  const positions = water.geometry.attributes.position;
  const time = performance.now() * 0.001;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const wave = Math.sin(x * 0.5 + time) * 0.06 + Math.cos(y * 0.5 + time * 1.2) * 0.03;
    positions.setZ(i, wave);
  }
  positions.needsUpdate = true;
}

// POMMES
const loader = new GLTFLoader();
const numberOfApples = 20;
const dispersionRadius = 30 - 1;

loader.load('/models/apple.glb', (gltf) => {
  const originalApple = gltf.scene;
  originalApple.scale.set(0.4, 0.4, 0.4);
  originalApple.traverse((child) => {
    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
  });
  for (let i = 0; i < numberOfApples; i++) {
    const appleClone = originalApple.clone();
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * dispersionRadius;
    appleClone.position.set(Math.cos(angle) * radius, -0.15, Math.sin(angle) * radius);
    appleClone.rotation.y = Math.random() * Math.PI * 2;
    scene.add(appleClone);
  }
});

// ARBRE
loader.load('/models/tree.glb', (gltf) => {
  const tree = gltf.scene;
  tree.scale.set(4, 4, 4);
  tree.traverse((child) => {
    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
  });
  tree.position.set(5, 3.2, -3);
  scene.add(tree);
});