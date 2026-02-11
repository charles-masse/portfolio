
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {FuzzyVariable, FuzzyModule, LeftShoulderFuzzySet, TriangularFuzzySet, RightShoulderFuzzySet,} from '../extensions/Fuzzy.js';
import {degreesToRadians,} from '../utilities/vectors.js';

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

// class FuzzySeparationBehavior extends YUKA.SeparationBehavior {

//     constructor() {
//         super();

//         this.initFuzzy();

//     }

//     initFuzzy() {

//         this.fuzzy = new FuzzyModule();
//         //Inputs
//         const center = new TriangularFuzzySet(-90, 0, 90);
//         const left = new LeftShoulderFuzzySet(-180, -135, -45, {r:0, g:255, b:0});
//         const right = new RightShoulderFuzzySet(45, 135, 180, {r:0, g:255, b:0});
//         const direction = new FuzzyVariable()
//             .add(center)
//             .add(left)
//             .add(right)
//         this.fuzzy.addFLV('direction', direction);

//         const close = new LeftShoulderFuzzySet(0, 0, 3, {r:0, g:255, b:0});
//         const far = new RightShoulderFuzzySet(0, 3, 3);

//         const distance = new FuzzyVariable()
//             .add(close)
//             .add(far);
//         this.fuzzy.addFLV('distance', distance);
//         //Outputs
//         const weak = new LeftShoulderFuzzySet(0, 0, 1);
//         const strong = new RightShoulderFuzzySet(0, 1, 1, {r:0, g:255, b:0});
        
//         const weight = new FuzzyVariable()
//             .add(weak)
//             .add(strong);
//         this.fuzzy.addFLV('weight', weight);
//         //Rules
//         this.fuzzy.addRule(new YUKA.FuzzyRule(new YUKA.FuzzyAND(new YUKA.FuzzyOR(left, right), close), strong));
//         this.fuzzy.addRule(new YUKA.FuzzyRule(new YUKA.FuzzyAND(center, far), weak));

//     }

//     calculate(vehicle, force) {

//         this.fuzzy.clearIO();

//         const direction = vehicle.getDirection(new YUKA.Vector3());

//         const neighbors = vehicle.neighbors;
//         for (const neighbor of neighbors) {

//             const toAgent = new YUKA.Vector3()
//                 .subVectors(vehicle.position, neighbor.position);

//             const angle = angleTo(direction, toAgent);
//             const length = toAgent.length();
//             //IN
//             this.fuzzy.fuzzify('direction', angle);
//             this.fuzzy.fuzzify('distance', length);
//             //OUT
//             const factor = this.fuzzy.defuzzify('weight');
//             toAgent.normalize().multiplyScalar(factor);

//             force.add(toAgent);

//         }

//         return force;
//     }

// }

// class FuzzyCohesionBehavior extends YUKA.CohesionBehavior {

//     constructor() {
//         super();

//         this.initFuzzy();

//         this._seek = new YUKA.SeekBehavior();

//     }

//     initFuzzy() {

//         this.fuzzy = new FuzzyModule();
//         //Inputs
//         const facingCenter = new TriangularFuzzySet(-22, 0, 22, {r:0, g:255, b:0});
//         const facingLeft = new LeftShoulderFuzzySet(-180, -22, 0);
//         const facingRight = new RightShoulderFuzzySet(0, 22, 180);
//         const facingAngle = new FuzzyVariable()
//             .add(facingCenter)
//             .add(facingLeft)
//             .add(facingRight);
//         this.fuzzy.addFLV('facingAngle', facingAngle);

//         const center = new TriangularFuzzySet(-135, 0, 135, {r:0, g:255, b:0});
//         const left = new LeftShoulderFuzzySet(-180, -135, -90);
//         const right = new RightShoulderFuzzySet(90, 135, 180);
//         const direction = new FuzzyVariable()
//             .add(center)
//             .add(left)
//             .add(right);
//         this.fuzzy.addFLV('direction', direction);
//         //Outputs
//         const weak = new LeftShoulderFuzzySet(0, 0, 1);
//         const strong = new RightShoulderFuzzySet(0, 1, 1, {r:0, g:255, b:0});
        
//         const weight = new FuzzyVariable()
//             .add(weak)
//             .add(strong);
//         this.fuzzy.addFLV('weight', weight);
//         //Rules
//         this.fuzzy.addRule(new YUKA.FuzzyRule(new YUKA.FuzzyAND(facingCenter, center), strong));
//         this.fuzzy.addRule(new YUKA.FuzzyRule(new YUKA.FuzzyAND(new YUKA.FuzzyOR(facingLeft, facingRight), new YUKA.FuzzyOR(left, right)), weak));

//     }

//     calculate(vehicle, force) {

//         this.fuzzy.clearIO();

//         const center_of_mass = new YUKA.Vector3(0, 0, 0);

//         const direction = vehicle.getDirection(new YUKA.Vector3());
//         //Iterate over all neighbors to calculate the center of mass
//         const neighbors = vehicle.neighbors;
//         for (const neighbor of neighbors) {
//             //Follow agents in motion
//             if (neighbor.velocity.length() > 0.1) {

//                 const neighbor_heading = neighbor.getDirection(new YUKA.Vector3());
//                 //IN
//                 const facingAngle = angleBetween(direction, neighbor_heading);
//                 this.fuzzy.fuzzify('facingAngle', facingAngle);

//                 const toAgent = new YUKA.Vector3()
//                     .subVectors(vehicle.position, neighbor.position)
//                     .normalize();

//                 const angle = angleTo(direction, toAgent);
//                 this.fuzzy.fuzzify('direction', angle);
//                 //OUT
//                 const factor = this.fuzzy.defuzzify('weight');
//                 const scaled_target = vehicle.position.clone().add(neighbor.position.clone().sub(vehicle.position).multiplyScalar(factor));

//                 this._seek.target = center_of_mass;
//                 this._seek.calculate(vehicle, force);

//             }

//         }

//         if (neighbors.length > 0) {

//             center_of_mass.divideScalar(neighbors.length);

//             const steering_force = new YUKA.Vector3()
//                 .subVectors(center_of_mass, vehicle.position)
//                 .normalize()
//                 .multiplyScalar(vehicle.maxSpeed);

//              force.subVectors(steering_force, vehicle.velocity);

//         }

//         return force;
//     }

// }

// class NonPenetrationBehavior extends YUKA.SteeringBehavior {

//     calculate(vehicle, force) {
//         //Iterate over all neighbors checking for any overlap of bounding radii
//         const neighbors = vehicle.neighbors;
//         for (const neighbor of neighbors) {
//             //Calculate the distance between the positions of the entities
//             const toAgent = new YUKA.Vector3()
//                 .subVectors(vehicle.position, neighbor.position);
//             const length = toAgent.length();
//             //If this distance is smaller than the sum of their radii then this entity must be moved
//             //away in the direction parallel to the toAgent vector
//             const amount_of_overlap = vehicle.boundingRadius + neighbor.boundingRadius - length;

//             if (amount_of_overlap >= 0) {

//                 const away = toAgent.clone()
//                     .divideScalar(length)
//                     .multiplyScalar(amount_of_overlap);

//                 force.add(away);

//             }
//         }

//         return force;
//     }

// }

export {
    WallAvoidanceBehavior,
    // FuzzySeparationBehavior,
    // FuzzyCohesionBehavior,
    // NonPenetrationBehavior,
};
