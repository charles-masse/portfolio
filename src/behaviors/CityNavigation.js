
import * as YUKA from 'yuka';

export default class extends YUKA.SteeringBehavior {

    constructor(path, navMesh) {
        super();

        this.path = path;
        this.navMesh = navMesh;

        this.fuzzy = new YUKA.FuzzyModule();

        const distance = new YUKA.FuzzyVariable();

        const near = new YUKA.LeftShoulderFuzzySet(0, 0.1, 1);
        const far = new YUKA.RightShoulderFuzzySet(0, 0.5, 99);
        distance.add(near);
        distance.add(far);

        this.fuzzy.addFLV('distance', distance);

        const separationWeight = new YUKA.FuzzyVariable();

        const highPrio = new YUKA.LeftShoulderFuzzySet(0, 0.25, 1);
        const lowPrio = new YUKA.RightShoulderFuzzySet(0, 0.75, 1);
        separationWeight.add(highPrio);
        separationWeight.add(lowPrio);

        this.fuzzy.addFLV('result', separationWeight);

        this.fuzzy.addRule(new YUKA.FuzzyRule(near, highPrio));
        this.fuzzy.addRule(new YUKA.FuzzyRule(far, lowPrio));

        this._followPath = new YUKA.FollowPathBehavior(this.path);
        this._separation = new YUKA.SeparationBehavior();

    }

    calculate(vehicle, force) {

        const path = this._followPath.calculate(vehicle, force);
        const separation = this._separation.calculate(vehicle, force);

        this.fuzzy.fuzzify('distance', separation.length());
        const result = this.fuzzy.defuzzify('result')

        // console.log(separation.length());

        return path.multiplyScalar(result) + separation.multiplyScalar(1 - result);
 
    }

}
