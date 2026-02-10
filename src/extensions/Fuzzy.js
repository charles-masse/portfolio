
import * as YUKA from 'yuka';

class FuzzyVariable extends YUKA.FuzzyVariable {

    constructor() {
        super();

        this.io = [];

    }

    fuzzify(value) {

        this.io.push(value);

        super.fuzzify(value);

    }

    defuzzifyMaxAv() {

        const defuzz = super.defuzzifyMaxAv();

        this.io.push(defuzz);

        return defuzz;
    }

    defuzzifyCentroid(samples = 10) {

        const defuzz = super.defuzzifyCentroid(samples);

        this.io.push(defuzz);

        return defuzz;
    }

}

class FuzzyModule extends YUKA.FuzzyModule {

    clearIO() {

        const flvs = this.flvs;

        for (let [name, flv] of flvs) {
            flv.io = [];
        }

    }

}

class LeftShoulderFuzzySet extends YUKA.LeftShoulderFuzzySet {

    constructor(left, midpoint, right, color={r:255, g:0, b:0}){
        super(left, midpoint, right);

        this.color = color;

    }

}

class TriangularFuzzySet extends YUKA.TriangularFuzzySet {


    constructor(left, midpoint, right, color={r:255, g:0, b:0}){
        super(left, midpoint, right);

        this.color = color;

    }
    
}

class RightShoulderFuzzySet extends YUKA.RightShoulderFuzzySet {

    constructor(left, midpoint, right, color={r:255, g:0, b:0}){
        super(left, midpoint, right);

        this.color = color;

    }
    
}

export {
    FuzzyVariable,
    FuzzyModule,
    LeftShoulderFuzzySet,
    TriangularFuzzySet,
    RightShoulderFuzzySet,
};
