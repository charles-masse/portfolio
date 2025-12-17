
import * as YUKA from 'yuka';

export default class extends YUKA.SteeringBehavior {

    constructor(path, navMesh) {
        super();

        this.path = path;
        this.navMesh = navMesh;

        this._followPath = new YUKA.FollowPathBehavior(this.path, 2.5);
        this._separation = new YUKA.SeparationBehavior();
        //Fuzzy
        this.fuzzy = new YUKA.FuzzyModule();
        //IN
        const distance = new YUKA.FuzzyVariable();

        const near = new YUKA.LeftShoulderFuzzySet(0, 0.1, 1);
        distance.add(near);

        const far = new YUKA.RightShoulderFuzzySet(0, 0.5, 1);
        distance.add(far);

        this.fuzzy.addFLV('distance', distance);
        //OUT
        const separationWeight = new YUKA.FuzzyVariable();

        const highPrio = new YUKA.TriangularFuzzySet(0, 0.25, 1);
        separationWeight.add(highPrio);

        const lowPrio = new YUKA.TriangularFuzzySet(0, 0.75, 1);
        separationWeight.add(lowPrio);

        this.fuzzy.addFLV('result', separationWeight);
        
        this.fuzzy.addRule(new YUKA.FuzzyRule(near, highPrio));
        this.fuzzy.addRule(new YUKA.FuzzyRule(far, lowPrio));

    }

    calculate(vehicle, force) {

        const path = this._followPath.calculate(vehicle, force);
        const separation = this._separation.calculate(vehicle, force);

        this.test = separation.length(); //KILL ME

        this.fuzzy.fuzzify('distance', separation.length());
        const result = this.fuzzy.defuzzify('result')

        return path.multiplyScalar(result) + separation.multiplyScalar(1 - result);
 
    }

}
