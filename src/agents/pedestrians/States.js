
import * as YUKA from 'yuka';

import {State,} from '../../extensions/States.js';

class GoToState extends State {

    enter(owner) {
        super.enter(owner);

        owner.maxSpeed = 0.75;

    }

    execute(owner) {
        super.execute(owner);
        //Reached exit
        const path = owner.steering.behaviors[1].path; //TODO Find followPath instance
        if (path.finished()) {
            owner.setActive(false);
        }

    }

    onMessage(owner, telegram) {
        owner.stateMachine.changeTo('Cheer')
    }

}

class CheerState extends State {

    enter(owner) {
        super.enter(owner);

        this.blendFrames = 0;
        owner.maxSpeed = 0;

    }

    onMessage(owner, telegram) {
        owner.stateMachine.changeTo('GoTo')
    }

}

class InteractState extends State {

}

class DeadState extends State {

    constructor(){
        super();

        this.blendFrames = 0;

    }

}

export {
    GoToState,
    CheerState,
    InteractState,
    DeadState,
};
