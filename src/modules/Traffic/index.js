
import * as THREE from 'three';

import * as YUKA from 'yuka';

const GREEN_TIME = 10;
const YELLOW_TIME = 5;

let accumulator = 0;

export class Traffic {

    constructor(cars_manager/*, pedestrians_manager*/) {

        this.state = 0;
        //Traffic Lights
        //TODO Load from json
        this.NWStop = new YUKA.GameEntity();
        this.NWStop.position.set(-10.825, 0, 32.275);
        this.NWStop.forward.set(0.44721, 0, 0.89443);
        cars_manager.add(this.NWStop);

        this.NEStop = new YUKA.GameEntity();
        this.NEStop.position.set(10.75, 0, 26.5);
        this.NEStop.forward.set(-0.58817, 0, 0.80874);
        cars_manager.add(this.NEStop);

        this.SEStop = new YUKA.GameEntity();
        this.SEStop.position.set(7.5, 0, 55);
        this.SEStop.forward.set(0.04994, 0, -0.99875);
        cars_manager.add(this.SEStop);

        this.SWStop = new YUKA.GameEntity();
        this.SWStop.position.set(2.75, 0, 55);
        this.SWStop.forward.set(-0.12403, 0, -0.99228);
        cars_manager.add(this.SWStop);

        this.objects = new THREE.Group();

    }

    clear() {
        this.NWStop.active = true;
        this.NEStop.active = true;
        this.SEStop.active = true;
        this.SWStop.active = true;
    }

    update(delta) {

        accumulator += delta;
        
        if (this.state % 2 && accumulator >= GREEN_TIME) {

            this.state += 1;
            accumulator = accumulator % GREEN_TIME;

        } else if (!(this.state % 2) && accumulator >= YELLOW_TIME) {

            this.state += 1;
            accumulator = accumulator % YELLOW_TIME;

        }

        this.clear();

        const current_state = this.state % 4;
        //West
        if (current_state === 1) {

            this.NWStop.active = false;
            this.SWStop.active = false;
        //East
        } else if (current_state === 3) {

            this.NEStop.active = false;
            this.SEStop.active = false;

        }

    }

}
