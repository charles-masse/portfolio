
import * as YUKA from 'yuka';

import {State,} from '../../extensions/states.js';

// import MovieScreen from '../../modules/MovieScreen'

class CheerState extends State {

    constructor() {
        super();

        this.speed = 0;
        this.blendFrames = 0;
        
    }

    // onMessage(owner, telegram) {ta

    //     if (telegram.sender instanceof MovieScreen && telegram.data == true) {
    //         owner.stateMachine.changeTo('GoTo');
    //     }
        
    // }

}

class IdleState extends State {

    constructor() {
        super();

        this.speed = 0;
        this.blendFrames = 0;
        
    }

    execute(owner) {
        super.execute(owner);

        // let follow;
        let arrive;

        for (const behavior of owner.steering.behaviors) {
            // if (behavior instanceof YUKA.FollowPathBehavior) {
                // follow = behavior;
            // } 

            if (behavior instanceof YUKA.ArriveBehavior) {

                arrive = behavior;

                break;
            }

        }
        //If nothing is stopping the agent, keep walking
        if (owner.triggers.length === 0) {
            arrive.target = null;
            owner.stateMachine.changeTo('Walk');

        }

    }

}

class RunState extends State {

    constructor() {
        super();

        this.speed = 1;
        this.blendFrames = 0;

    }

}

class WalkState extends State {

    constructor() {
        super();

        this.speed = 0.5;
        this.blendFrames = 0;
        
    }

    execute(owner) {
        super.execute(owner);

        let follow;
        let arrive;

        for (const behavior of owner.steering.behaviors) {
            if (behavior instanceof YUKA.FollowPathBehavior) {
                follow = behavior;
            } 

            else if (behavior instanceof YUKA.ArriveBehavior) {
                arrive = behavior;
            }

        }
        //Check if agent reached end of their path
        if (follow && follow.path.finished()) {
            owner.setActive(false);
        }
        //If agent is trying to reach a point, disable FollowPath
        if (arrive) {
            if (arrive.target != null) {
                follow.weight = 0;
            } else {
                follow.weight = 1;
            }
        }

    }

    // onMessage(owner, telegram) {

    //     if (telegram.sender instanceof MovieScreen && telegram.data == false) {
    //         owner.stateMachine.changeTo('Cheer');
    //     }

    // }

}

export {
    CheerState,
    IdleState,
    RunState,
    WalkState,
};
