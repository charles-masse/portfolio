
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

export default class extends YUKA.SteeringBehavior {

    constructor(path, navMesh) {
        super();

        this.path = path;
        this.navMesh = navMesh;

        this._followPath = new YUKA.FollowPathBehavior(this.path, 4);
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

        const neighbors = vehicle.neighbors;
        for (let i=0; i < neighbors.length; i++) {

            const neighbor = neighbors[i];
            const direction = vehicle.getDirection(new YUKA.Vector3());

            const toAgent = new YUKA.Vector3()
                .subVectors(neighbor.position, vehicle.position);
            //Direction
            const angle = angleTo(direction, toAgent);
            this.fuzzy.fuzzify('direction', angle);
            angles.push(angle);

            const result = this.fuzzy.defuzzify('strength');
            results.push(result);
            //scale the force inversely proportional to the agents distance from its neighbor
            let length = toAgent.length();
            if (length === 0) length = 0.0001; //handle zero length if both vehicles have the same position

            toAgent.normalize().divideScalar(length)

            toAgent.multiplyScalar(-result); //negative vector to agent

            force.add(toAgent);

        }

        this.angles = angles;
        // this.lengths = lengths;
        this.results = results;

        const path = this._followPath.calculate(vehicle, force);
        force.add(path.multiplyScalar(0.1));

        return force;
    }

}
