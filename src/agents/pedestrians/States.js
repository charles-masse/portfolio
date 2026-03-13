
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
        const path = owner.steering.behaviors[1].path;
        if (path.finished()) {
            owner.setActive(false);
        }

    }

    onMessage(owner, telegram) {
        owner.stateMachine.changeTo('Cheer')
    }

}

class InteractState extends State {

}

class CheerState extends State {

    enter(owner) {
        super.enter(owner);

        owner.maxSpeed = 0;

    }

    onMessage(owner, telegram) {
        owner.stateMachine.changeTo('GoTo')
    }

}

class DeadState extends State {

    constructor(){
        super();

        this.blendFrames = 0;

    }

    exit(owner) {
        super.enter(owner);
        //Path
        let x;
        let y;
        //TODO make this better
        if (Math.random() > 0.5) {
            x = -22.5;
            y = 12.5;
        }

        else {
            x = 22.5;
            y = 12.5;
        }

        const pos = owner.position;
        const navMesh = owner.manager.navMesh;
        
        const points = navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));
        const path = new YUKA.Path();
        for (const point of points) {
            path.add(point);
        }

        owner.steering.behaviors[1].path = path; //TODO find the pathbehavior instance

    }


}

export {
    GoToState,
    CheerState,
    InteractState,
    DeadState,
};
