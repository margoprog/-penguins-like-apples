import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9f5ff);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(6, 2, 8);

// --- CAMERA FOLLOW SETTINGS ---
// Décalage fixe de la caméra par rapport au personnage (en espace monde)
const cameraOffset = new THREE.Vector3(0, 6, 10);
// Vitesse de lissage du suivi (0 = instantané, valeurs < 1 = smooth)
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

// CONTROLS — gardés pour la rotation manuelle, mais le target suivra le personnage
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false; // Désactive le pan pour ne pas dérégler le suivi
controls.target.set(0, 0.5, 0);

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
  roughness: 0.8,
  map: noiseTex,
  roughnessMap: noiseTex,
  side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// HEMISPHERE LIGHT
const hemiLight = new THREE.HemisphereLight(0xc5d9ff, 0x6ea572, 1.41);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// DIRECTIONAL LIGHT
const dirLight = new THREE.DirectionalLight(0xffffff, 2.73);
dirLight.position.set(11.2, 5, 6.7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.top = 6;
dirLight.shadow.camera.bottom = -6;
dirLight.shadow.camera.left = -6;
dirLight.shadow.camera.right = 6;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 30;
dirLight.shadow.bias = -0.00005;
dirLight.shadow.normalBias = 0.05;
scene.add(dirLight);

const gui = new GUI();

// GUI — HEMISPHERE LIGHT
const hemiFolder = gui.addFolder('Hemisphere Light');
const hemiParams = { intensity: 1.2, skyColor: '#ffffff', groundColor: '#444444' };
hemiFolder.add(hemiParams, 'intensity', 0, 3, 0.01).onChange(value => hemiLight.intensity = value);
hemiFolder.addColor(hemiParams, 'skyColor').onChange(value => hemiLight.color.set(value));
hemiFolder.addColor(hemiParams, 'groundColor').onChange(value => hemiLight.groundColor.set(value));
hemiFolder.open();

// GUI — DIRECTIONAL LIGHT
const dirFolder = gui.addFolder('Directional Light');
const dirParams = { intensity: 1.7, x: 5, y: 10, z: 2, bias: -0.0005 };
dirFolder.add(dirParams, 'intensity', 0, 5, 0.01).onChange(value => dirLight.intensity = value);
dirFolder.add(dirParams, 'x', -20, 20, 0.1).onChange(value => dirLight.position.x = value);
dirFolder.add(dirParams, 'y', 0, 20, 0.1).onChange(value => dirLight.position.y = value);
dirFolder.add(dirParams, 'z', -20, 20, 0.1).onChange(value => dirLight.position.z = value);
dirFolder.add(dirParams, 'bias', -0.01, 0.01, 0.0001).onChange(value => dirLight.shadow.bias = value);
dirFolder.open();

// GUI — SHADOW SETTINGS
const shadowFolder = gui.addFolder('Shadows');
const shadowParams = { mapSize: 2048, top: 10, bottom: -10, left: -10, right: 10, near: 0.5, far: 20 };
shadowFolder.add(shadowParams, 'mapSize', 256, 4096, 256).onChange(value => {
  dirLight.shadow.mapSize.width = value;
  dirLight.shadow.mapSize.height = value;
  dirLight.shadow.map.dispose();
});
shadowFolder.add(shadowParams, 'top', 0, 50).onChange(v => dirLight.shadow.camera.top = v);
shadowFolder.add(shadowParams, 'bottom', -50, 0).onChange(v => dirLight.shadow.camera.bottom = v);
shadowFolder.add(shadowParams, 'left', -50, 0).onChange(v => dirLight.shadow.camera.left = v);
shadowFolder.add(shadowParams, 'right', 0, 50).onChange(v => dirLight.shadow.camera.right = v);
shadowFolder.add(shadowParams, 'near', 0.1, 10).onChange(v => dirLight.shadow.camera.near = v);
shadowFolder.add(shadowParams, 'far', 1, 100).onChange(v => dirLight.shadow.camera.far = v);
shadowFolder.open();

// GUI — CAMERA FOLLOW SETTINGS
const cameraFolder = gui.addFolder('Camera Follow');
const cameraParams = {
  offsetX: 0,
  offsetY: 6,
  offsetZ: 10,
  lerpFactor: 0.08
};
cameraFolder.add(cameraParams, 'offsetX', -20, 20, 0.1).onChange(v => cameraOffset.x = v);
cameraFolder.add(cameraParams, 'offsetY', 1, 20, 0.1).onChange(v => cameraOffset.y = v);
cameraFolder.add(cameraParams, 'offsetZ', 1, 30, 0.1).onChange(v => cameraOffset.z = v);
cameraFolder.add(cameraParams, 'lerpFactor', 0.01, 1, 0.01).onChange(v => { /* handled inline */ });
cameraFolder.open();

// VARIABLES PINGOUIN
let model = null, head = null, apple = null;
let legL = null, legR = null, body = null, wingL = null, wingR = null;

let legLBaseRot = new THREE.Euler(), legRBaseRot = new THREE.Euler();
let wingLBaseRot = new THREE.Euler(), wingRBaseRot = new THREE.Euler();
let bodyBaseY = 0, bodyBaseRot = new THREE.Euler(), bodyBaseX = 0;
let appleBaseY = 0;

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

  // ✅ check si dans le canvas
  mouseInside =
    x >= 0 &&
    x <= rect.width &&
    y >= 0 &&
    y <= rect.height;

  // normalisation raycaster
  mouse.x = (x / rect.width) * 2 - 1;
  mouse.y = -(y / rect.height) * 2 + 1;
});

