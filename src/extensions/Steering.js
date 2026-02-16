
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {degreesToRadians,} from '../utilities/math.js';

import {FEELER_ANGLE,} from '../settings.js';

class LineSegment extends YUKA.LineSegment {
    //line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    intercept2D(line) {

        const denominator = ((line.to.z - line.from.z) * (this.to.x - this.from.x) - (line.to.x - line.from.x) * (this.to.z - this.from.z));
        if (denominator === 0) return false; //Lines are parallel

        const ua = ((line.to.x - line.from.x) * (this.from.z - line.from.z) - (line.to.z - line.from.z) * (this.from.x - line.from.x)) / denominator;
        const ub = ((this.to.x - this.from.x) * (this.from.z - line.from.z) - (this.to.z - this.from.z) * (this.from.x - line.from.x)) / denominator;
        //Is the intersection along the segments?
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false; 

        const x = this.from.x + ua * (this.to.x - this.from.x);
        const z = this.from.z + ua * (this.to.z - this.from.z);

        return new THREE.Vector3(x, 0, z);
    }

}

const RADIANS_ANGLE = degreesToRadians(FEELER_ANGLE);
const LEFT_QUAT = new YUKA.Quaternion().fromEuler(0, RADIANS_ANGLE, 0);
const RIGHT_QUAT = new YUKA.Quaternion().fromEuler(0, -RADIANS_ANGLE, 0);

class WallAvoidanceBehavior extends YUKA.SteeringBehavior {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh;

    }

    createFeelers(vehicle) {

        const feelers = [];

        const direction = vehicle.getDirection(new YUKA.Vector3());

        const position = vehicle.position;
        const feeler_length = vehicle.maxSpeed;
        //Feeler pointing straight in front
        let temp = direction.clone();
        let feeler_end = position.clone().add(temp.multiplyScalar(feeler_length));
        feelers.push(
            new LineSegment(position, feeler_end)
        );
        //Feeler to left
        temp = direction.clone()
            .applyRotation(LEFT_QUAT);
        feeler_end = position.clone().add(temp.multiplyScalar(feeler_length * 2.0));

        feelers.push(
            new LineSegment(position, feeler_end)
        );
        //Feeler to right
        temp = direction.clone()
            .applyRotation(RIGHT_QUAT);
        feeler_end = position.clone().add(temp.multiplyScalar(feeler_length /* * 2.0 */));

        feelers.push(
            new LineSegment(position, feeler_end)
        );

        return feelers
    }

    calculate(vehicle, force) {

        const feelers = this.createFeelers(vehicle);

        this.hit = null;

        let dist_to_closest_pt = Infinity;
        let closest_point = null;
        let closest_wall = null;
        let hit_feeler = null;

        const walls = this.navMesh.perimeter;

        for (const feeler of feelers) {
            for (const wall of walls) {

                const hit = feeler.intercept2D(wall);
                if (hit) {

                    this.hit = hit;
                    const dist = hit.clone().sub(vehicle.position).length();
                    if (dist < dist_to_closest_pt) {

                        dist_to_closest_pt = dist;
                        closest_point = hit;
                        closest_wall = wall;
                        hit_feeler = feeler;

                    }

                }
                
            }
            
        }

        if (closest_wall) {
            //Calculate by what distance the projected position of the agent will overshoot the wall
            const overshoot = hit_feeler.to.clone().sub(closest_point).length();
            this.overshoot = overshoot;

            const steering_force = closest_wall.normal.clone().multiplyScalar(overshoot);

            force.add(steering_force);
            this.force = steering_force;

        }

        return force;
    }

}

class NonPenetrationBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force) {
        //Iterate over all neighbors checking for any overlap of bounding radii
        const neighbors = vehicle.neighbors;
        for (const neighbor of neighbors) {
            //Calculate the distance between the positions of the entities
            const toAgent = new YUKA.Vector3()
                .subVectors(vehicle.position, neighbor.position);
            const length = toAgent.length();
            //If this distance is smaller than the sum of their radii then this entity must be moved
            //away in the direction parallel to the toAgent vector
            const amount_of_overlap = vehicle.boundingRadius + neighbor.boundingRadius - length;

            if (amount_of_overlap >= 0) {

                const away = toAgent.clone()
                    .divideScalar(length)
                    .multiplyScalar(amount_of_overlap);

                force.add(away);

            }
        }

        return force;
    }

}

export {
    WallAvoidanceBehavior,
};
