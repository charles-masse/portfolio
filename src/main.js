
import * as THREE from 'three';

import * as YUKA from 'yuka';
//Loaders
import City from './loaders/City.js';
import NavMesh from './loaders/NavMesh.js';
import {PictogramGeo, PictogramShader,} from './loaders/Pictogram.js';
//Modules
import DayNight from './modules/DayNight.js';
import MovieScreen from './modules/MovieScreen.js';
import Pedestrians from './modules/Pedestrians.js';
//GUI
import CrowdSpawner from './gui/CrowdSpawner.js';
import AgentInfo from './gui/AgentInfo.js';
import Stats from './gui/Stats.js';

const canvas = document.querySelector('#canvas');
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
//Loaders
const city = await City(loadingManager);
const pictogramGeo = await PictogramGeo(loadingManager);
const pictogramShader = await PictogramShader(loadingManager);
const navMesh = await NavMesh(loadingManager);
//Modules
const pedestrians = new Pedestrians(pictogramGeo, pictogramShader, navMesh);
const movieScreen = new MovieScreen();
const dayNight = new DayNight(canvas, city);
//GUI
const crowdSpawner = new CrowdSpawner(pedestrians.entityManager);
const agentInfo = new AgentInfo(pedestrians.entityManager);
const stats = new Stats();
//Scene
const scene = new THREE.Scene();

scene.add(city);
scene.add(movieScreen.objects);
scene.add(pedestrians.objects);
scene.add(dayNight.objects);
scene.add(agentInfo.objects);
//Camera
const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000); 
camera.setFocalLength(14.872)
camera.position.set(15, 7.5, 25);
camera.lookAt(0, 0, 0);
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
//Listeners
window.addEventListener('resize', onWindowResize, false);

canvas.addEventListener('pointerdown', (event) => {
    const click = getClick(event);
    if (click) agentInfo.selectAgent(click.point);
});
//Clock
const clock = new THREE.Clock();
const time = new YUKA.Time();

let accumulator = 0;
const step = 1000 / 24.;
//Animation loop
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
        agentInfo.update();
        stats.update();

        accumulator = accumulator % step; //Drop frames

    }

    renderer.render(scene, camera);

}

function getClick(event) {

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersection = raycaster.intersectObject(city.children[0], false)[0];

    return intersection;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onTransitionEnd(event) {
    event.target.remove();
}
