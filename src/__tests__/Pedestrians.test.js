
import {expect, test} from 'vitest';

import * as THREE from 'three';

import * as YUKA from 'yuka';

import {NavMesh,} from '../extensions/navigation.js';
import EntityManager from '../extensions/EntityManager.js';

import {getClosestDistance} from './utilities.js';

import Agent from '../modules/Pedestrians/Agent.js';
import {findBestNavMeshPoint,} from '../modules/Pedestrians/utilities.js';

const delta_time = 1 / 24.;

const AGENT_NUMBER = 5000;
const AGENT_RADIUS = new Agent().boundingRadius;
//Create Manager
const entityManager = new EntityManager();
//Create navmesh
const navMesh = new NavMesh();
const polygons = [
    new YUKA.Polygon().fromContour([new YUKA.Vector3(-50, 0, 50), new YUKA.Vector3(50, 0, 50), new YUKA.Vector3(-50, 0, -50)]),
    new YUKA.Polygon().fromContour([new YUKA.Vector3(50, 0, 50), new YUKA.Vector3(50, 0, -50), new YUKA.Vector3(-50, 0, -50)]),
];
navMesh.fromPolygons(polygons.flat());

test('Spawning non-intersecting agents', () => {

        for (let i = 0; i < AGENT_NUMBER; ++i) {

            const entity = new Agent(i);
            entity.active = true;
            entity.position.copy(findBestNavMeshPoint(navMesh, entityManager.entities));
            entity.stateMachine.changeTo('Walk');

            entityManager.addAgent(entity);

        }
        //Update for neighbors
        entityManager.update(0);
        //Check distance between agents
        const distance = getClosestDistance(entityManager.entities);
        console.log(`Closest agent : ${distance}`);

        expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);
    }

);
//Create obstacles
entityManager.addObstacle([
    new THREE.Vector2(-50, 50),
    new THREE.Vector2(50, 50),
    new THREE.Vector2(50, 51),
    new THREE.Vector2(-50, 51),
]);

entityManager.addObstacle([
    new THREE.Vector2(50, 50),
    new THREE.Vector2(50, -50),
    new THREE.Vector2(51, -50),
    new THREE.Vector2(51, 50),
]);

entityManager.addObstacle([
    new THREE.Vector2(50, -50),
    new THREE.Vector2(-50, -50),
    new THREE.Vector2(-50, -51),
    new THREE.Vector2(50, -51),
]);

entityManager.addObstacle([
    new THREE.Vector2(-50, -50),
    new THREE.Vector2(-50, 50),
    new THREE.Vector2(-51, 50),
    new THREE.Vector2(-51, -50),
]);

entityManager.buildObstacleTree();
//Adding behaviors
for (let i = 0; i < entityManager.length; ++i) {

    const entity = entityManager.entities[i];
    
    const separation = new YUKA.SeparationBehavior();
    entity.steering.add(separation);

    const cohesion = new YUKA.CohesionBehavior();
    entity.steering.add(cohesion);

}

test('Non-colliding agents during simulation', () => {

        const distances = [];
        //Run sim
        for (let i = 0; i < 240; ++i) {
            entityManager.update(delta_time);
            distances.push(getClosestDistance(entityManager.entities));
        }

        const distance = Math.min(...distances);
        console.log(`Closest agent : ${distance}`);

        expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);
    },
    40000
);
