
import * as THREE from 'three';
//Modules
import {Cars} from './modules/Cars';
import {Pedestrians} from './modules/Pedestrians';
import {City} from './modules/City';

import Bridge from './modules/Bridge.js';

import {Render} from './modules/Render';

import {loadJSON,} from './utilities/loaders.js';

import Stats from './extensions/Stats.js';
//UI
const stats = new Stats();
//Loading
const loadingManager = new THREE.LoadingManager(

    () => {},

    (itemUrl) => {
        console.log(`Loading '${itemUrl}'`);
    },

    (url) => {
        console.error(`Error loading '${url}'`);
    }

);

const stage_data = await loadJSON('stage.json', loadingManager);
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(stage_data.camera.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.matrix = new THREE.Matrix4().fromArray(stage_data.camera.matrix);
camera.matrix.decompose(
    camera.position,
    camera.quaternion,
    camera.scale
);
camera.updateMatrix();

const renderer = new THREE.WebGLRenderer({
    canvas : document.querySelector('#canvas'),
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
//Modules
const city = new City(scene, loadingManager);
scene.add(city.objects);

const cars = new Cars(stage_data, loadingManager);
scene.add(cars.objects);

const pedestrians = new Pedestrians(stage_data, camera, loadingManager);
scene.add(pedestrians.objects);

const bridge = new Bridge(camera);
bridge.add('City', city);
bridge.add('Cars', cars);
bridge.add('Pedestrians', pedestrians);

const render = new Render(renderer, scene, camera, pedestrians);
//Listeners
initListeners();
//Animation loop
const time = new THREE.Timer();
time.connect(document);

const step = 1000 / 24.;
const capped_time = new THREE.Timer();
capped_time.connect(document);

let accumulator = 0;

animate();

/**
 * The main animation loop for the application. Framerate is capped at 24 FPS.
 */
function animate() {
    //Looping
    requestAnimationFrame(animate);

    time.update();
    accumulator += time.getDelta() * 1000;
    //Cap at 24 frames
    if (accumulator >= step) {

        stats.update();
    
        capped_time.update();
        const delta = capped_time.getDelta();

        bridge.update(delta);

        render.update();
        //Reset accumulator
        accumulator = accumulator % step;

    }

}
/**
 * Initializes listeners.
 */
function initListeners() {

    window.addEventListener('resize', () => {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    });

}
