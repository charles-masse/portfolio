
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {createConvexRegionHelper,} from './NavMeshHelper.js';
import {createGraphHelper,} from './GraphHelper.js';

async function loadNavMesh(path, loadingManager=null) {

    const navMesh = new Promise((resolve) => {
        
        new YUKA.NavMeshLoader(loadingManager).then((gltf) => {
            resolve(gltf);
        });

    });

    return navMesh;
}
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

// const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
// const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// const navMesh = new YUKA.NavMesh().fromPolygons([
//     new YUKA.Polygon().fromContour([new YUKA.Vector3(1, 0, 1), new YUKA.Vector3(-1, 0, 1), new YUKA.Vector3(0, 0, -1)])
// ]);

const navMesh = new YUKA.NavMeshLoader().load('navmesh.glb', {'mergeConvexRegions': false}).then((navMesh) => {
    console.log(navMesh);
    scene.add(createConvexRegionHelper(navMesh));
    scene.add(createGraphHelper(navMesh.graph, 0.25));
});

//Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

animate();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
