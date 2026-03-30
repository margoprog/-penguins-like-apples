import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import CANNON, { Vec3 } from 'cannon'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'


//import { roughness } from 'three/tsl'

/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}
//const debugObject2 = {}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
//scene.background = new THREE.Color("#fefae0");d8e2dc
scene.background = new THREE.Color("#000000")

// const axesHelper = new THREE.AxesHelper(5) // Longueur des axes = 5 unités
//scene.add(axesHelper)

//physics 
const world = new CANNON.World()
world.gravity.set(0, 0, 0)



// /* ---------------------------------------------------
//    HDRI (comme dans ton projet précédent)
// --------------------------------------------------- */
// const rgbeLoader = new RGBELoader()
// rgbeLoader.load('/environmentMaps/image1.hdr', (env) => {
//     env.mapping = THREE.EquirectangularReflectionMapping
//     scene.environment = env
//     scene.background = null // forêt doit être noir profond
// })

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'

])

const default_color = new THREE.Color("#880FeE")
    // Définir un tableau de 4 couleurs (vous pouvez les modifier selon vos préférences)
    const trailColors = [
  

        new THREE.Color("#0F00FF"), // Bleu
        new THREE.Color("#0F00FF"), // Bleu
        new THREE.Color("#8400eE"), // Bleu
      //  new THREE.Color("#8400eE"), // Bleu
      //  new THREE.Color("#0F00FF"), // Bleu

         new THREE.Color("#FFAAFB"), 


    ];
    let currentColorIndex = 0; // Index pour suivre la couleur actuelle dans le cycle
    
const matcapTexture = textureLoader.load('/textures/matCap/3a.png'); // Remplace par le bon chemin



const normal_material = new THREE.MeshNormalMaterial()
//normal_material.flatShading = true

const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0,
        restitution: 1
    }
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial

////////////////////////////////----SHPERE----///////////////////////////

const sphereGeometry = new THREE.SphereGeometry(0.8, 7, 12)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.1,
    wireframe : true,
    color: '#00FF00',
    side: THREE.DoubleSide
    })


const shape = new CANNON.Sphere(0.5)
const body = new CANNON.Body({
    mass: 1.3,
    position: new CANNON.Vec3(0,0,0),
    shape: shape,
    material: defaultMaterial,
    velocity: new CANNON.Vec3(0, 0, 0)
})
// body.position.copy(position)
world.addBody(body)

const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
mesh.castShadow = true
mesh.scale.set(0.5, 0.5, 0.5)
mesh.position.copy(body.position)
scene.add(mesh)




////////////////////////////////----TORU RING----///////////////////////////

//const ring = new THREE.RingGeometry(1, 5, 32)


// const ringMaterial = new THREE.MeshStandardMaterial(
// {
//     metalness: 1,
//     roughness: 0.5,
//    // wireframe : true,
//     color: '#02010d',
//    // side: THREE.DoubleSide
// })

//const ringMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );

//scene.add(ring)


// Paramètres du cercle
const ringRadius = 1; // Rayon du cercle
const ringNumParticles = 50; // Nombre de particules

// Charger la texture des particules
const ringPointTexture = new THREE.TextureLoader().load('particles/1.png');

// Création du matériau des particules
const ringMaterial = new THREE.PointsMaterial({
    color: '#8338ec',
    size: 0.07,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    map: ringPointTexture,
    depthWrite: false
});

// Création de la géométrie des particules
const ringGeometry = new THREE.BufferGeometry();
const pos = [];

for (let i = 0; i < ringNumParticles; i++) {
    const angle = (i / ringNumParticles) * Math.PI * 2;
    const x = Math.cos(angle) * ringRadius;
    const z = Math.sin(angle) * ringRadius;
    const y = 0; // Cercle en 2D

    pos.push(x, y, z);
}

// Convertir en buffer
ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))

// Création des particules
const ringParticles = new THREE.Points(ringGeometry, ringMaterial);
scene.add(ringParticles);

// ---- Ajouter un helper d’axes ----
const axesHelper = new THREE.AxesHelper(3); // Longueur des axes
//ringParticles.add(axesHelper);


////////////////////////////////----RING GROUP----///////////////////////////



// Ajouter 3 copies avec un décalage de 1 unité sur X
// Ajouter 3 copies avec un décalage et une rotation unique
const torusRadius = 2; // Rayon du tore (cercle principal)
const numRings = 270; // Nombre de rings autour du tore

