
import * as YUKA from 'yuka';

export default class extends YUKA.SteeringBehavior {

    constructor(path, navMesh) {
        super();

        this.path = path;
        this.navMesh = navMesh;

        this._followPath = new YUKA.FollowPathBehavior(this.path, 4);
        this._separation = new YUKA.SeparationBehavior();
        //Fuzzy
        this.fuzzy = new YUKA.FuzzyModule();
        //IN
        const distance = new YUKA.FuzzyVariable();

        const near = new YUKA.LeftShoulderFuzzySet(0, 0.15, 0.3);
        distance.add(near);

        const far = new YUKA.RightShoulderFuzzySet(0.2, 0.5, 5);
        distance.add(far);

        this.fuzzy.addFLV('distance', distance);
        //OUT
        const separationWeight = new YUKA.FuzzyVariable();

        const lowPrio = new YUKA.LeftShoulderFuzzySet(0, 0.1, 0.2);
        separationWeight.add(lowPrio);

        const highPrio = new YUKA.RightShoulderFuzzySet(0, 0.95, 1);
        separationWeight.add(highPrio);

        this.fuzzy.addFLV('result', separationWeight);
        
        this.fuzzy.addRule(new YUKA.FuzzyRule(far, highPrio));
        this.fuzzy.addRule(new YUKA.FuzzyRule(near, lowPrio));

    }

    calculate(vehicle, force) {

        const path = this._followPath.calculate(vehicle, force);
        const separation = this._separation.calculate(vehicle, force);

        this.in = separation.length();

        this.fuzzy.fuzzify('distance', separation.length());
        const result = this.fuzzy.defuzzify('result')

        this.out = result;

        return path.multiplyScalar(1 - result) + separation.multiplyScalar(result);
 
    }

}
