
import * as YUKA from 'yuka';

/**
 * Find a point on the navmesh that is as far as possible from the other entities.
 * @param {YUKA.NavMesh} navMesh - The navmesh to find the point on.
 * @param {YUKA.GameEntity[]} entities - The entities to find the point far from.
 * @returns {YUKA.Vector3} The best point found.
 */
function findBestNavMeshPoint(navMesh, entities) {

    let best;
    let maxDist = -Infinity;

    for (let i = 0; i < 10; i++) {

        const pos = navMesh.randomPoint();
        const minDist = Math.min(...entities.map((entity) => pos.distanceTo(entity.position)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

export {
    findBestNavMeshPoint,
};
