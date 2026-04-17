
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Path, NavMesh,} from './Navigation.js';

import {createConvexRegionHelper,} from './NavMeshHelper.js';
import {createGraphHelper,} from './GraphHelper.js';
//Scene + Cam
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 75, 0);
camera.lookAt(0, 0, 0);
//Navmesh import
const navMesh = new NavMesh();
navMesh.mergeConvexRegions = false;

const polygons = await loadPolygons();
navMesh.fromPolygons(polygons.flat());
console.log(navMesh);

const helper = createConvexRegionHelper(navMesh);
// helper.material.side = THREE.DoubleSide; //Normal debug

scene.add(helper);
scene.add(createGraphHelper(navMesh.graph));
//Pathfinding
const findPath = navMesh.findPath(new YUKA.Vector3(-0.2, 0.1, -3), new YUKA.Vector3(4, 0.1, 2));

const geometry = new THREE.BufferGeometry();
const material = new THREE.LineBasicMaterial({color: 0x00ff00});
const line = new THREE.Line(geometry, material);
line.geometry.setFromPoints(findPath);
scene.add(line);

const vehicleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
vehicleGeometry.translate(0, 0.1, 0);
const vehicleMaterial = new THREE.MeshNormalMaterial();

const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
vehicleMesh.matrixAutoUpdate = false;
scene.add(vehicleMesh);

const entityManager = new YUKA.EntityManager();

const vehicle = new YUKA.Vehicle();
vehicle.setRenderComponent(vehicleMesh, sync);

const path = new Path();
for (const point of findPath) {
    path.add(point);
}

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.2);
// vehicle.steering.add(followPathBehavior);

entityManager.add(vehicle);
//Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

const time = new YUKA.Time();

animate();

function animate() {
    requestAnimationFrame(animate);

    const delta = time.update().getDelta();
    entityManager.update(delta);
    console.log(path.done());

    renderer.render(scene, camera);
}

function sync( entity, renderComponent ) {
    renderComponent.matrix.copy( entity.worldMatrix );
}

async function loadPolygons(loadingManager=null) {

    const loader = new THREE.FileLoader();

    const polygons = await new Promise((resolve, reject) => {

        loader.load("data.json",(text) => {

            const data = JSON.parse(text);

            const result = [data.polygons.map(poly => new YUKA.Polygon().fromContour(poly.map(pt => new YUKA.Vector3(...pt))))];

            resolve(result);
        });

    });

    return polygons;
}
