
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import * as YUKA from 'yuka';

import City from './loaders/City.js';
import NavMesh from './loaders/NavMesh.js';
import {PictogramGeo, PictogramShader} from './loaders/Pictogram.js';

import DayNight from './modules/DayNight.js';

import CrowdSpawner from './modules/CrowdSpawner.js';
import TaskMaster from './modules/taskMaster.js'


async function main() {

    const time = new YUKA.Time();

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const canvas = document.querySelector('#canvas');
    //Load assets
    const loadingManager = new THREE.LoadingManager(
        () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', onTransitionEnd);
        },
        (itemUrl, itemsLoaded, itemsTotal) => {
            console.log(`Loading "${itemUrl}" (${itemsLoaded}/${itemsTotal})`);
        },
        (url) => {
            console.error('Error loading', url);
        }
    );

    const city = await City(loadingManager);

    const pictogramGeo = await PictogramGeo(loadingManager);
    const pictogramShader = await PictogramShader(loadingManager);

    const navMesh = await NavMesh(loadingManager);
    //Crowd Spawner
    const entityManager = new YUKA.EntityManager();
    const crowdSpawner = new CrowdSpawner(pictogramGeo, pictogramShader, navMesh, entityManager);
    const taskMaster = new TaskMaster(navMesh, entityManager);
    //Day/Night Cycle
    const dayNight = new DayNight(canvas, city);
    //Scene
    const scene = new THREE.Scene();
    scene.add(city);
    scene.add(crowdSpawner.objects)
    scene.add(taskMaster.objects)
    scene.add(dayNight.objects);
    //Cameraman
    const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000); 
    camera.setFocalLength(14.872)
    camera.position.set(20, 30, 40);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', onWindowResize, false);
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

    function animate() {

        stats.update();

        const updated_time = time.update();

        entityManager.update(updated_time.getDelta());
        crowdSpawner.update(updated_time.getElapsed());
        dayNight.update(updated_time.getElapsed());

        renderer.render(scene, camera);

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

main()
