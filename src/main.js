
import * as THREE from 'three';

import {loadOBJ,} from './utilities/loaders.js';
//Modules
import DayNight from './modules/DayNight.js';
import MovieScreen from './modules/MovieScreen.js';
import {Cars} from './modules/Cars/module.js';
import {Pedestrians} from './modules/Pedestrians/module.js';
import {Render} from './modules/Render/module.js';

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
const canvas = document.querySelector('#canvas');

const renderer = new THREE.WebGLRenderer({canvas,/* alpha: true,*/}); //Change to full DMP
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setFocalLength(24);
// camera.position.set(0, 14.188, 103.679);
// camera.lookAt(0, 0, 30); //TODO load from json
camera.position.set(0, 14.188, 60); //DELETE Stop sign debug
camera.lookAt(0, 0, 10); //DELETE Stop sign debug
//Modules
const cars = new Cars();
scene.add(cars.objects);

const pedestrians = new Pedestrians(camera, loadingManager);
scene.add(pedestrians.objects);

const movieScreen = new MovieScreen(pedestrians);
scene.add(movieScreen.objects);
//TODO Create its own module
const city = await loadOBJ('models/city.obj', loadingManager);
city.material = new THREE.MeshStandardMaterial({color: 0x808080});
city.castShadow = true;
city.receiveShadow = true;
scene.add(city);

const dayNight = new DayNight(canvas, city);
scene.add(dayNight.objects);

const stats = new Stats();

const render = new Render(renderer, scene, camera);
//Animation loop
const time = new THREE.Timer();
time.connect(document);

const step = 1000 / 24.;
const capped_time = new THREE.Timer();
capped_time.connect(document);

let accumulator = 0;

animate();

function animate() {

    requestAnimationFrame(animate);

    time.update();
    const delta = time.getDelta() * 1000;
    accumulator += delta;
    //Cap frames at 24
    if (accumulator >= step) {

        capped_time.update();
        //Update Modules and UIs
        cars.update(capped_time);
        pedestrians.update(capped_time);
        dayNight.update(capped_time);
        // agentInfo.update();
        stats.update();
        //Reset accumulator
        accumulator = accumulator % step;

    }

    render.update();

}
//Listeners TODO Put in their respective modules
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onTransitionEnd(event) {
    event.target.remove();
}

window.addEventListener('pointerdown', (/*event*/) => {

    const intersection = getIntersection();

    if (intersection) {
        movieScreen.update();
    }

});

function getIntersection() {

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersection = raycaster.intersectObjects(movieScreen.objects.children, true)[0];

    return intersection;
}
