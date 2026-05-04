
import * as YUKA from 'yuka';

import {State,} from '../../extensions/States.js';

class GoToState extends State {

    enter(owner) {
        super.enter(owner);

        owner.maxSpeed = 1;
        owner.velocity.set(0, 0, 0);

    }

    execute(owner) {
        super.execute(owner);
        //Find behavior
        for (const behavior of owner.steering.behaviors) {

            if (behavior instanceof YUKA.FollowPathBehavior) {
                //Reached the end
                if (behavior.path.finished()) {
                    owner.setActive(false);
                }

                break;
            }
                    
        }
        
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
    DeadState,
};
