
import * as THREE from 'three';
//Modules
import {Cars} from './modules/Cars';
import {Pedestrians} from './modules/Pedestrians';
import {City} from './modules/City';

import {Traffic} from './modules/Traffic';

import {Render} from './modules/Render';

import {loadJSON,} from './utilities/loaders.js';

import Stats from './extensions/Stats.js';
//Loading Screen
const loadingManager = new THREE.LoadingManager(

    () => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    },

    (itemUrl) => {
        console.log(`Loading '${itemUrl}'`);
    },

    (url) => {
        console.error(`Error loading '${url}'`);
    }

);
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas : document.querySelector('#canvas'),
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
//Stage data loader
const stage_data = await loadJSON('stage.json', loadingManager);
//Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setFocalLength(24);
// camera.position.set(0, 14.188, 103.679);
// camera.lookAt(0, 0, 30); //TODO load from json
camera.position.set(0, 14.188, 60); //DELETE Stop sign debug
camera.lookAt(0, 0, 10); //DELETE Stop sign debug
//Modules
const cars = new Cars(stage_data, loadingManager);
scene.add(cars.objects);

const pedestrians = new Pedestrians(stage_data, camera, loadingManager);
scene.add(pedestrians.objects);

const city = new City(loadingManager);
scene.add(city.objects);

const traffic = new Traffic(cars.manager, pedestrians.manager);

const stats = new Stats();
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
        //Update Modules
        cars.update(delta);
        pedestrians.update(delta);
        traffic.update(delta);

        render.update();
        //Reset accumulator
        accumulator = accumulator % step;

    }

}

function onTransitionEnd(event) {
    event.target.remove();
}
//Listeners
function initListeners() {

    window.addEventListener('resize', () => {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    });

    window.addEventListener('pointerdown', () => {

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // const intersection = raycaster.intersectObjects(movieScreen.objects.children, true)[0];

        if (intersection) {
            // movieScreen.interact();
        }

    });

}
