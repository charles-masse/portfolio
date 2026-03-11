
import * as YUKA from 'yuka';


function bestCandidate(agent) {

    const entities = agent.manager.entities.filter(entity => entity.active);

    let best;
    let maxDist = -Infinity;
    for (let i = 0; i < 10; i++) {

        const {x, y} = agent.manager.navMesh.randomPoint();
        const pos = new YUKA.Vector3(x, 0, y);

        const minDist = Math.min(...entities.map(entity => pos.distanceTo(entity.position)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

class GoToState extends YUKA.State {

    enter(owner) {

        owner.maxSpeed = 0.75;
        owner.position.copy(bestCandidate(owner));
        //Path
        const pos = owner.position;
        const navMesh = owner.manager.navMesh;

        const {x, y} = navMesh.randomPoint();
        const points = navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));

        this.path = new YUKA.Path();
        for (const point of points) {
            this.path.add(point);
        }

        owner.steering.behaviors[0].path = this.path;

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

class DeadState extends YUKA.State {
    
    enter(owner) {
        owner.position.set(0, -9999, 0); //Shadow Realm
    }

}

export {
    GoToState,
    InteractState,
    DeadState,
};
