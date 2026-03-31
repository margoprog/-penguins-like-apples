import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, camera, controls, cameraOffset, cameraLerpFactor, sunLight, rimLight, waterInnerRadius, waterOuterRadius, renderer } from './scene.js';
import { createFootprint } from './world.js';

export let model = null;
let head = null, apple = null, legL = null, legR = null;
let body = null, wingL = null, wingR = null;
let legLBaseRot = new THREE.Euler(), legRBaseRot = new THREE.Euler();
let wingLBaseRot = new THREE.Euler(), wingRBaseRot = new THREE.Euler();
let bodyBaseY = 0, bodyBaseRot = new THREE.Euler();
let appleBaseY = 0, appleBaseRot = new THREE.Euler();

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const target = new THREE.Vector3();

export const velocity = new THREE.Vector3();
const acceleration = 0.0015;
const friction = 0.90;
const maxSpeed = 0.12;
export let walkTime = 0;

const stopDistance = 0.7;
let stepTimer = 0;
let mouseInside = false;

renderer.domElement.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  mouseInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
  mouse.x = (x / rect.width) * 2 - 1;
  mouse.y = -(y / rect.height) * 2 + 1;
});
renderer.domElement.addEventListener('mouseleave', () => { mouseInside = false; });

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
  if (body)  { bodyBaseY = body.position.y; bodyBaseRot.copy(body.rotation); }
  if (apple) { appleBaseY = apple.position.y; appleBaseRot.copy(apple.rotation); }

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

export function updateMovement() {
  if (!model) return;
  if (!mouseInside) { velocity.set(0, 0, 0); return; }

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(groundPlane, target);

  if (head) {
    const lookTarget = new THREE.Vector3(target.x, head.getWorldPosition(new THREE.Vector3()).y, target.z);
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
    const dynamicInterval = THREE.MathUtils.lerp(0.25, 0.08, speed * 6);
    stepTimer += 0.016 * (1 + speed * 12);
    if (stepTimer > dynamicInterval) {
      stepTimer = 0;
      const offset = new THREE.Vector3(Math.sin(walkTime) * 0.15, 0, Math.cos(walkTime) * 0.15);
      const footPos = model.position.clone().add(offset);
      createFootprint(footPos, model.rotation.y);
    }
  }
}

const desiredCameraPos = new THREE.Vector3();
export function updateCamera() {
  if (!model) return;
  sunLight.position.x = model.position.x + 8;
  sunLight.position.z = model.position.z + 6;
  sunLight.target.position.copy(model.position);
  sunLight.target.updateMatrixWorld();
  rimLight.target = model;
  scene.add(rimLight.target);
  desiredCameraPos.copy(model.position).add(cameraOffset);
  camera.position.lerp(desiredCameraPos, cameraLerpFactor);
  controls.target.lerp(
    new THREE.Vector3(model.position.x, model.position.y + 0.5, model.position.z),
    cameraLerpFactor
  );
}

export function updateLegs() {
  if (!legL || !legR) return;
  const speed = velocity.length();
  if (speed < 0.01) { legL.rotation.copy(legLBaseRot); legR.rotation.copy(legRBaseRot); return; }
  walkTime += speed * 5;
  const angle = Math.sin(walkTime) * 0.8;
  legL.rotation.x = legLBaseRot.x + angle;
  legR.rotation.x = legRBaseRot.x - angle;
}

export function updateBodyBounce() {
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

export function updateAppleBounce() {
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

export function updateWings() {
  if (!wingL || !wingR) return;
  const speed = velocity.length();
  const idle = Math.sin(Date.now() * 0.002) * 0.05;
  if (speed < 0.01) { wingL.rotation.z = wingLBaseRot.z + idle; wingR.rotation.z = wingRBaseRot.z - idle; return; }
  const flap = Math.sin(walkTime) * 0.3;
  wingL.rotation.z = wingLBaseRot.z - 0.2 + flap;
  wingR.rotation.z = wingRBaseRot.z + 0.2 - flap;
}