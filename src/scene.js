import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);

export const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 2, 8);

export const cameraOffset = new THREE.Vector3(0, 4.75, 9);
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

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
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
  color: 0xb1Ed8c,
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
export const waterInnerRadius = groundRadius - 1;
export const waterOuterRadius = groundRadius + 150;
const waterGeometry = new THREE.RingGeometry(waterInnerRadius, waterOuterRadius, 128);
const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x4da6ff, roughness: 0.25, metalness: 0.4, transparent: true, opacity: 0.95,
});
export const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.geometry.computeVertexNormals();
water.rotation.x = -Math.PI / 2;
water.position.y = -0.16;
water.receiveShadow = true;
scene.add(water);
const waterGeometry2 = new THREE.RingGeometry(waterInnerRadius - 3, waterOuterRadius, 128);
const water2 = new THREE.Mesh(waterGeometry2, waterMaterial);
water2.position.y = -1;
water2.rotation.x = -Math.PI / 2;
scene.add(water2);

// LUMIÈRES
const ambient = new THREE.AmbientLight(0xffe5c6, 0.25);
scene.add(ambient);

export const sunLight = new THREE.DirectionalLight(0xffc58f, 2);
sunLight.position.set(8, 12, 6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.bottom = -10;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.right = 10;
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