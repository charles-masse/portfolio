
import * as YUKA from 'yuka';

class GoToState extends YUKA.State {

    enter(owner) {

        owner.maxSpeed = 0.75;
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
        this.path = new YUKA.Path();
        for (const point of points) {
            this.path.add(point);
        }

        owner.steering.behaviors[1].path = this.path; //TODO

    }

    execute(owner) {
        //Reached exit
        if (this.path.finished()) {
            owner.setActive(false);
        }

    }

    exit(/*owner*/) {
        this.path = null;
    }

}

class InteractState extends YUKA.State {

}

class CheerState extends YUKA.State {

}

export {
    GoToState,
    InteractState,
    CheerState,
};
