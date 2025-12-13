
import * as YUKA from 'yuka';

export default class extends YUKA.SteeringBehavior {

    constructor(path) {
        super();

        this.path = path;

        // this.fuzzy = new YUKA.FuzzyModule();

        // const distance = new YUKA.FuzzyVariable();

        // const near = distance.add(new YUKA.LeftShoulderFuzzySet(0, 0, 1));
        // const far = distance.add(new YUKA.TriangularFuzzySet(0, 0.9, 1));

        // this.fuzzy.addRule(new YUKA.FuzzyRule(near, far));

        // this.fuzzy.addFLV('distance', distance);

        this._followPath = new YUKA.FollowPathBehavior(this.path);
        this._separation = new YUKA.SeparationBehavior();

    }

    calculate(vehicle, force) {

        const path = this._followPath.calculate(vehicle, force);
        const separation = this._separation.calculate(vehicle, force);

        // const test = this.fuzzy.fuzzify('distance', separation.length());

        // console.log(separation.length());
        // console.log(this.fuzzy.defuzzify('distance'));

        return path.multiplyScalar(separation.length() + 0.1) + separation;
 
    }

}
