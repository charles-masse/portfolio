
import * as THREE from 'three';

import * as YUKA from 'yuka';

const SPACING = 4;

const direction = new YUKA.Vector3();
const neighbor_direction = new YUKA.Vector3();
const toNeighbor = new YUKA.Vector3();

class BrakingBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force/*, delta*/) {

        this.test = null;

        vehicle.getDirection(direction);

        let closestNeighbor = null;
        let distanceToClosestNeighbor = Infinity;

        for (const neighbor of vehicle.neighbors) {

            toNeighbor.subVectors(neighbor.position, vehicle.position);

            const distance_toNeighbor = toNeighbor.length();

            const facing = direction.clone().dot(toNeighbor.clone().normalize());

            neighbor.getDirection(neighbor_direction);
            const neighbor_heading = direction.dot(neighbor_direction);
            //Make sure the neighbor is in front and heading towards the same direction
            if (facing >= 0.95 && neighbor_heading > 0.5 && distance_toNeighbor < distanceToClosestNeighbor) {
                distanceToClosestNeighbor = distance_toNeighbor;
                closestNeighbor = neighbor;

            }

        }
        
        if (closestNeighbor) {
            this.test = closestNeighbor;
            //Apply a braking force proportional to the obstacles distance from the vehicle
            const spacing = vehicle.boundingRadius + closestNeighbor.boundingRadius + SPACING;

            const dist_factor = THREE.MathUtils.inverseLerp(vehicle.neighborhoodRadius, spacing, distanceToClosestNeighbor);

            // const moving_entity = closestNeighbor instanceof YUKA.MovingEntity;
            //Still go during yellow light
            // if (moving_entity || (!moving_entity && dist_factor < spacing)) {
            force.z = THREE.MathUtils.clamp(dist_factor, 0, 1) * -vehicle.maxSpeed;
            // }
            //Finally, convert the steering vector from local to world space (just apply the rotation)
            force.applyRotation(vehicle.rotation);

        }

        return force;
    }

}

export {
    BrakingBehavior,
};
