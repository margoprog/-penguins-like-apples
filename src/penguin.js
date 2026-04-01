import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, camera, controls, cameraOffset, cameraLerpFactor, sunLight, rimLight, waterInnerRadius, waterOuterRadius, renderer } from './scene.js';
import { createFootprint } from './world.js';
import { apples } from './world.js';
import { treeColliders } from './world.js';


//SOUND

let popBuffer = null; 

fetch('/sounds/pop.wav')
  .then(r => r.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { popBuffer = buffer; });

function playpop(volume = 1) {
  if (!popBuffer) return;
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.buffer = popBuffer;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
}


let fallBuffer = null; 

fetch('/sounds/fall.wav')
  .then(r => r.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { fallBuffer = buffer; });

function playfall(volume = 1) {
  if (!fallBuffer) return;
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.buffer = fallBuffer;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
}





let collectedApples = [];
const appleStackSpacing = 0.3;
const collectDistance = 0.8;
const APPLE_SCALE = 0.58;

let isKnockedOut = false;
let knockoutTimer = 0;
const KNOCKOUT_DURATION = 1.8;

function checkAppleCollection() {
  for (const apple of apples) {
    if (apple.collected) continue;

    const dx = model.position.x - apple.mesh.position.x;
    const dz = model.position.z - apple.mesh.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < collectDistance) {
      apple.collected = true;

      if (head) {
        head.add(apple.mesh);

        const index = collectedApples.length + 1;

        apple.mesh.scale.set(APPLE_SCALE, APPLE_SCALE, APPLE_SCALE);

        const offsetStrength = 0.03 + index * 0.005;
        const randomX = (Math.random() - 0.5) * offsetStrength;
        const randomZ = (Math.random() - 0.5) * offsetStrength;
        apple.mesh.position.set(randomX, 0, randomZ);

        apple.mesh.rotation.y = Math.random() * Math.PI * 2;
        apple.mesh.rotation.x = (Math.random() - 0.5) * 0.2;
        apple.mesh.rotation.z = (Math.random() - 0.5) * 0.2;

        const baseOffset = 0.6;
        const targetY = baseOffset + index * appleStackSpacing;

        let t = 0;
        function animateApple() {
          t += 0.08;
          apple.mesh.position.y = THREE.MathUtils.lerp(0, targetY, t);
          if (t < 1) requestAnimationFrame(animateApple);
        }
        animateApple();
        playpop(0.5);
      }

      collectedApples.push(apple.mesh);

      if (collectedApples.length > 12) {
        dropAllApples();
      }
    }
  }
}

function dropAllApples() {
  // 💥 Pingouin KO
  isKnockedOut = true;
  knockoutTimer = 0;
  

  for (const appleMesh of collectedApples) {
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    appleMesh.getWorldPosition(worldPos);
    appleMesh.getWorldQuaternion(worldQuat);
    appleMesh.getWorldScale(worldScale);

    head.remove(appleMesh);
    scene.add(appleMesh);

    appleMesh.position.copy(worldPos);
    appleMesh.quaternion.copy(worldQuat);
    appleMesh.scale.copy(worldScale);

    const gravity = 0.018;
    let vy = 0.08 + Math.random() * 0.1;
    let vx = (Math.random() - 0.5) * 0.25;
    let vz = (Math.random() - 0.5) * 0.25;

    const appleData = apples.find(a => a.mesh === appleMesh);

    function fall() {
      vy -= gravity;
      appleMesh.position.y += vy;
      appleMesh.position.x += vx;
      appleMesh.position.z += vz;
      appleMesh.rotation.z += 0.1;
      appleMesh.rotation.x += 0.07;

      vx *= 0.98;
      vz *= 0.98;

      if (appleMesh.position.y > 0) {
        requestAnimationFrame(fall);
      } else {
        appleMesh.position.y = 0;
        appleMesh.position.x += vx * 3;
        appleMesh.position.z += vz * 3;

        if (appleData) {
          appleData.collected = false;
          appleData.mesh.position.copy(appleMesh.position);
        }
      }
    }
    fall();
    playfall(0.5)
  }

  collectedApples = [];
}

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
  if (isKnockedOut) return;
  if (!mouseInside) { velocity.set(0, 0, 0); return; }
  const logoOverlay = document.getElementById('overlay-logo');
  if (logoOverlay && !logoOverlay.classList.contains('hidden')) {
    velocity.set(0, 0, 0); // On s'assure que la vitesse reste à zéro
    return; // On arrête l'exécution de la fonction ici
  }

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(groundPlane, target);
  checkAppleCollection();
  updateAppleStackBounce();

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
    handleTreeCollisions(model.position);

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

