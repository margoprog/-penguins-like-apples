import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9f5ff);
scene.background = new THREE.Color(0xFFFFFF);


// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(6, 2, 8);

// --- CAMERA FOLLOW SETTINGS ---
const cameraOffset = new THREE.Vector3(0, 4.75, 9);
const cameraLerpFactor = 0.08;

// 1. Initialiser le chargeur
const textureLoader = new THREE.TextureLoader();

// 2. Charger les différentes cartes
const baseColor = textureLoader.load('/textures/sol_diffuse.jpg');
const normalMap = textureLoader.load('/textures/sol_normal.jpg');
const roughnessMap = textureLoader.load('/textures/sol_rough.jpg');

// 3. Réglage important : Répétition (Tiling)
[baseColor, normalMap, roughnessMap].forEach((tex) => {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
});

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false; 
controls.target.set(0, 0.5, 0);

const footprints = [];
let stepTimer = 0;
const stepInterval = 0.35; // fréquence des pas



function createNoiseTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = 180 + Math.random() * 75;
    imageData.data[i]     = noise;
    imageData.data[i + 1] = noise;
    imageData.data[i + 2] = noise;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  return texture;
}

const noiseTex = createNoiseTexture();

// SOL (GROUND)
const groundRadius = 30;
const groundGeometry = new THREE.CircleGeometry(groundRadius, 64);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xb1Ed8c,
//   color: 0xFFFFFF,

  roughness: 0.8,
  map: noiseTex,
  roughnessMap: noiseTex,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.3;
ground.receiveShadow = true;
scene.add(ground);






// PLAGE (anneau de sable avec noise)
const beachInnerRadius = groundRadius - 8;
const beachOuterRadius = groundRadius + 0.2;

const beachGeometry = new THREE.RingGeometry(
  beachInnerRadius,
  beachOuterRadius,
  128
);

const positions = beachGeometry.attributes.position;
const colors = [];

for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  const dist = Math.sqrt(x * x + z * z);

  const t = (dist - beachInnerRadius) / (beachOuterRadius - beachInnerRadius);

  // plus sombre vers l’eau
  const shade = 0.75 + t * 0.25;

  colors.push(shade, shade * 0.95, shade * 0.8);
}

beachGeometry.setAttribute(
  'color',
  new THREE.Float32BufferAttribute(colors, 3)
);



// réutilise ta fonction
const sandNoise = createNoiseTexture();
sandNoise.repeat.set(6, 1); // étire dans le sens circulaire

const beachMaterial = new THREE.MeshStandardMaterial({
  map: sandNoise,
  roughnessMap: sandNoise,
  color: 0xf2e2b6,
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
});

sandNoise.repeat.set(20, 20); // IMPORTANT : pas 6,1 → ça évite les bandes
sandNoise.offset.set(Math.random(), Math.random());
beachMaterial.color.multiplyScalar(0.95 + Math.random() * 0.1);
const beach = new THREE.Mesh(beachGeometry, beachMaterial);
beach.rotation.x = -Math.PI / 2;
beach.position.y = -0.28; // évite le z-fighting
beach.receiveShadow = true;
sandNoise.rotation = Math.random() * Math.PI;
sandNoise.center.set(0.5, 0.5);
scene.add(beach);
beach.position.y = -0.27; // légèrement AU-DESSUS du sol







// EAU
const waterInnerRadius = groundRadius - 1 ;
const waterOuterRadius = groundRadius + 150;

const waterGeometry = new THREE.RingGeometry(
  waterInnerRadius,
  waterOuterRadius,
  128
);

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x4da6ff,
  roughness: 0.25,
  metalness: 0.4,
  transparent: true,
  opacity: 0.95,
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.geometry.computeVertexNormals();
water.rotation.x = -Math.PI / 2;
water.position.y = -0.16;
water.receiveShadow = true;
scene.add(water);
const waterGeometry2 = new THREE.RingGeometry(
  waterInnerRadius -3,
  waterOuterRadius,
  128
);
const water2 = new THREE.Mesh(waterGeometry2, waterMaterial);
water2.position.y = -1;
water2.rotation.x = -Math.PI / 2;


