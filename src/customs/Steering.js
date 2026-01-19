
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {LeftShoulderFuzzySet, TriangularFuzzySet, RightShoulderFuzzySet} from '../customs/Fuzzy.js';

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function angleTo(start, target) {

    const dot = start.dot(target.clone().normalize());
    const angle = Math.acos(dot);
    const cross = target.clone().cross(start);

    const angle_sign = cross.y >= 0 ? angle : -angle;
    const angle_degrees = radiansToDegrees(angle_sign);

    return angle_degrees;
}

function angleBetween(direction, target_direction) {

    const a = direction.clone().normalize();
    const b = target_direction.clone().normalize();

    const dot = a.dot(b);
    const cross = a.clone().cross(b);

    const angle = Math.atan2(cross.y, dot);
    const angle_degrees = radiansToDegrees(angle);

    return angle_degrees;
}

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

const feeler_angle = degreesToRadians(50);
const left_quat = new YUKA.Quaternion().fromEuler(0, feeler_angle, 0);
const right_quat = new YUKA.Quaternion().fromEuler(0, -feeler_angle, 0);

class WallAvoidanceBehavior extends YUKA.SteeringBehavior {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh;

    }

    createFeelers(vehicle) {

        const feelers = [];

        const heading = vehicle.getDirection(new YUKA.Vector3());
        const position = vehicle.position;
        const feeler_length = vehicle.maxSpeed;
        //feeler pointing straight in front
        let temp = heading.clone();
        let feeler_end = position.clone().add(temp.multiplyScalar(feeler_length));
        feelers.push(
            new LineSegment(position, feeler_end)
        );
        //feeler to left
        temp = heading.clone()
            .applyRotation(left_quat);
        feeler_end = position.clone().add(temp.multiplyScalar(feeler_length * 2.0));

        feelers.push(
            new LineSegment(position, feeler_end)
        );
        //feeler to right
        temp = heading.clone()
            .applyRotation(right_quat);
        feeler_end = position.clone().add(temp.multiplyScalar(feeler_length * 2.0));

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
            for (let i=0; i < walls.length; i++) {

                const hit = feeler.intercept2D(walls[i]);
                if (hit) {

                    this.hit = hit;
                    const dist = hit.clone().sub(vehicle.position).length();
                    if (dist < dist_to_closest_pt) {

                        dist_to_closest_pt = dist;
                        closest_point = hit;
                        closest_wall = walls[i];
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

export {
    WallAvoidanceBehavior,
};

        // const obstacles = vehicle.neighbors/*.map(n => n.position.clone())*/;

        // this.facingAngle = [];
        // const center_of_mass = new YUKA.Vector3(0, 0, 0);
        // const separation_vector = new YUKA.Vector3(0, 0, 0);

        // for (let i = 0, l = obstacles.length; i < l; i ++) {

        //     const toAgent = new YUKA.Vector3()
        //         .subVectors(vehicle.position, obstacles[i].position);
        //     const length = toAgent.length();
        //     toAgent.normalize();
        //     //Fuzzy weight
        //     if (length <= 4 && obstacles[i].rotation.x != 0 && obstacles[i].rotation.y != 0 && obstacles[i].rotation.z != 0) {

        //         const facingAngle = angleBetween(direction_vector, obstacles[i].forward.clone().applyRotation(obstacles[i].rotation).normalize());
        //         this.facingAngle.push(facingAngle);
        //         this.fuzzy.fuzzify('facingAngle', facingAngle);

        //         // const direction = vehicle.getDirection(new YUKA.Vector3());
        //         // const angle = angleTo(direction, toAgent);
        //         // this.fuzzy.fuzzify('direction', angle);

        //         const cohesion_factor = this.fuzzy.defuzzify('cohesionWeight');
        //         const scaled_target = vehicle.position.clone().add(obstacles[i].position.clone().sub(vehicle.position).multiplyScalar(cohesion_factor))
        //         center_of_mass.add(scaled_target);

        //     }

        //     separation_vector.add(toAgent.divideScalar(length));

        // }

        // const cohesion_vector = new YUKA.Vector3(0, 0, 0)
        //     .subVectors(center_of_mass, vehicle.position)
        //     .normalize();
        // force.add(cohesion_vector.multiplyScalar(0));

        // force.add(separation_vector.multiplyScalar(0.75));


    // initFuzzy() {

    //     this.fuzzy = new YUKA.FuzzyModule();
    //     //Inputs
    //     const center = new TriangularFuzzySet(-45, 0, 45, {r:0, g:255, b:0});
    //     const left = new LeftShoulderFuzzySet(-180, -45, 0);
    //     const right = new RightShoulderFuzzySet(0, 45, 180);

    //     const facingAngle = new YUKA.FuzzyVariable()
    //         .add(center)
    //         .add(left)
    //         .add(right);
    //     this.fuzzy.addFLV('facingAngle', facingAngle);

    //     // const close = new LeftShoulderFuzzySet(0, 0.25, 3.75, {r:0, g:255, b:0});
    //     // const far = new RightShoulderFuzzySet(0.25, 3.75, 4);

    //     // const distance = new YUKA.FuzzyVariable()
    //     //     .add(close)
    //     //     .add(far);
    //     // this.fuzzy.addFLV('distance', distance);

    //     const dirFrontLeft = new TriangularFuzzySet(-135, 0, 0, {r:0, g:255, b:0});
    //     const dirFrontRight = new TriangularFuzzySet(0, 0, 135, {r:0, g:255, b:0});
    //     const dirLeft = new LeftShoulderFuzzySet(-180, -135, -90);
    //     const dirRight = new RightShoulderFuzzySet(90, 135, 180);

    //     const direction = new YUKA.FuzzyVariable()
    //         .add(dirFrontLeft)
    //         .add(dirFrontRight)
    //         .add(dirLeft)
    //         .add(dirRight);
    //     this.fuzzy.addFLV('direction', direction);
    //     //Outputs
    //     const weak = new LeftShoulderFuzzySet(0, 0, 0.5);
    //     const strong = new TriangularFuzzySet(0, 0.5, 1, {r:0, g:255, b:0});
        
    //     const cohesionWeight = new YUKA.FuzzyVariable()
    //         .add(weak)
    //         .add(strong);
    //     this.fuzzy.addFLV('cohesionWeight', cohesionWeight);
    //     //Rules
    //     const front = new YUKA.FuzzyAND(center, new YUKA.FuzzyOR(dirFrontLeft, dirFrontRight));
    //     const sides = new YUKA.FuzzyAND(new YUKA.FuzzyOR(left, right), new YUKA.FuzzyOR(dirLeft, dirRight));

    //     this.fuzzy.addRule(new YUKA.FuzzyRule(front, strong));
    //     this.fuzzy.addRule(new YUKA.FuzzyRule(sides, weak));

    // }
