
import * as YUKA from 'yuka';

class brakingBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force/*, delta*/) {

        this.brakingWeight = 0.5;

        const direction = new YUKA.Vector3();
        vehicle.getDirection(direction);

        let closestNeighbor = null;
        let distanceToClosestNeighbor = Infinity;
        for (const neighbor of vehicle.neighbors) {

            const toNeighbor = new YUKA.Vector3().subVectors(neighbor.position, vehicle.position);
            const facing = direction.clone().dot(toNeighbor.normalize());
            const distance_toNeighbor = toNeighbor.length();

            const neighbor_direction = new YUKA.Vector3();
            neighbor.getDirection(neighbor_direction);
            const neighbor_heading = direction.clone().dot(neighbor_direction);
            //Make sure the neighbor is in front and heading towards the same direction
            if (facing > 0 && neighbor_heading > 0 && distance_toNeighbor < distanceToClosestNeighbor) {

                distanceToClosestNeighbor = distance_toNeighbor;
                closestNeighbor = neighbor;

            }

        }

        if (closestNeighbor !== null) {
            //Apply a braking force proportional to the obstacles distance from the vehicle
            force.z = ((closestNeighbor.boundingRadius * 2) / distanceToClosestNeighbor) * -this.brakingWeight;
            //Finally, convert the steering vector from local to world space (just apply the rotation)
            force.applyRotation(vehicle.rotation);

        }

        return force;
    }

}

export {
    brakingBehavior,
};
