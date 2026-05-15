
import * as YUKA from 'yuka';

const STATE_CHANGE = 10;

let accumulator = 0;

export class Traffic {

    constructor(cars_manager/*, pedestrians_manager*/) {

        this.state = 0;
        //Traffic Lights
        this.test = new YUKA.GameEntity();
        this.test.position.set(-10.25, 0, 32);
        this.test.boundingRadius = 3;
        this.test.forward.set(0.44721, 0, 0.89443);
        cars_manager.add(this.test);

        this.test2 = new YUKA.GameEntity();
        this.test2.position.set(10.75, 0, 26.5);
        this.test2.boundingRadius = 3;
        this.test2.forward.set(-0.58817, 0, 0.80874);
        this.test2.active = false;
        cars_manager.add(this.test2);

    }

    update(delta) {

        accumulator += delta;

        if (accumulator >= STATE_CHANGE) {
            this.state += 1;
            accumulator = accumulator % STATE_CHANGE;
        }

        if (this.state % 2) {
            this.test.active = true;
            this.test2.active = false;
        } else {
            this.test.active = false;
            this.test2.active = true;
        }

    }

}