scene.add(water2);


// LIGHTS
// ======================
// LIGHTS (SETUP PRO CINÉ)
// ======================

// 🌍 Ambient (léger, chaud)
const ambient = new THREE.AmbientLight(0xffe5c6, 0.25);
scene.add(ambient);

// ☀️ SOLEIL (key light principale)
const sunLight = new THREE.DirectionalLight(0xffc58f, 2);
sunLight.position.set(8, 12, 6);
sunLight.castShadow = true;

// Ombres haute qualité
sunLight.shadow.mapSize.set(2048, 2048);

sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.bottom = -10;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.right = 10;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 50;

// Ombres douces
sunLight.shadow.radius = 4;
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.03;

scene.add(sunLight);
scene.add(sunLight.target);

// 🌤️ Fill light (bleu doux)
const fillLight = new THREE.DirectionalLight(0x9fd6ff, 0.8);
fillLight.position.set(-10, 8, -6);
scene.add(fillLight);

// 💡 Rim light (contour lumineux)
const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(-6, 6, -8);
scene.add(rimLight);

// 🌊 Bounce light (rebond du sol)
const bounceLight = new THREE.DirectionalLight(0xa8ffcb, 0.4);
bounceLight.position.set(0, -5, 0);
scene.add(bounceLight);

// VARIABLES PINGOUIN
let model = null, head = null, apple = null;
let legL = null, legR = null, body = null, wingL = null, wingR = null;

let legLBaseRot = new THREE.Euler(), legRBaseRot = new THREE.Euler();
let wingLBaseRot = new THREE.Euler(), wingRBaseRot = new THREE.Euler();
let bodyBaseY = 0, bodyBaseRot = new THREE.Euler();
let appleBaseY = 0, appleBaseRot = new THREE.Euler();

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const target = new THREE.Vector3();

// PHYSIQUE
const velocity = new THREE.Vector3();
const acceleration = 0.0015;
const friction = 0.90;
const maxSpeed = 0.12;
let walkTime = 0;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let mouseInside = false;

renderer.domElement.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  mouseInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

  mouse.x = (x / rect.width) * 2 - 1;
  mouse.y = -(y / rect.height) * 2 + 1;
});

renderer.domElement.addEventListener('mouseleave', () => {
  mouseInside = false;
});

// LOAD MODEL
const loader = new GLTFLoader();
loader.load('/models/pingoui.glb', (gltf) => {
  model = gltf.scene;
  scene.add(model);

  model.position.set(0, 0, 0);
  model.scale.set(0.35, 0.35, 0.35);
  
  head  = model.getObjectByName('head');
  apple = model.getObjectByName('apple');
  legL  = model.getObjectByName('legL');
  legR  = model.getObjectByName('legR');
  body  = model.getObjectByName('body');
  wingL = model.getObjectByName('wingL');
  wingR = model.getObjectByName('wingR');

  if (legL)  legLBaseRot.copy(legL.rotation);
  if (legR)  legRBaseRot.copy(legR.rotation);
  if (wingL) wingLBaseRot.copy(wingL.rotation);
  if (wingR) wingRBaseRot.copy(wingR.rotation);
  if (body) {
    bodyBaseY = body.position.y;
    bodyBaseRot.copy(body.rotation);
  }
  if (apple) {
    appleBaseY = apple.position.y;
    appleBaseRot.copy(apple.rotation);
  }

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeVertexNormals();
      if (child.material) child.material.depthWrite = true;
    }
  });

  camera.position.copy(model.position).add(cameraOffset);
  controls.target.copy(model.position).add(new THREE.Vector3(0, 0.5, 0));
  controls.update();
});

const stopDistance = 0.7;

