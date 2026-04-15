
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {createConvexRegionHelper,} from './NavMeshHelper.js';
import {createGraphHelper,} from './GraphHelper.js';
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 0);
camera.lookAt(0, 0, 0);

const poly1 = new YUKA.Polygon().fromContour([
    new YUKA.Vector3(0,0,2),
    new YUKA.Vector3(2,0,0),
    new YUKA.Vector3(0,0,0),
]);

const poly2 = new YUKA.Polygon().fromContour([
    new YUKA.Vector3(0,0,2),
    new YUKA.Vector3(2,0,2),
    new YUKA.Vector3(2,0,0),
]);

const navMesh = new YUKA.NavMesh();
navMesh.mergeConvexRegions = false;
navMesh.fromPolygons([poly1, poly2]);

console.log(navMesh);

scene.add(createConvexRegionHelper(navMesh));
scene.add(createGraphHelper(navMesh.graph, 0.1));
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
