
import * as YUKA from 'yuka';

export default class extends YUKA.Vehicle {

    constructor(id) {
        super();

        this.active = false;

        this.id = id;

        this.maxSpeed = 6;

        this.boundingRadius = 3;

        this.neighborhoodRadius = 10;
        this.maxNeighbors = 10;

        // this.smoother = new YUKA.Smoother(30);

    }

    update(delta) {

        if (this.steering.behaviors[0].path.finished()) {

            const aid = this.manager.active_agents.indexOf(this);
            this.manager.active_agents.splice(aid, 1);

            this.manager.inactive_agents.push(this);
            this.position.set(0, -9999, 0);
            this.active = false;

        }

        super.update(delta);

    }

}
