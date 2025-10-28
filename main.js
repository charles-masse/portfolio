
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
// Scene
const scene = new THREE.Scene();
// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1;
camera.position.z = 5;
// Renderer
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);
// // Test geo
const material = new THREE.MeshStandardMaterial({color: 0x808080});

const objLoader = new OBJLoader();
objLoader.load('city.obj', (object) => {
    object.traverse((child) => {
        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(object);
});
// Sun
const sun = new THREE.DirectionalLight(0xffffff, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
scene.add(sun);
// Sun helper
const helper = new THREE.DirectionalLightHelper(sun, 1);
scene.add(helper);
// Ambient
const ambient = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambient);
// Clock
const clock = new THREE.Clock();

function animate() {

    const time = clock.getElapsedTime();
    // Day/night cycle 
    sun.position.copy(orbit(time));
    //console.log(time);
    if (time % 25.5 > 13) {
        updateSky(canvas, ambient, 'MidnightBlue');
    } else {
        updateSky(canvas, ambient, 'DeepSkyBlue');
    }
    // Render frame
    helper.update();
    renderer.render(scene, camera);

}

function orbit(time){

    const omega = -0.25;
    const radius = 5;
    const theta = omega * time;

    const inclination = 2;
    const azimuth = 0;

    const pos = new THREE.Vector3(
        radius * Math.cos(theta),
        0,
        radius * Math.sin(theta)

    );

    pos.applyAxisAngle(new THREE.Vector3(1,0,0), inclination);
    pos.applyAxisAngle(new THREE.Vector3(0,1,0), azimuth);

    return pos

}

function updateSky(canva, ambient, color) {
    canva.style.background = `linear-gradient(to bottom, ${color}, #ffffff)`;
    ambient.color.set(color);
}
