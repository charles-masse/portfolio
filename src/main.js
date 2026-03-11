
import * as THREE from 'three';

import * as YUKA from 'yuka';
//Loaders
import City from './loaders/City.js';
//Modules
import DayNight from './modules/DayNight.js';
import MovieScreen from './modules/MovieScreen.js';
import Pedestrians from './modules/Pedestrians.js';
import Render from './modules/Render.js';
//GUI
import CrowdSpawner from './gui/CrowdSpawner.js';
// import AgentInfo from './gui/AgentInfo.js';
import Stats from './gui/Stats.js';
//Loading Screen
const loadingManager = new THREE.LoadingManager(

    () => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
    },

    (itemUrl, itemsLoaded, itemsTotal) => {
        console.log(`Loading '${itemUrl}' (${itemsLoaded}/${itemsTotal})`);
    },

    (url) => {
        console.error(`Error loading '${url}'`);
    }

);
//Renderer
const canvas = document.querySelector('#canvas');

const renderer = new THREE.WebGLRenderer({canvas, alpha: true,}); //Change to full DMP
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000); 
camera.setFocalLength(14.872)
camera.position.set(15, 7.5, 25);
camera.lookAt(0, 0, 0);
//Modules
const pedestrians = await new Pedestrians(loadingManager).init();
scene.add(pedestrians.objects);

const movieScreen = new MovieScreen();
scene.add(movieScreen.objects);

const city = await City(loadingManager); //TODO Combine with module
scene.add(city);
const dayNight = new DayNight(canvas, city);
scene.add(dayNight.objects);

const render = new Render(renderer, scene, camera);
//GUI
const crowdSpawner = new CrowdSpawner(pedestrians.entityManager);
// const agentInfo = new AgentInfo(pedestrians.entityManager, camera);
const stats = new Stats();
// scene.add(agentInfo.objects);
//Animation loop
const clock = new THREE.Clock();
const time = new YUKA.Time();

let accumulator = 0;
const step = 1000 / 24.;

animate();

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta() * 1000;
    accumulator += delta;
    //Cap frames at 24
    if (accumulator >= step) {

        const updated_time = time.update();
        //Modules
        pedestrians.update(updated_time);
        dayNight.update(updated_time);
        //GUI
        // agentInfo.update();
        stats.update();
        //Drop frames
        accumulator = accumulator % step;

    }

    render.update();

}
//Listeners
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onTransitionEnd(event) {
    event.target.remove();
}
