
import * as THREE from 'three';

import * as YUKA from 'yuka';

const GREEN_TIME = 10;
const YELLOW_TIME = 3.5;

let accumulator = 0;

export class Traffic {

    constructor(cars_manager, pedestrians_manager) {

        this.objects = new THREE.Group();

        this.state = 0;
        //Traffic Lights
        this.test = new YUKA.Trigger();
        this.test.position.set(-10.25, 0, 32);
        this.test.boundingRadius = 3;
        this.test.forward.set(0.44721, 0, 0.89443);
        cars_manager.add(this.test);

        this.test2 = new YUKA.Trigger();
        this.test2.position.set(10.75, 0, 26.5);
        this.test2.boundingRadius = 3;
        this.test2.forward.set(-0.58817, 0, 0.80874);
        this.test2.active = false;
        cars_manager.add(this.test2);

        this.test3 = new YUKA.Trigger();
        this.test3.position.set(7.5, 0, 55);
        this.test3.boundingRadius = 3;
        this.test3.forward.set(0.04994, 0, -0.99875);
        cars_manager.add(this.test3);

        this.test4 = new YUKA.Trigger();
        this.test4.position.set(2.75, 0, 55);
        this.test4.boundingRadius = 3;
        this.test4.forward.set(-0.12403, 0, -0.99228);
        cars_manager.add(this.test4);

    }

    clear() {
        this.test.active = true;
        this.test2.active = true;
        this.test3.active = true;
        this.test4.active = true;
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

        if (current_state == 1) {

            this.test.active = false;
            this.test4.active = false;

        } else if (current_state == 3) {

            this.test2.active = false;
            this.test3.active = false;

        }

    }

}
