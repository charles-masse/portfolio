
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(3, 3, 3);
scene.add(light);

const renderer = new THREE.WebGLRenderer({antialias: true,});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement)

const loadingManager = new THREE.LoadingManager();

const stats = new Stats();
document.body.appendChild(stats.dom);

// loadModels()
loadInstance()

function animate() {
    stats.update();
    renderer.render(scene, camera);
}

let originalMesh;
function loadModels() {

    const loader = new GLTFLoader();

    loader.load('IridescenceSuzanne.glb', (gltf) => {

        gltf.scene.traverse((child) => {
            if (child.isMesh) originalMesh = child;
        });
        
        for (let i = 0; i < 1000; i++) {
            const clone = originalMesh.clone(true);
            scene.add(clone);
        }
    });
}

function loadInstance() {

    let mesh;
    const loader = new GLTFLoader(loadingManager);
    loader.load('IridescenceSuzanne.glb', (gltf) => {

        gltf.scene.traverse((child) => {
            if (child.isMesh) mesh = child;
        });
        const instanced_mesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, 1000);
        scene.add(instanced_mesh)
    });

}
