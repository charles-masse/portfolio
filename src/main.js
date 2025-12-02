
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

    loader.load('models/suzanne.glb', (gltf) => {

        gltf.scene.traverse((child) => {
            if (child.isMesh) originalMesh = child;
        });
        
        const whiteMaterial = new THREE.MeshStandardMaterial({color: 0xffffff});

        for (let i = 0; i < 10000; i++) {
            const clone = originalMesh.clone(true);
            clone.material = whiteMaterial.clone();
            scene.add(clone);
        }
    });
}

function loadInstance() {

    let mesh;
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/suzanne.glb', (gltf) => {

        gltf.scene.traverse((child) => {
            if (child.isMesh) mesh = child;
        });

        const whiteMaterial = new THREE.MeshStandardMaterial({color: 0xffffff});
        const instanced_mesh = new THREE.InstancedMesh(mesh.geometry, whiteMaterial, 10000);

        scene.add(instanced_mesh)
    });

}
