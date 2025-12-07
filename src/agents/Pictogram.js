
import * as THREE from 'three';
import * as YUKA from 'yuka';

import {Agent} from '../superClasses/Agent.js';
import {Walk, Idle} from '../stateMachines/Pictogram.js';

class Pictogram extends Agent {

    constructor() {
        super();
        //States
        this.stateMachine.add('walk', new Walk());
        // this.stateMachine.add('idle', new Idle());
        // //Path [TO-DO] change to NavMesh
        // const path = new YUKA.Path();
        // path.add(new YUKA.Vector3(-10, 0, 10));
        // path.add(new YUKA.Vector3(10, 0, 10));
        // path.add(new YUKA.Vector3(10, 0, -10));
        // path.add(new YUKA.Vector3(-10, 0, -10));
        // path.loop = true; //At end of line, deactivate agent (.finished())
        // for (let i = 0; i < THREE.MathUtils.randInt(0, 3); i++) path.advance();

        // if (debug) {

        //     const position = [];
        //     for (let i = 0; i < path._waypoints.length; i ++) {

        //         const waypoint = path._waypoints[i];
        //         position.push(waypoint.x, waypoint.y, waypoint.z);

        //     }

        //     const lineGeometry = new THREE.BufferGeometry();
        //     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
        //     const lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        //     const lines = new THREE.LineLoop(lineGeometry, lineMaterial);

        //     this.scene.add(lines);

        // }
        // //Behaviors
        // let followPathBehavior = new YUKA.FollowPathBehavior(path, THREE.MathUtils.randInt(1, 10));
        // this.vehicle.steering.add(followPathBehavior);

        // let test = new YUKA.SeparationBehavior();
        // console.log(test.active);
        // this.vehicle.steering.add(test);

    }

}

export {
    Pictogram,
};

