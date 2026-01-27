
import * as THREE from 'three';
import Stats from './customs/stats.js';

import * as YUKA from 'yuka';

import {GUI} from './customs/GUI.js';

import City from './loaders/City.js';
import NavMesh from './loaders/NavMesh.js';
import {PictogramGeo, PictogramShader} from './loaders/Pictogram.js';

import {EntityManager} from './customs/RVO2.js';

import AgentInfo from './modules/AgentInfo.js';
import DayNight from './modules/DayNight.js';
import CrowdSpawner from './modules/CrowdSpawner.js';
import TaskMaster from './modules/taskMaster.js';

async function main() {

    const time = new YUKA.Time();

    const canvas = document.querySelector('#canvas');
    //Load assets
    const loadingManager = new THREE.LoadingManager(
        () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', onTransitionEnd);
        },
        (itemUrl, itemsLoaded, itemsTotal) => {
            // console.log(`Loading "${itemUrl}" (${itemsLoaded}/${itemsTotal})`);
        },
        (url) => {
            console.error('Error loading', url);
        }
    );
    //Loading
    const city = await City(loadingManager);
    const pictogramGeo = await PictogramGeo(loadingManager);
    const pictogramShader = await PictogramShader(loadingManager);
    const navMesh = await NavMesh(loadingManager);

    const entityManager = new EntityManager();
    //Modules
    const crowdSpawner = new CrowdSpawner(pictogramGeo, pictogramShader, navMesh, entityManager);
    const taskMaster = new TaskMaster(navMesh, entityManager);
    const dayNight = new DayNight(canvas, city);
    const agentInfo = new AgentInfo(entityManager);
    //Scene
    const scene = new THREE.Scene();

    scene.add(city);    
    scene.add(crowdSpawner.objects)
    scene.add(taskMaster.objects)
    scene.add(dayNight.objects);
    scene.add(agentInfo.objects);
    //Cameraman
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
    //UI
    const performance = new GUI({title:'Performance'});
    performance.domElement.style.position = 'static';
    performance.domElement.id = 'stats';
    performance.addText('');
    document.getElementById('gui-container').appendChild(performance.domElement);

    const stats = new Stats();
    stats.dom.style.position = 'relative';
    document.getElementById('stats').querySelector('.undefined').replaceWith(stats.dom);

    function animate() {

        stats.update();

        const updated_time = time.update();

        entityManager.update(updated_time.getDelta());
        crowdSpawner.update(updated_time.getElapsed());
        dayNight.update(updated_time.getElapsed());
        agentInfo.update(updated_time.getElapsed());

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
