
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {CrosswalkTrigger, PolygonalTriggerRegion,} from './triggers.js';

const GREEN_TIME = 15;
const YELLOW_TIME = 10;

let accumulator = 0;

export class Traffic {

    constructor(cars_manager, pedestrians_manager) {

        this.state = 0;
        //Cars
        this.NWStop = new YUKA.GameEntity();
        this.NWStop.position.set(-10.825, 0, 32.275);
        this.NWStop.forward.set(0.44721, 0, 0.89443);
        cars_manager.add(this.NWStop);

        this.NEStop = new YUKA.GameEntity();
        this.NEStop.position.set(10.75, 0, 26.5);
        this.NEStop.forward.set(-0.58817, 0, 0.80874);
        cars_manager.add(this.NEStop);

        this.SWStop = new YUKA.GameEntity();
        this.SWStop.position.set(2.75, 0, 55);
        this.SWStop.forward.set(-0.12403, 0, -0.99228);
        cars_manager.add(this.SWStop);

        this.SEStop = new YUKA.GameEntity();
        this.SEStop.position.set(7.5, 0, 55);
        this.SEStop.forward.set(0.04994, 0, -0.99875);
        cars_manager.add(this.SEStop);
        //Pedestrians
        this.NWCross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(-7, 0, 25),
            new YUKA.Vector3(-6.5, 0, 26.5),
            new YUKA.Vector3(-4, 0, 28),
            new YUKA.Vector3(-2.75, 0, 27.5)
        ]));
        this.NWCross.forward = new YUKA.Vector3(0.58124, 0, -0.81373);
        pedestrians_manager.add(this.NWCross);

        this.NECross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(3.25, 0, 26.75),
            new YUKA.Vector3(6, 0, 27.75),
            new YUKA.Vector3(8.75, 0, 26),
            new YUKA.Vector3(9.5, 0, 24)
        ]));
        this.NECross.forward = new YUKA.Vector3(-0.44721, 0, -0.89443);
        pedestrians_manager.add(this.NECross);

        this.SWCross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(-11, 0, 35.25),
            new YUKA.Vector3(-13, 0, 35.25),
            new YUKA.Vector3(-9.5, 0, 42.5),
            new YUKA.Vector3(-9, 0, 38.5)
        ]));
        this.SWCross.forward = new YUKA.Vector3(-0.53, 0, 0.848);
        pedestrians_manager.add(this.SWCross);

        this.SECross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(13, 0, 35.25),
            new YUKA.Vector3(11, 0, 39),
            new YUKA.Vector3(12.5, 0, 42.25),
            new YUKA.Vector3(15, 0, 37)
        ]));
        this.SECross.forward = new YUKA.Vector3(0.44721, 0, 0.89443);
        pedestrians_manager.add(this.SECross);

        this.objects = new THREE.Group();

    }

    clear() {
        
        this.NWStop.active = true;
        this.NEStop.active = true;

        this.SWStop.active = true;
        this.SEStop.active = true;

        this.NWCross.enabled = true;
        this.NECross.enabled = true;

        this.SWCross.enabled = true;
        this.SECross.enabled = true;

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

        if (current_state === 1) {

            this.NWStop.active = false;
            this.SWStop.active = false;

            this.NECross.enabled = false;
            this.SECross.enabled = false;

        } else if (current_state === 3) {

            this.NEStop.active = false;
            this.SEStop.active = false;

            this.NWCross.enabled = false;
            this.SWCross.enabled = false;

        }

    }

}
