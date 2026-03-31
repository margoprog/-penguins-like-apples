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
export const treeColliders = [];
loader.load('/models/tree.glb', (gltf) => {
  const originalTree = gltf.scene;
  originalTree.scale.set(1.2, 1.2, 1.2);

  originalTree.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 🌳 arbre 1
  const tree1 = originalTree.clone();
  tree1.position.set(5, -0.4, -3);
  tree1.rotation.y = Math.random() * Math.PI * 2;
  scene.add(tree1);
  addTreeCollider(tree1, 1.2);

  // 🌳 arbre 2
  const tree2 = originalTree.clone();
  tree2.position.set(-4, -0.4, 4);
  tree2.rotation.y = Math.random() * Math.PI * 0.55;
  scene.add(tree2);
  addTreeCollider(tree2, 1.2);


    // 🌳 arbre 2
  const tree3 = originalTree.clone();
  tree3.position.set(9, -0.4, 9);
  tree3.rotation.y = Math.random() * Math.PI * 0.6;
  scene.add(tree3);
  addTreeCollider(tree3, 1.2);

});

function addTreeCollider(tree, radius = 1.2) {
  treeColliders.push({
    mesh: tree,
    radius: radius
  });
}

// ARBRE B
loader.load('/models/tree_b.glb', (gltf) => {
  const originalTree_b = gltf.scene;
   originalTree_b.scale.set(1.2, 1.2, 1.2);

  originalTree_b.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 🌳 arbre 1
  const tree_b1 = originalTree_b.clone();
  tree_b1.position.set(15, -0.4, -3);
  tree_b1.rotation.y = Math.random() * Math.PI * 2;
   tree_b1.scale.set(1,1,1);

  scene.add(tree_b1);
  addTreeCollider(tree_b1, 1.2);
  

  // 🌳 arbre 2
  const tree_b2 = originalTree_b.clone();
  tree_b2.position.set(-14, -0.4, 4);
  tree_b2.rotation.y = Math.random() * Math.PI * 0.55;
  scene.add(tree_b2);
  addTreeCollider(tree_b2, 1.2);


    // 🌳 arbre 2
  const tree_b3 = originalTree_b.clone();
  tree_b3.position.set(15, -0.4, 9);
  tree_b3.rotation.y = Math.random() * Math.PI * 0.6;
  scene.add(tree_b3);
  addTreeCollider(tree_b3, 1.2);


     // 🌳 arbre 2
  const tree_b4 = originalTree_b.clone();
  tree_b4.position.set(0, -0.4, 19);
  tree_b4.rotation.y = Math.random() * Math.PI * 0.6;
  scene.add(tree_b4);
  addTreeCollider(tree_b4, 1.2);

       // 🌳 arbre 2
  const tree_b5 = originalTree_b.clone();
  tree_b5.position.set(-5, -0.4, -15);
  tree_b5.rotation.y = Math.random() * Math.PI * 0;
  scene.add(tree_b5);
  addTreeCollider(tree_b5, 1.2);

});

loader.load('/models/buisson.glb', (gltf) => {
  const buisson = gltf.scene;

  buisson.scale.set(0.5, 0.5, 0.5);
  buisson.position.set(-4, -0.2, 5);
  buisson.rotation.y = Math.random() * Math.PI * 2;

  buisson.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(buisson);

  // 🌿 CLONE
  const buisson2 = buisson.clone();

  // position opposée (miroir)
  buisson2.position.set(10, -0.2, 7);

  // rotation différente pour éviter effet copier/coller
  buisson2.rotation.y = Math.random() * Math.PI * 2;

  scene.add(buisson2);
});


const leafCount = 50;
const leaves = [];

const geometry = new THREE.PlaneGeometry(0.1, 0.1);
const material = new THREE.MeshBasicMaterial({
  color: 0xfc7c54,
  side: THREE.DoubleSide,
  transparent: true,
});

for (let i = 0; i < leafCount; i++) {
  const leaf = new THREE.Mesh(geometry, material);

  leaf.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 5 + 2,
    (Math.random() - 0.5) * 20
  );

  leaf.userData = {
    speed: 0.001 + Math.random() * 0.02,
    sway: Math.random() * Math.PI * 2,
  };

  scene.add(leaf);
  leaves.push(leaf);
}

export function animateLeaves() {
  leaves.forEach((leaf) => {
    leaf.position.y -= leaf.userData.speed;

    // mouvement flottant
    leaf.position.x += Math.sin(Date.now() * 0.001 + leaf.userData.sway) * 0.01;

    // reset en haut
    if (leaf.position.y < 0) {
      leaf.position.y = Math.random() * 5 + 2;
    }
  });
}