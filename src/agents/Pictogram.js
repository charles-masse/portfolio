
import * as THREE from 'three';
import * as YUKA from 'yuka';

import {Agent} from '../superClasses/Agent.js';
import {Walk, Idle} from '../stateMachines/Pictogram.js';

class Pictogram extends Agent {

    constructor() {
        super();
        //States
        this.stateMachine.add('walk', new Walk());
        this.stateMachine.add('idle', new Idle());
        this.stateMachine.changeTo('walk');
        this.stateMachine.changeTo('idle');
        this.stateMachine.changeTo('walk'); //testing the transitions
        //Path [TO-DO] find nearest waypoint and set the path direction per agent based on global path
        const path = new YUKA.Path();
        path.add(new YUKA.Vector3(0, 0, 0));
        path.add(new YUKA.Vector3(50, 0, 30));
        path.add(new YUKA.Vector3(50, 0, -30));
        path.add(new YUKA.Vector3(0, 0, -30));
        path.loop = true; //At end of line, deactivate agent (.finished())
        for (let i = 0; i < THREE.MathUtils.randInt(0, 3); i++) path.advance();

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
        //Behaviors
        const followPathBehavior = new YUKA.FollowPathBehavior(path, THREE.MathUtils.randInt(1, 10));
        this.vehicle.steering.add(followPathBehavior);

    }

}

export {
    Pictogram,
};

