
import * as YUKA from 'yuka';

import {State,} from '../../extensions/States.js';

class GoToState extends State {

    enter(owner) {
        super.enter(owner);

        owner.maxSpeed = 0.8;

    }

    execute(owner) {
        super.execute(owner);
        //Reached exit
        for (const behavior of owner.steering.behaviors) {

            if (behavior instanceof YUKA.FollowPathBehavior) {

                if (behavior.path.finished()) {
                    owner.setActive(false);
                }
                break;

            }
            
        }
        
    }

    onMessage(owner, telegram) {

        if (telegram.message.startsWith('MovieScreen') && telegram.data === 1) {
            owner.stateMachine.changeTo('Cheer')
        }

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
            owner.stateMachine.changeTo('GoTo')
        }
        
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
