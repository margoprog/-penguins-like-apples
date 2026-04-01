import { renderer, scene, camera, controls,animateWaterFoam } from './scene.js';
import { updateMovement, updateLegs, updateBodyBounce, updateAppleBounce, updateWings, updateCamera, updateKnockout, initAudio } from './penguin.js';
import { updateFootprints, updateWaves, animateLeaves } from './world.js';

  initAudio(camera);
const logoOverlay = document.getElementById('overlay-logo');

function handleUserInteraction() {
  if (!sound || !listener) return;

  if (listener.context.state === 'suspended') {
    listener.context.resume();
  }

  if (!sound.isPlaying) {
    sound.play();
    console.log("Musique lancée 🔊");
  }

  if (logoOverlay) {
    logoOverlay.classList.add('hidden');
    console.log("Logo caché ✅");
  }
  
  window.removeEventListener('click', handleUserInteraction);
  window.removeEventListener('touchstart', handleUserInteraction);
}



function handleStart() {
  if (logoOverlay) {
    console.log("Interaction détectée : Fermeture de l'overlay");
    
    logoOverlay.classList.add('hidden');

    if (typeof sound !== 'undefined' && typeof listener !== 'undefined') {
      if (listener.context.state === 'suspended') {
        listener.context.resume();
      }
      if (!sound.isPlaying) {
        sound.play();
      }
    }
  }
}

window.addEventListener('click', handleStart, { once: true });
window.addEventListener('touchstart', handleStart, { once: true });
window.addEventListener('click', handleUserInteraction);
window.addEventListener('touchstart', handleUserInteraction);
  
function animate() {
  requestAnimationFrame(animate);
  updateMovement();
  updateLegs();
  updateBodyBounce();
  updateAppleBounce();
  updateWings();
  updateCamera();
  updateWaves();
  updateKnockout();
  animateLeaves();
  updateFootprints();
  animateWaterFoam();

  
  
  controls.update();
  renderer.render(scene, camera);
}

animate();



