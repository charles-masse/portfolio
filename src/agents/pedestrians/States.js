
import {State,} from '../../extensions/States.js';

class GoToState extends State {

    enter(owner) {
        super.enter(owner);

        owner.maxSpeed = 0.8;

    }

    onMessage(owner, telegram) {

        if (telegram.message.startsWith('MovieScreen') && telegram.data === 1) {
            owner.stateMachine.changeTo('Cheer');
        }

    }

}

class IdleState extends State {

    enter(owner) {
        super.enter(owner);

        this.blendFrames = 0;
        owner.maxSpeed = 0;

    }

}


class CheerState extends State {

    enter(owner) {
        super.enter(owner);

        this.blendFrames = 0;
        owner.maxSpeed = 0;

    }

    onMessage(owner, telegram) {

        if (telegram.message.startsWith('MovieScreen') && telegram.data === 0) {
            owner.stateMachine.changeTo('GoTo');
        }
        
    }

}

class InteractState extends State {

}

class DeadState extends State {

    enter(owner) {
        super.enter(owner);

        this.blendFrames = 0;

    }

}

export {
    GoToState,
    IdleState,
    CheerState,
    InteractState,
    DeadState,
};
