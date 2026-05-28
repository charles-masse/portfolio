
import * as THREE from 'three';

import * as YUKA from 'yuka';

const direction = new YUKA.Vector3();
const neighbor_direction = new YUKA.Vector3();
const toNeighbor = new YUKA.Vector3();

class brakingBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force/*, delta*/) {

        vehicle.getDirection(direction);

        let closestNeighbor = null;
        let distanceToClosestNeighbor = Infinity;
        for (const neighbor of vehicle.neighbors) {

            toNeighbor.subVectors(neighbor.position, vehicle.position);

            const distance_toNeighbor = toNeighbor.length();

            const facing = direction.dot(toNeighbor.normalize());

            neighbor.getDirection(neighbor_direction);
            const neighbor_heading = direction.dot(neighbor_direction.normalize());
            //Make sure the neighbor is in front and heading towards the same direction
            if (facing >= 0.85 && neighbor_heading > 0. && distance_toNeighbor < distanceToClosestNeighbor) {

                distanceToClosestNeighbor = distance_toNeighbor;
                closestNeighbor = neighbor;

            }

        }
        //Apply a braking force proportional to the obstacles distance from the vehicle
        if (closestNeighbor !== null) {
            force.z = THREE.MathUtils.clamp((vehicle.boundingRadius + closestNeighbor.boundingRadius) / distanceToClosestNeighbor, 0, 1) * -vehicle.maxSpeed;
        }
        //Finally, convert the steering vector from local to world space (just apply the rotation)
        force.applyRotation(vehicle.rotation);

        return force;
    }

}

export {
    brakingBehavior,
};
