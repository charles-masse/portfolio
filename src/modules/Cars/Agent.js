
// import * as THREE from 'three';

import * as YUKA from 'yuka';

// import {DriveState,} from './States.js';

import {Path,} from '../../extensions/Navigation.js';

const ROADS = [
    [
        new YUKA.Vector3(-38, 0, -24),
        new YUKA.Vector3(-9, 0, 36),
        new YUKA.Vector3(-5, 0, 59),
    ],
    [
        new YUKA.Vector3(3, 0, 59),
        new YUKA.Vector3(-6, 0, 30),
        new YUKA.Vector3(-32, 0, -25),
    ],
    [
        new YUKA.Vector3(34, 0, -25),
        new YUKA.Vector3(8, 0, 30),
        new YUKA.Vector3(-2, 0, 59),
    ],
    [
        new YUKA.Vector3(7.5, 0, 59),
        new YUKA.Vector3(11.5, 0, 35.5),
        new YUKA.Vector3(40, 0, -24),
    ]
];

function createBB(pos, size=4) {

    const half_size = size / 2.;

    const bounding_box = new YUKA.AABB(
        pos.clone().add(new YUKA.Vector3(-half_size, -half_size, -half_size)),
        pos.clone().add(new YUKA.Vector3(half_size, half_size, half_size))
    );

    return bounding_box;
}

export default class extends YUKA.Vehicle {

    constructor() {
        super();

        this.maxSpeed = 6;

        // this.stateMachine = new YUKA.StateMachine(this);
        // this.stateMachine.add('Drive', new DriveState());
        // this.stateMachine.changeTo('Drive');

    }

    update(delta) {
        
        let result;
        let intersect;

        const followPath = this.steering.behaviors[0];
        if (followPath.path._waypoints.length === 0 || followPath.path.finished()) {

            for (const rid in ROADS) {

                const spawn = ROADS[rid][0];

                const bounding_box = createBB(spawn);
                for (const eid in this.manager.entities) {

                    const pos = this.manager.entities[eid].position;
                    intersect = bounding_box.intersectsAABB(createBB(pos));
                    //Skip spawn if it"s occupied
                    if (intersect) break;

                }

                if (!intersect) {
                    result = rid;

                    break;
                }

            }

            if (result) {

                const path = new Path();
                for (const point of ROADS[result]) {
                    path.add(point);
                }
                
                this.steering.behaviors[0].path = path;
                this.steering.behaviors[0].active = true;
                this.steering.behaviors[1].path = path;
                this.steering.behaviors[1].active = true;
                //Spawn at beginning of path with 0 velocity
                this.position.copy(path._waypoints[0]);
                this.velocity.set(0, 0, 0);

            } else {

                this.steering.behaviors[0].active = false;
                this.steering.behaviors[1].active = false;

            }

        }

        super.update(delta);
        // this.stateMachine.update();

    }

}
