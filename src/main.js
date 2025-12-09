
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import * as YUKA from 'yuka';

import City from './loaders/City.js';
import NavMesh from './loaders/NavMesh.js';

import DayNight from './modules/DayNight.js';
import CrowdSpawner from './modules/CrowdSpawner.js';
//Loading -- https://jsfiddle.net/gex9km1j
async function main() {

    const loadingManager = new THREE.LoadingManager(() => {
        
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', onTransitionEnd);
        
    } );

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const canvas = document.querySelector('#canvas');
    //Scene
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.setFocalLength(14.872)
    camera.position.set(22.436, 30.551, 67.458);
    camera.lookAt(0, 0, 0);
    //Loading assets
    const city = await City(loadingManager);
    scene.add(city);

    const navMesh = new NavMesh(loadingManager);
    await navMesh.load();
    scene.add(navMesh.helper);
    //Modules
    const dayNight = new DayNight(canvas, city);
    scene.add(dayNight.objects);

    const entityManager = new YUKA.EntityManager();

    const crowdSpawner = new CrowdSpawner(navMesh, entityManager);
    scene.add(crowdSpawner.objects)
    //Render
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

    const time = new YUKA.Time();

    function animate() {

        stats.update();

        const updated_time = time.update();

        entityManager.update(updated_time.getDelta());

        dayNight.update(updated_time.getElapsed());
        crowdSpawner.update(updated_time.getElapsed());

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

    // const pathMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
    // const pathHelper = new THREE.Line(new THREE.BufferGeometry(), pathMaterial);
    // scene.add(pathHelper);
}

main()
