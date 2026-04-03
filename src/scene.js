import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



export const scene = new THREE.Scene();




scene.background = new THREE.Color(0xfd9743);
// Brume linéaire (commence à X unités, opaque à Y unités)


const loader = new THREE.TextureLoader();

loader.load('/environmentMaps/map2.png', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  scene.environment = texture;
  scene.background = texture;
});

export const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 2, 8);

// export const cameraOffset = new THREE.Vector3(0, 4, 8);
export const cameraOffset = new THREE.Vector3(0, 4.75, 10);

export const cameraLerpFactor = 0.08;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableRotate = false;
controls.target.set(0, 0.5, 0);

function createNoiseTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = 180 + Math.random() * 75;
    imageData.data[i] = noise;
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

export const noiseTex = createNoiseTexture();

// SOL
export const groundRadius = 30;

const groundGeometry = new THREE.CircleGeometry(groundRadius, 64);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xfc7c4e,
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

// sol2
export const ground2Radius = 15;

const ground2Geometry = new THREE.CircleGeometry(ground2Radius, 64);

// 👉 rendre légèrement irrégulier (safe)
const pos = ground2Geometry.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const dist = Math.sqrt(x * x + y * y);

  // uniquement le bord
  // plus visible + toujours safe
if (dist > ground2Radius * 0.85) {
  const angle = Math.atan2(y, x);

  const noise = Math.sin(angle * 5) * 1; // ← plus fort
  

  const newDist = dist + noise;

  pos.setX(i, Math.cos(angle) * newDist);
  pos.setY(i, Math.sin(angle) * newDist);
}
}

pos.needsUpdate = true;
ground2Geometry.computeVertexNormals();

const ground2Material = new THREE.MeshStandardMaterial({
  color: 0xfd9046,
  roughness: 0.8,
  map: noiseTex,
  roughnessMap: noiseTex,
  side: THREE.DoubleSide,
});

const ground2 = new THREE.Mesh(ground2Geometry, ground2Material);
ground2.rotation.x = -Math.PI / 2;
ground2.position.y = -0.299;
ground2.receiveShadow = true;
scene.add(ground2);
//sol 3

export const ground3Radius = 9;

const ground3Geometry = new THREE.CircleGeometry(ground3Radius, 64);

// 👉 rendre les bords irréguliers
const position = ground3Geometry.attributes.position;

for (let i = 0; i < position.count; i++) {
  const x = position.getX(i);
  const y = position.getY(i);

  const dist = Math.sqrt(x * x + y * y);

  // détecter les points proches du bord
  if (dist > ground3Radius * 0.85) {
    const angle = Math.atan2(y, x);

    // bruit simple (irrégularité)
  const noise = Math.sin(angle * 7) * 0.5; // ← plus fort
    

    const newDist = dist + noise;

    position.setX(i, Math.cos(angle) * newDist);
    position.setY(i, Math.sin(angle) * newDist);
  }
}

position.needsUpdate = true;
ground3Geometry.computeVertexNormals();

const ground3Material = new THREE.MeshStandardMaterial({
  color: 0xffa15a,
  roughness: 0.8,
  map: noiseTex,
  roughnessMap: noiseTex,
  side: THREE.DoubleSide,
});

const ground3 = new THREE.Mesh(ground3Geometry, ground3Material);
ground3.rotation.x = -Math.PI / 2;
ground3.position.y = -0.29;
ground3.receiveShadow = true;

scene.add(ground3);

// PLAGE
const beachInnerRadius = groundRadius - 8;
const beachOuterRadius = groundRadius + 0.2;
const beachGeometry = new THREE.RingGeometry(beachInnerRadius, beachOuterRadius, 128);
const positions = beachGeometry.attributes.position;
const colors = [];
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  const dist = Math.sqrt(x * x + z * z);
  const t = (dist - beachInnerRadius) / (beachOuterRadius - beachInnerRadius);
  const shade = 0.75 + t * 0.25;
  colors.push(shade, shade * 0.95, shade * 0.8);
}
beachGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const sandNoise = createNoiseTexture();
sandNoise.repeat.set(20, 20);
sandNoise.offset.set(Math.random(), Math.random());
sandNoise.rotation = Math.random() * Math.PI;
sandNoise.center.set(0.5, 0.5);
const beachMaterial = new THREE.MeshStandardMaterial({
  map: sandNoise,
  roughnessMap: sandNoise,
  color: 0xf2e2b6,
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
});
beachMaterial.color.multiplyScalar(0.95 + Math.random() * 0.1);
const beach = new THREE.Mesh(beachGeometry, beachMaterial);
beach.rotation.x = -Math.PI / 2;
beach.position.y = -0.27;
beach.receiveShadow = true;
scene.add(beach);