function updateMovement() {
  if (!model) return;
  if (!mouseInside) {
    velocity.set(0, 0, 0);
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(groundPlane, target);

  if (head) {
    const lookTarget = new THREE.Vector3(
      target.x,
      head.getWorldPosition(new THREE.Vector3()).y,
      target.z
    );
    head.lookAt(lookTarget);
    head.rotateY(Math.PI);
  }

  const distance = target.distanceTo(model.position);

  if (distance <= stopDistance) {
    velocity.set(0, 0, 0);
  } else {
    const direction = new THREE.Vector3().subVectors(target, model.position).normalize();
    velocity.add(direction.multiplyScalar(acceleration * distance));
    if (velocity.length() > maxSpeed) velocity.setLength(maxSpeed);
    velocity.multiplyScalar(friction);
    if (velocity.length() <= 0.001) velocity.set(0, 0, 0);
    model.position.add(velocity);

    if (velocity.length() > 0.005) {
      const lookTarget = new THREE.Vector3().addVectors(model.position, velocity);
      const angle = Math.atan2(lookTarget.x - model.position.x, lookTarget.z - model.position.z);
      model.rotation.y = angle;
    }
  }

  const distanceFromCenter = Math.sqrt(model.position.x ** 2 + model.position.z ** 2);

  if (distanceFromCenter > waterInnerRadius + 0.27) {
    model.position.y = THREE.MathUtils.lerp(model.position.y, -0.5, 0.1);
  } else {
    model.position.y = THREE.MathUtils.lerp(model.position.y, 0, 0.1);
  }

  if (distanceFromCenter > waterOuterRadius - 1.5) {
    const direction = new THREE.Vector3(model.position.x, 0, model.position.z).normalize();
    model.position.x = direction.x * (waterOuterRadius - 1.5);
    model.position.z = direction.z * (waterOuterRadius - 1.5);
    velocity.multiplyScalar(0.3);
  }
  const speed = velocity.length();
const isInWater = model.position.y < -0.2;

if (speed > 0.01 && !isInWater) {


  // 👉 interval dynamique (plus rapide = plus de pas)
  const dynamicInterval = THREE.MathUtils.lerp(0.25, 0.08, speed * 6);

  // 👉 timer accéléré avec la vitesse
  stepTimer += 0.016 * (1 + speed * 12);

  if (stepTimer > dynamicInterval) {
    stepTimer = 0;

    const offset = new THREE.Vector3(
      Math.sin(walkTime) * 0.15,
      0,
      Math.cos(walkTime) * 0.15
    );

    const footPos = model.position.clone().add(offset);

    createFootprint(footPos, model.rotation.y);
  }

}
}

const desiredCameraPos = new THREE.Vector3();
function updateCamera() {
  if (!model) return;

  // ☀️ soleil suit le perso (propre et stable)
  sunLight.position.x = model.position.x + 8;
  sunLight.position.z = model.position.z + 6;
  sunLight.target.position.copy(model.position);
  sunLight.target.updateMatrixWorld();

  // 💡 rim light suit aussi
  rimLight.target = model;
  scene.add(rimLight.target);

  desiredCameraPos.copy(model.position).add(cameraOffset);
  camera.position.lerp(desiredCameraPos, cameraLerpFactor);

  controls.target.lerp(
    new THREE.Vector3(model.position.x, model.position.y + 0.5, model.position.z),
    cameraLerpFactor
  );
}



function updateLegs() {
  if (!legL || !legR) return;
  const speed = velocity.length();
  if (speed < 0.01) {
    legL.rotation.copy(legLBaseRot);
    legR.rotation.copy(legRBaseRot);
    return;
  }
  walkTime += speed * 5;
  const angle = Math.sin(walkTime) * 0.8;
  legL.rotation.x = legLBaseRot.x + angle;
  legR.rotation.x = legRBaseRot.x - angle;
}

function updateBodyBounce() {
  if (!body) return;
  const isInWater = model.position.y < -0.3;
  const speed = velocity.length();
  if (speed < 0.01) {
    body.position.y = THREE.MathUtils.lerp(body.position.y, bodyBaseY, 0.1);
    body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, bodyBaseRot.z, 0.1);
    return;
  }
  body.position.y = bodyBaseY + Math.abs(Math.sin(walkTime)) * 0.15;
  const tiltDirection = isInWater ? -1 : 1;
  body.rotation.z = bodyBaseRot.z + Math.sin(walkTime) * 0.05 * tiltDirection;
  
  const speedFactor = velocity.length() * 5;
  const targetTiltX = isInWater ? speedFactor : 0;
  body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, bodyBaseRot.x + targetTiltX, 0.1);
}

