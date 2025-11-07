
import * as YUKA from 'yuka';

class Agent extends YUKA.GameEntity {

    constructor() {
        super();
        //Vehicle
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = (Math.random() + 0.5) * 3;

        this.setActive(false);

    }

    setActive(bool) {

        if (bool) {

            this.active = true;

        } else {

            this.setPosition(0, -9999, 0); //ShadowRealm
            this.active = false;

        }

    }

    setPosition(...position) {

        if (position.length === 1 && position[0] instanceof YUKA.Vector3) {
            this.vehicle.position.copy(position[0]);
        } 

        else if (position.length === 3 && position.every(a => typeof a === 'number')) {
            this.vehicle.position.set(position[0], position[1], position[2]);
        } 

        this.sync();

    }

    sync() {

        this.position.copy(this.vehicle.position);
        this.rotation.copy(this.vehicle.rotation);

    }

    update(delta) {

        if (this.active) {

            this.currentTime += delta;

            this.stateMachine.update();
            // this.mixer.update(delta);
            this.vehicle.update(delta);
            this.sync();
            super.update(delta);

        }

    }

}

export {Agent};