export function updateKnockout() {
  if (!model) return;
  if (!isKnockedOut) return;

  knockoutTimer += 0.016;
  const t = knockoutTimer / KNOCKOUT_DURATION;

  if (t < 0.15) {
    // ⚡ Chute ultra rapide style cartoon
    const fallProgress = t / 0.15;
    // Ease in cubique → lent au début puis BOUM
    const eased = fallProgress * fallProgress * fallProgress;
    model.rotation.order = 'YXZ';
    model.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, eased);
    // Légère montée avant la chute (anticipation cartoon)
    model.position.y = Math.sin(fallProgress * Math.PI) * 0.08;

  } else if (t < 0.15 + 0.01) {
    // 💥 Impact : écrasement instantané
    model.rotation.order = 'YXZ';
    model.rotation.x = Math.PI / 2;
    model.position.y = 0;

  } else if (t < 0.75) {
    // 😵 Au sol : vibration rapide qui s'amortit
    const groundTime = (t - 0.15) / (0.75 - 0.15);
    const vibration = Math.sin(knockoutTimer * 30) * 0.04 * (1 - groundTime);
    model.rotation.order = 'YXZ';
    model.rotation.x = Math.PI / 2 + vibration;
    model.position.y = 0;

  } else if (t < 0.9) {
    // 🦘 Saut cartoon : squash & stretch
    const jumpProgress = (t - 0.75) / 0.15;
    const jumpArc = Math.sin(jumpProgress * Math.PI);
    model.rotation.order = 'YXZ';
    model.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, jumpProgress * jumpProgress);
    model.position.y = jumpArc * 0.5;
    // Stretch vertical pendant le saut
    const stretch = 1 + jumpArc * 0.3;
    model.scale.set(0.35 / stretch, 0.35 * stretch, 0.35 / stretch);

  } else {
    // ✅ Remis debout, scale normal
    model.rotation.x = 0;
    model.rotation.z = 0;
    model.rotation.order = 'XYZ';
    model.position.y = 0;
    model.scale.set(0.35, 0.35, 0.35);
    isKnockedOut = false;
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

let lastStepSign = 0;



let stepBuffer = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

fetch('/sounds/step.mp3') // ← ton chemin
  .then(r => r.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { stepBuffer = buffer; });

function playStep(volume = 1) {
  if (!stepBuffer) return;
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.buffer = stepBuffer;
  console.log("wtf")
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
}

export function updateLegs() {
  if (!legL || !legR) return;
  const speed = velocity.length();
  if (speed < 0.01) {
    legL.rotation.copy(legLBaseRot);
    legR.rotation.copy(legRBaseRot);
    return;
  }

  walkTime += speed * 5;
  const sin = Math.sin(walkTime);
  const angle = sin * 0.8;
  legL.rotation.x = legLBaseRot.x + angle;
  legR.rotation.x = legRBaseRot.x - angle;

  const sign = Math.sign(sin);
  if (sign !== lastStepSign) {
    lastStepSign = sign;
    if( model.position.y > -0.3)
        playStep(1);
  }
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

export function updateAppleStackBounce() {
  if (!head || collectedApples.length === 0) return;

  const speed = velocity.length();

  for (let i = 0; i < collectedApples.length; i++) {
    const apple = collectedApples[i];
    const index = i + 1;
    const baseOffset = 0.4;
    const baseY = baseOffset + index * appleStackSpacing;
    const phase = walkTime + index * 0.4;

    if (speed < 0.08) {
      apple.position.y = THREE.MathUtils.lerp(apple.position.y, baseY, 0.1);
      apple.rotation.z = THREE.MathUtils.lerp(apple.rotation.z, 0, 0.1);
      apple.rotation.x = THREE.MathUtils.lerp(apple.rotation.x, 0, 0.1);
      continue;
    }

    const heightFactor = 1 + index * 0.15;
    apple.position.y = baseY + Math.abs(Math.sin(phase)) * 0.08 * heightFactor;
    apple.rotation.z = Math.sin(phase) * 0.15 * heightFactor;
    apple.rotation.x = Math.cos(phase) * 0.1 * heightFactor;
  }
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

const playerRadius = 0.6;

function handleTreeCollisions(position) {
  for (const tree of treeColliders) {
    const treePos = tree.mesh.position;
    const dx = position.x - treePos.x;
    const dz = position.z - treePos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = playerRadius + tree.radius;

    if (distance < minDistance) {
      const angle = Math.atan2(dz, dx);
      position.x = treePos.x + Math.cos(angle) * minDistance;
      position.z = treePos.z + Math.sin(angle) * minDistance;
    }
  }
}





let sound, listener; // Variables globales

export function initAudio(camera) {
  // 1. Création de l'oreille
  listener = new THREE.AudioListener();
  camera.add(listener);

  // 2. Création de la source sonore
  sound = new THREE.Audio(listener);

  // 3. Chargement
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('/sounds/music.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.1);
    console.log("Musique prête !");
  });
}

function handleUserInteraction() {
  if (!sound || !listener) return;

  // Débloque l'audio pour le navigateur
  if (listener.context.state === 'suspended') {
    listener.context.resume();
  }

  if (!sound.isPlaying) {
    sound.play();
    console.log("Musique lancée 🔊");
  }
  
  // Optionnel : retirer les listeners après le premier succès pour économiser des ressources
  window.removeEventListener('click', handleUserInteraction);
}

window.addEventListener('click', handleUserInteraction);
window.addEventListener('touchstart', handleUserInteraction);