// 🔥 important → quand la souris sort du canvas
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

  if (apple) appleBaseY = apple.position.y;
  if (legL)  legLBaseRot.copy(legL.rotation);
  if (legR)  legRBaseRot.copy(legR.rotation);
  if (wingL) wingLBaseRot.copy(wingL.rotation);
  if (wingR) wingRBaseRot.copy(wingR.rotation);
  if (body) {
    bodyBaseY = body.position.y;
    bodyBaseRot.copy(body.rotation);
    bodyBaseX = body.position.x;
  }

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeVertexNormals();
      if (child.material) child.material.depthWrite = true;
      child.material.flatShading = false;
      child.material.needsUpdate = true;
      child.material.dithering = true;
    }
  });

  // Positionner la caméra immédiatement sur le personnage au chargement
  camera.position.copy(model.position).add(cameraOffset);
  controls.target.copy(model.position).add(new THREE.Vector3(0, 0.5, 0));
  controls.update();
});

function updateMovement() {
  if (!model) return;

  // ⛔ souris hors canvas
  if (!mouseInside) {
    velocity.lerp(new THREE.Vector3(0, 0, 0), 0.1);

    if (velocity.length() < 0.001) velocity.set(0, 0, 0);

    model.position.add(velocity);
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

  const direction = new THREE.Vector3()
    .subVectors(target, model.position)
    .multiplyScalar(acceleration * target.distanceTo(model.position));

  velocity.add(direction);

  if (velocity.length() > maxSpeed) velocity.setLength(maxSpeed);

  velocity.multiplyScalar(friction);

  if (velocity.length() < 0.001) velocity.set(0, 0, 0);

  model.position.add(velocity);

  if (velocity.length() > 0.005) {
    const lookTarget = new THREE.Vector3().addVectors(model.position, velocity);
    model.lookAt(lookTarget);
  }
}


// --- CAMERA FOLLOW ---
// Position cible de la caméra = position du modèle + offset
const desiredCameraPos = new THREE.Vector3();

function updateCamera() {
  if (!model) return;

  // Position souhaitée : directement au-dessus/derrière le personnage
  desiredCameraPos.copy(model.position).add(cameraOffset);

  // Lerp smooth vers la position désirée
  camera.position.lerp(desiredCameraPos, cameraParams.lerpFactor);

  // Le target des OrbitControls suit aussi le personnage en douceur
  controls.target.lerp(
    new THREE.Vector3(model.position.x, model.position.y + 0.5, model.position.z),
    cameraParams.lerpFactor
  );
}

// LEGS
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

// BODY BOUNCE
function updateBodyBounce() {
  if (!body) return;
  const speed = velocity.length();
  if (speed < 0.01) {
    body.position.y = THREE.MathUtils.lerp(body.position.y, bodyBaseY, 0.1);
    body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, bodyBaseRot.z, 0.1);
    return;
  }
  body.position.y = bodyBaseY + Math.abs(Math.sin(walkTime)) * 0.15;
  body.rotation.z = bodyBaseRot.z + Math.sin(walkTime) * 0.05;
}

// APPLE BOUNCE
function updateAppleBounce() {
  if (!apple) return;
  const speed = velocity.length();
  if (speed < 0.08) {
    apple.position.y = THREE.MathUtils.lerp(apple.position.y, appleBaseY, 0.1);
    return;
  }
  const bodyBounce = Math.abs(Math.sin(walkTime)) * 0.1;
  apple.position.y = appleBaseY + bodyBounce + 0.05 + Math.sin(walkTime * 2) * 0.02;
}

// WINGS
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
const applesArray = [];
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
    const randomX = Math.cos(angle) * radius;
    const randomZ = Math.sin(angle) * radius;
    appleClone.position.set(randomX, -0.05, randomZ);
    appleClone.rotation.y = Math.random() * Math.PI * 2;
    scene.add(appleClone);
    applesArray.push(appleClone);
  }

  console.log(`${numberOfApples} pommes ont été réparties sur le sol !`);
}, undefined, (error) => {
  console.error("Erreur lors du chargement ou de la répartition des pommes :", error);
});

// ANIMATE
function animate() {
  requestAnimationFrame(animate);
  updateMovement();
  updateLegs();
  updateBodyBounce();
  updateAppleBounce();
  updateWings();
  updateCamera(); // 🎯 Mise à jour du suivi caméra
//   console.log(mouseInside)
  controls.update();
  renderer.render(scene, camera);
}

animate();