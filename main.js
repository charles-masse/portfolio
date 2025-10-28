// Three
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
// custom
import {DayNight} from './DayNightCycle.js';

// Scene
const scene = new THREE.Scene();
// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);
// Renderer
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);
// Test geo
const material = new THREE.MeshStandardMaterial({color: 0x808080});

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
// Sun
const sun = new THREE.DirectionalLight(0xffffff, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);
// Sun helper
const helper = new THREE.DirectionalLightHelper(sun, 1);
scene.add(helper);
// Ambient
const ambient = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambient);
// Time
const clock = new THREE.Clock();
const DayNightCycle = new DayNight();

function animate() {

    const time = clock.getElapsedTime();
    // console.log(time);
    // DayNight cycle
    const {sunPos, ambientColor} = DayNightCycle.update(time);
    sun.position.copy(sunPos);
    canvas.style.background = `linear-gradient(to bottom, ${ambientColor}, #ffffff)`;
    ambient.color.set(ambientColor);
    // Render frame
    helper.update();
    renderer.render(scene, camera);

}
