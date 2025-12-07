
import * as THREE from 'three';
//Custom modules
import {City} from './modules/City.js';
import {DayNight} from './modules/DayNight.js';
import {CrowdManager} from './modules/CrowdManager.js';

import Stats from 'three/addons/libs/stats.module.js';
//Scene
const scene = new THREE.Scene();
//Camera
const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setFocalLength(14.872)
camera.position.set(22.436, 30.551, 67.458);
camera.lookAt(0, 0, 0);
//Canvas
const canvas = document.querySelector('#canvas');
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
window.addEventListener('resize', onWindowResize, false);
//Loading -- https://jsfiddle.net/gex9km1j
const loadingManager = new THREE.LoadingManager(() => {
    
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    loadingScreen.addEventListener('transitionend', onTransitionEnd);
    
} );

const city = new City(scene, loadingManager);
const crowdManager = new CrowdManager(scene, loadingManager);

const dayNight = new DayNight(scene, canvas, city);

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
    //Update modules
    dayNight.update();
    crowdManager.update();

    stats.update();

    renderer.render(scene, camera);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onTransitionEnd(event) {

    const element = event.target;
    element.remove();
    
}
