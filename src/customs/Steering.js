
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {LeftShoulderFuzzySet, TriangularFuzzySet, RightShoulderFuzzySet} from '../customs/Fuzzy.js';

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function angleTo(start, target) {

    const dot = start.dot(target.clone().normalize());
    const angle = Math.acos(dot);
    const cross = new YUKA.Vector3().crossVectors(target, start);

    const angle_sign = cross.y >= 0 ? angle : -angle;
    const angle_degrees = radiansToDegrees(angle_sign);

    return angle_degrees;
}

class FuzzyBehavior extends YUKA.SteeringBehavior {

    constructor(path, navMesh) {
        super();

        this.path = path;
        this.navMesh = navMesh;

        this._followPath = new YUKA.FollowPathBehavior(this.path, 4);
        this._seek = new YUKA.SeekBehavior();
        //Weighted Separation
        this.fuzzy = new YUKA.FuzzyModule();
        //Inputs
        const direction = new YUKA.FuzzyVariable();

        const middle = new TriangularFuzzySet(-5, 0, 20);
        direction.add(middle);

        const frontLeft = new TriangularFuzzySet(-90, -25, 0, {r:0, g:255, b:0});
        direction.add(frontLeft);

        const left = new LeftShoulderFuzzySet(-180, -135, -75);
        direction.add(left);

        const frontRight = new TriangularFuzzySet(0, 45, 90, {r:0, g:255, b:0});
        direction.add(frontRight);

        const right = new RightShoulderFuzzySet(75, 135, 180);
        direction.add(right);

        this.fuzzy.addFLV('direction', direction);
        //Outputs
        const separationWeight = new YUKA.FuzzyVariable();

        const strong = new RightShoulderFuzzySet(0, 1.5, 2, {r:0, g:255, b:0});
        separationWeight.add(strong);

        const weak = new LeftShoulderFuzzySet(0, 0.1, 1.5);
        separationWeight.add(weak);

        this.fuzzy.addFLV('strength', separationWeight);
        //Rules
        const frontSides = new YUKA.FuzzyAND(frontLeft, frontRight);
        const sides = new YUKA.FuzzyAND(middle, left, right);

        this.fuzzy.addRule(new YUKA.FuzzyRule(frontLeft, strong));
        this.fuzzy.addRule(new YUKA.FuzzyRule(sides, weak));

    }

    calculate(vehicle, force) {

        let angles = [];
        // let lengths = [];
        let results = [];

        let test = [];

        const neighbors = vehicle.neighbors;
        for (let i=0; i < neighbors.length; i++) {

            const neighbor = neighbors[i];
            const direction = vehicle.getDirection(new YUKA.Vector3());

            test.push(neighbor.position);

            const toAgent = new YUKA.Vector3()
                .subVectors(neighbor.position, vehicle.position);
            //Direction
            const angle = angleTo(direction, toAgent); //Vision instead?
            this.fuzzy.fuzzify('direction', angle);
            angles.push(angle);

            const result = this.fuzzy.defuzzify('strength');
            results.push(result);
            //scale the force inversely proportional to the agents distance from its neighbor
            let length = toAgent.length();
            if (length === 0) length = 0.0001; //handle zero length if both vehicles have the same position

            toAgent.normalize().divideScalar(length);

            toAgent.multiplyScalar(-result); //negative vector to agent

        }

        this.angles = angles;
        this.results = results;

        if (test.length) {

            let target = new YUKA.Vector3()

            if (test.length === 1) {
                target.copy(test);
            }

            else {

                target.addVectors(...test);
                target.divideScalar(test.length)

            }

            this._seek.target = target;
            // this._seek.calculate(vehicle, force);

            // console.log(target);
        }

        return force;
    }

}

class SeparationCustomNeighborsBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force, neighbors) {

