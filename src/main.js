
import * as THREE from 'three';

import * as YUKA from 'yuka';
//Loaders
import City from './loaders/City.js';
import NavMesh from './loaders/NavMesh.js';
import {PictogramGeo, PictogramShader} from './loaders/Pictogram.js';

import {EntityManager} from './customs/Agents.js';
//Modules
import DayNight from './modules/DayNight.js';
import Pedestrians from './modules/Pedestrians.js';
//GUI
import CrowdSpawner from './gui/CrowdSpawner.js';
import AgentInfo from './gui/AgentInfo.js';
import Stats from './gui/stats.js';

async function main() {

    const time = new YUKA.Time();
    const canvas = document.querySelector('#canvas');
    //Loading Screen
    const loadingManager = new THREE.LoadingManager(
        () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', onTransitionEnd);
        },
        (itemUrl, itemsLoaded, itemsTotal) => {
            console.log(`Loading asset (${itemsLoaded}/${itemsTotal}).`);
        },
        (url) => {
            console.error('Error loading', url);
        }
    );
    //Loaders
    const city = await City(loadingManager);
    const pictogramGeo = await PictogramGeo(loadingManager);
    const pictogramShader = await PictogramShader(loadingManager);
    const navMesh = await NavMesh(loadingManager);
    //Modules
    const entityManager = new EntityManager(navMesh);
    const pedestrians = new Pedestrians(pictogramGeo, pictogramShader, entityManager, navMesh);
    const dayNight = new DayNight(canvas, city);
    //GUI
    const crowdSpawner = new CrowdSpawner(entityManager);
    const agentInfo = new AgentInfo(entityManager);
    const stats = new Stats();
    //Scene
    const scene = new THREE.Scene();

    scene.add(city); //3D scene

    scene.add(pedestrians.objects)
    scene.add(dayNight.objects);
    scene.add(agentInfo.objects);
    //Camera
    const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000); 
    camera.setFocalLength(14.872)
    camera.position.set(20, 30, 30);
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
    renderer.setAnimationLoop(animate);
    //Listeners
    window.addEventListener('resize', onWindowResize, false);
    
    canvas.addEventListener('pointerdown', (event) => {
        const click = getClick(event);
        if (click) agentInfo.selectAgent(click.point);
    });

    function animate() {

        const updated_time = time.update();

        entityManager.update(updated_time.getDelta());
        //Modules
        pedestrians.update(updated_time.getElapsed());
        dayNight.update(updated_time.getElapsed());
        //GUI
        agentInfo.update(updated_time.getElapsed());
        stats.update();

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

}

main();
