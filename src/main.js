import { renderer, scene, camera, controls } from './scene.js';
import { updateMovement, updateLegs, updateBodyBounce, updateAppleBounce, updateWings, updateCamera } from './penguin.js';
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
  animateLeaves();
  updateFootprints();
  controls.update();
  renderer.render(scene, camera);
}

animate();