
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
//Custom modules
import {DayNight} from './modules/DayNight.js';
import {CrowdSpawner} from './modules/CrowdSpawner.js';
//Scene
const scene = new THREE.Scene();
//Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);
//Canvas
const canvas = document.querySelector('#canvas');
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.gammaOutput = true;
window.addEventListener('resize', onWindowResize, false);
renderer.setAnimationLoop(animate);
//Test city
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    emissive: 0xffffff,
    emissiveIntensity: 1,
    emissiveMap: textureLoader.load('textures/cityEmission.jpg'),
    side: THREE.DoubleSide,
});

const objLoader = new OBJLoader();
objLoader.load('models/city.obj', (object) => {
    object.traverse((child) => {

        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }

    });

    scene.add(object);
});

const dayNight = new DayNight(scene, canvas);
const crowdSpawner = new CrowdSpawner(scene);

let frames = 0;
let prevTime = performance.now();

function animate() {
    //FPS -- https://jsfiddle.net/z2c19qab/1/
    const time = performance.now();
    frames++;

    if (time >= prevTime + 1000) {
        document.getElementById('fps').textContent = `FPS: ${Math.round((frames * 1000) / (time - prevTime))}`;
      
        frames = 0;
        prevTime = time;

    }
    //Update modules
    dayNight.update();
    crowdSpawner.update();

    renderer.render(scene, camera);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);

}