        for (let i = 0, l = neighbors.length; i < l; i ++) {

            let toAgent = new YUKA.Vector3();
            toAgent.subVectors(vehicle.position, neighbors[i]);

            let length = toAgent.length();
            if (length === 0) length = 0.0001; //handle zero length if both vehicles have the same position
            // scale the force inversely proportional to the agents distance from its neighbor
            toAgent.normalize().divideScalar(length);

            force.add(toAgent);

        }

        return force;
    }

}

class CohesionCustomNeighborsBehavior extends YUKA.SteeringBehavior {

    constructor() {
        super();

        this._seek = new YUKA.SeekBehavior();

    }

    calculate(vehicle, force, neighbors) {

        let centerOfMass =  new YUKA.Vector3(0, 0, 0);
        // iterate over all neighbors to calculate the center of mass
        for (let i = 0, l = neighbors.length; i < l; i ++) {
            centerOfMass.add(neighbors[i]);
        }

        if (neighbors.length > 0) {

            centerOfMass.divideScalar(neighbors.length );

            this._seek.target = centerOfMass;
            this._seek.calculate(vehicle, force);
            // the magnitude of cohesion is usually much larger than separation or alignment so it usually helps to normalize it
            force.normalize();

        }

        return force;
    }

}

class LineSegment extends YUKA.LineSegment {
    //line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    intercept2D(line) {

        const denominator = ((line.to.z - line.from.z) * (this.to.x - this.from.x) - (line.to.x - line.from.x) * (this.to.z - this.from.z));
        if (denominator === 0) return false; //Lines are parallel

        const ua = ((line.to.x - line.from.x) * (this.from.z - line.from.z) - (line.to.z - line.from.z) * (this.from.x - line.from.x)) / denominator;
        const ub = ((this.to.x - this.from.x) * (this.from.z - line.from.z) - (this.to.z - this.from.z) * (this.from.x - line.from.x)) / denominator;

        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false; //is the intersection along the segments

        const x = this.from.x + ua * (this.to.x - this.from.x);
        const z = this.from.z + ua * (this.to.z - this.from.z);

        return new THREE.Vector3(x, 0.1, z);
    }

}

class FlockingBehavior extends YUKA.SteeringBehavior {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh

        this._separation = new SeparationCustomNeighborsBehavior();
        this._cohesion = new CohesionCustomNeighborsBehavior();

    }

    wallIntersection(contour, position, ray) {8
        const ray_to = position.clone().add(ray.clone().multiplyScalar(999));
        const ray_line = new LineSegment(position, ray_to);

        for (let i=0; i < contour.length; i++) {

            const intersection = ray_line.intercept2D(new LineSegment(contour[i], contour[(i + 1) % contour.length]));
            if (intersection) return intersection;
            
        }

    }

    calculate(vehicle, force) {

        const neighbors = vehicle.neighbors.map(n => n.position.clone());
        let cloned = neighbors.slice();

        const region = this.navMesh.getRegionForPoint(vehicle.position);
        if (region) {

            const contour = [];
            region.getContour(contour);

            const direction_vector = vehicle.forward.clone().applyRotation(vehicle.rotation).normalize();
            this.hitF = this.wallIntersection(contour, vehicle.position, direction_vector);
            if (this.hitF) cloned.push(this.hitF);

            const right_vector = direction_vector.clone().cross(new YUKA.Vector3(0, 1, 0)).normalize();
            this.hitR = this.wallIntersection(contour, vehicle.position, right_vector);
            if (this.hitR) cloned.push(this.hitR);

            const left_vector = right_vector.clone().multiplyScalar(-1);
            this.hitL = this.wallIntersection(contour, vehicle.position, left_vector);
            if (this.hitL) cloned.push(this.hitL);
             
        }

        const separation_force = this._separation.calculate(vehicle, force.clone(), cloned);
        force.add(separation_force.multiplyScalar(1))

        const cohesion_force = this._cohesion.calculate(vehicle, force.clone(), cloned);
        force.add(cohesion_force.multiplyScalar(1))

        return force;
    }

}

export {
    FuzzyBehavior,
    FlockingBehavior,
};
