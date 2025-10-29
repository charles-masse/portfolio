// THREE
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
// Custom modules
import {DayNight} from './modules/DayNightCycle.js';
import {FollowPath} from './modules/FollowPath.js';

// Scene
const scene = new THREE.Scene();
// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);
// Canvas
const canvas = document.querySelector('#c');
// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', onWindowResize, false);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setAnimationLoop(animate);
// Test geo
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    emissive: 0xff0000,
    emissiveIntensity: 1,
    emissiveMap: textureLoader.load('checker.jpg'),
    side: THREE.DoubleSide,
});

const objLoader = new OBJLoader();
objLoader.load('city.obj', (object) => {
    object.traverse((child) => {

        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }

    });

    scene.add(object);
});

const DayNightCycle = new DayNight(scene, canvas);
const Follow = new FollowPath(scene);

let frames = 0
let prevTime = performance.now();

function animate() {
    // FPS -- https://jsfiddle.net/z2c19qab/1/
    const time = performance.now();
    frames++;
    
    if ( time >= prevTime + 1000 ) {

        const fps = Math.round((frames * 1000) / (time - prevTime));

        console.log(`fps: ${fps}`);
      
        frames = 0;
        prevTime = time;

    }
    // Update modules
    DayNightCycle.update();
    Follow.update();
    // Render frame
    renderer.render(scene, camera);
}
//
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
//