const ringGroup = new THREE.Group();

for (let i = 0; i < numRings; i++) {
    const angle = (i / numRings) * Math.PI * 2; // Angle en radians

    // Calcul des positions pour former un tube
    const x = Math.cos(angle) * torusRadius;
    const z = Math.sin(angle) * torusRadius;
    const y = 0; // Aligné sur le plan XZ

    const ringClone = ringParticles.clone();
    ringClone.position.set(x, y, z);

    // Faire en sorte que le ring soit perpendiculaire au tube
    ringClone.lookAt(0, y, 0); // Regarde vers l'axe du tore

    // Appliquer un quart de tour sur l'axe X
    ringClone.rotateZ(Math.PI / 2); // Rotation de 90 degrés

    ringGroup.add(ringClone);
}

scene.add(ringGroup)



////////////////////////////////----TORUS BACK ----///////////////////////////

const torusBackGeometry = new THREE.TorusGeometry(8.9, 5.2, 29, 100)


const torusBackMaterial = new THREE.MeshStandardMaterial(
{
    metalness: 1,
    roughness: 0.3,
   // wireframe : true,
    color: '#FF00FF',
   // side: THREE.DoubleSide
})


////////////////////////////////----TORUS----///////////////////////////



// // Paramètres du tore
// const torusRadius = 9; // Rayon principal du tore
// const tubeRadius = 5.3;   // Rayon du tube
// const numParticles = 2000; // Nombre de particules

// const numRings = 80; // Nombre d'anneaux (bracelets) sur le torus
// const particlesPerRing = 30; // Nombre de particules par anneau

// const torusGeometry = new THREE.BufferGeometry();
// const positions = new Float32Array(numParticles * 3);
// const angles = new Float32Array(numParticles); // Stocker les angles pour l'animation

// // Générer les particules sous forme d'anneaux autour du tore
// for (let i = 0; i < numParticles; i++) {
//     const angle = (i / numParticles) * Math.PI * 2; // Angle autour du tore
//     const tubeAngle = (i % particlesPerRing) / particlesPerRing * Math.PI * 2; // Angle dans le tube

//     // Calcul des positions de base sur le tore
//     const x = (torusRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle);
//     const y = (torusRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle);
//     const z = tubeRadius * Math.sin(tubeAngle);

//     // Application de l'ondulation pour créer un effet zigzag (vague)
//     const waveAmplitude = 0.5;  // Amplitude de la vague
//     const waveFrequency = 2;    // Fréquence de la vague

//     // Déformation sinusoïdale pour chaque particule, ajoutant la vague
//     const waveOffsetX = waveAmplitude * Math.sin(tubeAngle * waveFrequency);
//     const waveOffsetY = waveAmplitude * Math.cos(tubeAngle * waveFrequency);
//     const waveOffsetZ = waveAmplitude * Math.sin(tubeAngle * waveFrequency); // On peut aussi déformer en Z

//     // Appliquer la déformation sur X, Y, Z
//     positions[i * 3] = x + waveOffsetX; // Déformation sur X (zigzag)
//     positions[i * 3 + 1] = y + waveOffsetY; // Déformation sur Y (zigzag)
//     positions[i * 3 + 2] = z + waveOffsetZ; // Déformation sur Z (zigzag)

//     angles[i] = angle; // Sauvegarde l'angle initial
// }

// // Ajouter les positions à la géométrie
// torusGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// // Charger la texture
// const pointTexture = new THREE.TextureLoader().load('particles/1.png');

// // Créer le matériau des particules
// const pointMaterial = new THREE.PointsMaterial({
//     color: '#00FF00',
//     size: 0.2,
//     transparent: true,
//     opacity: 0.8,
//     blending: THREE.AdditiveBlending,
//     map: pointTexture,
//     alphaMap: pointTexture,
//     depthWrite: false
// });

// // Créer l'objet Points pour les particules
// const torus = new THREE.Points(torusGeometry, pointMaterial);


// //scene.add(torus);

// torus.rotation.y = Math.PI / 2;

// // Variables pour l'animation
// let time = 0;
// const reductionSpeed = 0.01; // Vitesse de réduction du rayon

// // Fonction pour animer les particules
// function animateParticles() {
//     const positionsArray = torus.geometry.attributes.position.array;

