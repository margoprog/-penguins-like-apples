import { renderer, scene, camera, controls,animateWaterFoam } from './scene.js';
import { updateMovement, updateLegs, updateBodyBounce, updateAppleBounce, updateWings, updateCamera, updateKnockout } from './penguin.js';
import { updateFootprints, updateWaves, animateLeaves } from './world.js';


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