// EAU
// foam.js




export const waterInnerRadius = groundRadius - 1;
export const waterOuterRadius = groundRadius + 150;
const waterGeometry = new THREE.RingGeometry(waterInnerRadius, waterOuterRadius, 128);
const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x9fa4f4,
    roughness: 0.1,
  metalness: 0.7,
  transparent: true,
  opacity: 0.9,
});

export const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.geometry.computeVertexNormals();
water.rotation.x = -Math.PI / 2;
water.position.y = -0.16;
water.receiveShadow = true;
scene.add(water);
water.material.envMapIntensity = 0.1; // test entre 0.1 et 0.6
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6; // ↓ baisse la luminosité globale
renderer.outputColorSpace = THREE.SRGBColorSpace;

const waterGeometry2 = new THREE.RingGeometry(waterInnerRadius - 3, waterOuterRadius, 128);
const water2 = new THREE.Mesh(waterGeometry2, waterMaterial);
water2.position.y = -1;
water2.rotation.x = -Math.PI / 2;
scene.add(water2);


const createDashTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 64, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(20, 1);
    return texture;
};

const setupCircularUVs = (geometry) => {
    const uv = geometry.getAttribute('uv');
    const pos = geometry.getAttribute('position');
    const vec = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i);
        const u = (Math.atan2(vec.y, vec.x) + Math.PI) / (Math.PI * 2);
        uv.setXY(i, u, uv.getY(i));
    }
    uv.needsUpdate = true;
};

const updateZWaves = (mesh, time, freq, amp) => {
    const pos = mesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        const angle = Math.atan2(pos.getY(i), pos.getX(i));
        const wave = Math.cos(angle * freq + time) * amp;
        pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
};

const foamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: createDashTexture(),
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const foamGeometry1 = new THREE.RingGeometry(waterInnerRadius + 3, waterInnerRadius + 3.6, 128);
setupCircularUVs(foamGeometry1);
export const waterFoam = new THREE.Mesh(foamGeometry1, foamMaterial);
waterFoam.position.y = 0;
waterFoam.rotation.x = -Math.PI / 2;
scene.add(waterFoam);

const foamGeometry2 = new THREE.RingGeometry(waterInnerRadius + 5.5, waterInnerRadius + 7.0, 128);
setupCircularUVs(foamGeometry2);
export const waterFoam2 = new THREE.Mesh(foamGeometry2, foamMaterial.clone());
waterFoam2.position.y = 0;
waterFoam2.rotation.x = -Math.PI / 2;
scene.add(waterFoam2);

export const animateWaterFoam = () => {
    if (!waterFoam || !waterFoam2) return;

    const t = performance.now() * 0.0003;

    const s1 = 1 + Math.sin(t * 0.8) * 0.03;
    waterFoam.scale.set(s1, s1, 1);
    waterFoam.material.map.offset.x += 0.0005;
    waterFoam.material.opacity = 0.1 + Math.sin(t * 1.5) * 0.3;
    updateZWaves(waterFoam, t, 12.0, 0.05);

    const s2 = 1 + Math.sin(t * 0.8 + 1.0) * 0.04;
    waterFoam2.scale.set(s2, s2, 1);
    waterFoam2.material.map.offset.x -= 0.0003;
    waterFoam2.material.opacity = 0.1 + Math.sin(t * 1.2) * 0.2;
    updateZWaves(waterFoam2, t + 0.5, 8.0, 0.04);
};
// LUMIÈRES
const ambient = new THREE.AmbientLight(0xffe5c6, 0.25);
scene.add(ambient);

export const sunLight = new THREE.DirectionalLight(0xffc58f, 2);
sunLight.position.set(8, 12, 6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.top = 32;
sunLight.shadow.camera.bottom = -32;
sunLight.shadow.camera.left = -32;
sunLight.shadow.camera.right = 32;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 50;
sunLight.shadow.radius = 4;
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.03;
scene.add(sunLight);
scene.add(sunLight.target);

const fillLight = new THREE.DirectionalLight(0x9fd6ff, 0.8);
fillLight.position.set(-10, 8, -6);
scene.add(fillLight);

export const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(-6, 6, -8);
scene.add(rimLight);

const bounceLight = new THREE.DirectionalLight(0xa8ffcb, 0.4);
bounceLight.position.set(0, -5, 0);
scene.add(bounceLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