//     for (let i = 0; i < numParticles; i++) {
//         // Calculer l'angle de chaque particule
//         const angle = angles[i];
//         const tubeAngle = (i % particlesPerRing) / particlesPerRing * Math.PI * 2;

//         // Calculer les positions de base
//         const x = (torusRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle);
//         const y = (torusRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle);
//         const z = tubeRadius * Math.sin(tubeAngle);

//         // Calculer l'ondulation dynamique
//         const waveAmplitude = 0.5;
//         const waveFrequency = 2;

//         // Déformation dynamique
//         const waveOffsetX = waveAmplitude * Math.sin(tubeAngle * waveFrequency + time);
//         const waveOffsetY = waveAmplitude * Math.cos(tubeAngle * waveFrequency + time);
//         const waveOffsetZ = waveAmplitude * Math.sin(tubeAngle * waveFrequency + time);

//         // Appliquer la déformation dynamique
//         positionsArray[i * 3] = x + waveOffsetX;
//         positionsArray[i * 3 + 1] = y + waveOffsetY;
//         positionsArray[i * 3 + 2] = z + waveOffsetZ;

//         // Réduire progressivement le rayon pour simuler l'aspiration vers le centre
//         const newRadius = torusRadius * (1 - reductionSpeed * time);
//         positionsArray[i * 3] *= newRadius / torusRadius; // Mouvement vers l'intérieur (X)
//         positionsArray[i * 3 + 1] *= newRadius / torusRadius; // Mouvement vers l'intérieur (Y)
//         positionsArray[i * 3 + 2] *= newRadius / torusRadius; // Mouvement vers l'intérieur (Z)
//     }

//     // Marquer la géométrie comme mise à jour
//     torus.geometry.attributes.position.needsUpdate = true;

//     // Incrémenter le temps pour l'animation
//     time += 0.01;
// }

// Boucle d'animation
// function animate() {
//     requestAnimationFrame(animate);

//     // Appliquer le mouvement des particules
//     animateParticles();

//     // Rendre la scène
//     renderer.render(scene, camera);
// }

// // Initialisation de la boucle d'animation
// animate();




///////////////////////////////////////BACK >
const torusBack = new THREE.Mesh(torusBackGeometry, torusBackMaterial);
//scene.add(torusBack)
torusBack.position.set(0, 0, 0);
torusBack.rotation.y = Math.PI / 2;
///////////////////////////////////////BACK <




// /**
//  * Lights
//  */
// const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.camera.left = - 7
// directionalLight.shadow.camera.top = 7
// directionalLight.shadow.camera.right = 7
// directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(5, 5, 5)
// scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})




////////////////////////////////////////// CAMERA //////////////////////////////////////////
/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);

// 🔹 Placer la caméra en face de la ring (vue de dessus)

camera.position.set(2, 4, -3); // Déplacer sur l'axe Z pour voir le cercle de face

// 🔹 Orienter la caméra vers le centre


scene.add(camera);
document.addEventListener('keydown', (event) => {
    if (event.key === 'p') { // Appuyez sur la touche 'p'
        console.log("Position de la caméra :", camera.position);
    }
});

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



// Fonction d'animation
function animate() {
    requestAnimationFrame(animate);

    // animateParticles(); // Mise à jour des particules
    //  torus.rotation.y += 0.001; // Rotation subtile du tore
    // // torusBack.rotation.y += 0.001; // Rotation subtile du tore


    renderer.render(scene, camera);
}

// Lancer l'animation
animate();
/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime
    
    
//     camera.position.z = Math.sin(elapsedTime) * 0.3; // Mouvement léger gauche-droite
// camera.position.y = Math.cos(elapsedTime) * 0.3; // Mouvement léger haut-bas

ringGroup.rotation.z += 0.001; // Rotation du tube


    //ringParticles.rotation.z += 0.0005; 
    //ringGroup.rotation.z += 0.0005; // Faire tourner tout le groupe
//Faire tourner chaque ring indépendamment avec un décalage
ringGroup.children.forEach((ring, index) => {
    ring.rotation.y += 0.0001 * (index + 1); // Rotation progressive en fonction de l'index
    ring.rotation.z += 0.0001 * (index + 1); // Rotation progressive en fonction de l'index

});

   // camera.lookAt(scene.position)

    controls.update()

    
    world.step(1 / 60, deltaTime, 3)
    console.log("Camera Position:", camera.position);


   
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()