function updateAppleBounce() {
  if (!apple) return;
  const speed = velocity.length();
  if (speed < 0.08) {
    apple.position.y = THREE.MathUtils.lerp(apple.position.y, appleBaseY, 0.1);
    apple.rotation.z = THREE.MathUtils.lerp(apple.rotation.z, appleBaseRot.z, 0.1);
    return;
  }
  apple.position.y = appleBaseY + Math.abs(Math.sin(walkTime)) * 0.1 + 0.05;
  apple.rotation.z = appleBaseRot.z + Math.sin(walkTime) * 0.2;
}

function updateWings() {
  if (!wingL || !wingR) return;
  const speed = velocity.length();
  const idle = Math.sin(Date.now() * 0.002) * 0.05;
  if (speed < 0.01) {
    wingL.rotation.z = wingLBaseRot.z + idle;
    wingR.rotation.z = wingRBaseRot.z - idle;
    return;
  }
  const flap = Math.sin(walkTime) * 0.3;
  wingL.rotation.z = wingLBaseRot.z - 0.2 + flap;
  wingR.rotation.z = wingRBaseRot.z + 0.2 - flap;
}

// APPLES DISPERSION
const numberOfApples = 20;
const dispersionRadius = groundRadius - 1;

loader.load('/models/apple.glb', (gltf) => {
  const originalApple = gltf.scene;
  originalApple.scale.set(0.4, 0.4, 0.4);
  originalApple.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
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


function createFootprint(position, rotationY) {
  const geo = new THREE.PlaneGeometry(0.25, 0.4); // rectangle pied
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    transparent: true,
    opacity: 0.05,
    roughness: 1,
    metalness: 0
  });

  const footprint = new THREE.Mesh(geo, mat);

  footprint.rotation.x = -Math.PI / 2;
  footprint.rotation.z = rotationY;
  footprint.position.copy(position);
  footprint.position.y = -0.25; // juste au-dessus du sol

  scene.add(footprint);

  footprints.push({
    mesh: footprint,
    life: 1.0
  });
}



loader.load('/models/tree.glb', (gltf) => {
  const tree = gltf.scene;

  tree.scale.set(4, 4, 4); // ajuste si besoin

  tree.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 👉 POSITION (pas au centre)
  tree.position.set(5, 3.2, -3); // 👈 change ici

  scene.add(tree);
});






// ANIMATE
function animate() {
  requestAnimationFrame(animate);
  updateMovement();
  updateLegs();
  updateBodyBounce();
  updateAppleBounce();
  updateWings();
  updateCamera();
  const positions = water.geometry.attributes.position;
const time = performance.now() * 0.001;

for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);

  const wave =
    Math.sin(x * 0.5 + time) * 0.03 +
    Math.cos(y * 0.5 + time * 1.2) * 0.03;

  positions.setZ(i, wave);
}
for (let i = footprints.length - 1; i >= 0; i--) {
  const f = footprints[i];

  f.life -= 0.01;

  // fade
  f.mesh.material.opacity = f.life * 0.1;

  // petit shrink stylé
  const scale = 0.8 + f.life * 0.2;
  f.mesh.scale.set(scale, scale, scale);

  if (f.life <= 0) {
    scene.remove(f.mesh);
    footprints.splice(i, 1);
  }
}
positions.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
}

animate();