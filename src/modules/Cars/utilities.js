
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {directionMatrixFromVector,} from '../../utilities/math.js';

const CAR_SIZE = new YUKA.Vector3(1, 1, 2).multiplyScalar(1.25);

/**
 * Checks if candidate position/direction is in conflict with other agents.
 * @param {YUKA.Vector3} pos - The 3d position of the candidate.
 * @param {YUKA.Vector3} direction - The direction vector of the candidate.
 * @param {Array.YUKA.Vehicle} entities - The other entities that will be tested.
 * @param {YUKA.Vector3} size - A vector representing width, height, depth of the bounding box.
 * @returns {boolean} If an intersection was found.
 */
function checkIntersection(pos, direction, entities, size=CAR_SIZE) {

    const candidate_BB = new YUKA.OBB(
        pos,
        size,
        directionMatrixFromVector(direction)
    );

    for (const entity of entities) {
        //Compare bounding boxes with the candidate's bounding box
        const entity_BB = new YUKA.OBB(
            entity.position,
            size,
            new YUKA.Matrix3().fromQuaternion(entity.rotation)
        );
        //If intersection is found
        if (candidate_BB.intersectsOBB(entity_BB)) return true;

    }

    return false;
}

/**
 * Finds a random point on the path and the index of the next waypoint.
 * @param {Array<YUKA.Vector3>} waypoints - The waypoints the paths are made of.
 * @returns {[number, YUKA.Vector3]} A random point on the path and the index of the next waypoint.
 */
function randomOnPath(waypoints) {

    const random_index = YUKA.MathUtils.randInt(1, waypoints.length - 1);

    const rng = Math.random();
    
    const result = new THREE.Vector3(
        THREE.MathUtils.lerp(waypoints[random_index - 1].x, waypoints[random_index].x, rng),
        THREE.MathUtils.lerp(waypoints[random_index - 1].y, waypoints[random_index].y, rng),
        THREE.MathUtils.lerp(waypoints[random_index - 1].z, waypoints[random_index].z, rng),
    );

    return [random_index, result];
}

export {
    checkIntersection,
    randomOnPath,
};
