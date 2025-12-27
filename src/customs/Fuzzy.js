
import * as YUKA from 'yuka';

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
    LeftShoulderFuzzySet,
    TriangularFuzzySet,
    RightShoulderFuzzySet,
};
