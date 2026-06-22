
import * as YUKA from 'yuka';

/**
 * Returns the closest distance between all agents in the entity manager. This is used to check if any agents are intersecting.
 * @param {Array<YUKA.Vehicle>} entities - The array of agents to check.
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

export {
    getClosestDistance,
};