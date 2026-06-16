
import {expect, test} from 'vitest';

import * as YUKA from 'yuka';

import {NavMesh,} from '../extensions/navigation.js';
import EntityManager from '../extensions/EntityManager.js';

import Agent from '../modules/Pedestrians/Agent.js';
import {findBestNavMeshPoint,} from '../modules/Pedestrians';

const AGENT_NUMBER = 5000;
const AGENT_RADIUS = 0.35;

/**
 * Returns the closest distance between all agents in the entity manager. This is used to check if any agents are intersecting.
 * @param {Array} entities - The array of agents to check.
 * @returns {number} The closest distance between all agents.
 */
function getClosestDistance(entities) {

    const min_distances = [];

    for (const entity of entities) {

        const closest_neighbor = entity.neighbors[0];

        if (closest_neighbor) {
            const distance = new YUKA.Vector3().subVectors(entity.position, closest_neighbor.position).length();
            min_distances.push(distance);
        }

    }

    return Math.min(...min_distances);
}

const entityManager = new EntityManager();
//Create navmesh
const navMesh = new NavMesh();
const polygons = [
    new YUKA.Polygon().fromContour([new YUKA.Vector3(-50, 0, 50), new YUKA.Vector3(50, 0, 50), new YUKA.Vector3(-50, 0, -50)]),
    new YUKA.Polygon().fromContour([new YUKA.Vector3(50, 0, 50), new YUKA.Vector3(50, 0, -50), new YUKA.Vector3(-50, 0, -50)]),
];
navMesh.fromPolygons(polygons.flat());

entityManager.navMesh = navMesh;

test('Spawning non-intersecting agents', () => {

    for (let i = 0; i < AGENT_NUMBER; ++i) {

        const entity = new Agent(i);
        entity.active = true;
        const pos = findBestNavMeshPoint(navMesh, entityManager.entities);
        entity.position.copy(pos);

        entityManager.add(entity);

    }

    entityManager.update(0);

    const distance = getClosestDistance(entityManager.entities);
    console.log(`Closest agent : ${distance}`);
    expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);

});

test('Non-colliding agents during simulation', () => {


    const distances = [];

    for (let i = 0; i < 240; ++i) {
        entityManager.update(0.0415);
        distances.push(getClosestDistance(entityManager.entities));
    }
    const distance = Math.min(...distances);
    console.log(`Closest agent : ${distance}`);
    expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);

}, 40000);
