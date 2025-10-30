
import * as THREE from 'three';
import * as YUKA from 'yuka';

import {PictogramAgent} from '../agents/pictogram.js';

export class CrowdSpawner {

    constructor(scene, debug=false) {
        
        this.time = new YUKA.Time();
        this.clock = new THREE.Clock();

        this.scene = scene;
        this.entityManager = new YUKA.EntityManager();

    }

    spawn() {
        //Path
        const path = new YUKA.Path();
        path.loop = true;
        path.add(new YUKA.Vector3(-2, -0.75, 2));
        path.add(new YUKA.Vector3(-3, -0.75, 0));
        path.add(new YUKA.Vector3(-2, -0.75, -2));
        path.add(new YUKA.Vector3(0, -0.75, 0));
        path.add(new YUKA.Vector3(2, -0.75, -2));
        path.add(new YUKA.Vector3(3, -0.75, 0));
        path.add(new YUKA.Vector3(2, -0.75, 2));
        path.add(new YUKA.Vector3(0, -0.75, 3));

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

        const agent = new PictogramAgent(path);
        // Behaviors
        const followPathBehavior = new YUKA.FollowPathBehavior(path);
        agent.vehicle.steering.add(followPathBehavior);

        const onPathBehavior = new YUKA.OnPathBehavior(path);
        agent.vehicle.steering.add(onPathBehavior);

        agent.vehicle.position.copy(path._waypoints[0]);

        this.scene.add(agent.mesh);
        this.entityManager.add(agent);

    }

    update() {

        if (this.clock.getElapsedTime() > Math.round(Math.random() * (10 - 3) + 3)) {

            this.spawn();
            this.clock.start();
            console.log(`Population : ${this.entityManager.entities.length}`);

        }

        this.entityManager.update(this.time.update().getDelta());

    }

}
