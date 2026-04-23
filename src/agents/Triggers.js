
import * as YUKA from 'yuka';

class StopSign extends YUKA.Trigger {

    constructor(region) {
        super(region);

        this.neighborhoodRadius = 10;
        this.maxNeighbors = 99;

    }

    handleMessage(telegram) {
        //pass
    }

    execute(entity) {
        entity.stateMachine.changeTo('Idle');
    }

}

export {
    StopSign,
};
