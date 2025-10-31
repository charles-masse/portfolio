
import * as THREE from 'three';
import * as YUKA from 'yuka';
//Agents
import {PictogramAgent} from '../agents/Pictogram.js';

export class CrowdSpawner {

    constructor(scene) {
        
        this.time = new YUKA.Time();
        this.clock = new THREE.Clock();

        this.scene = scene;
        this.entityManager = new YUKA.EntityManager();

    }

    spawn() {
        //Path
        const path = new YUKA.Path();
        path.add(new YUKA.Vector3(-2, -1, 2));
        path.add(new YUKA.Vector3(-3, -1, 0));
        path.add(new YUKA.Vector3(-2, -1, -2));
        path.add(new YUKA.Vector3(0, -1, 0));
        path.add(new YUKA.Vector3(2, -1, -2));
        path.add(new YUKA.Vector3(3, -1, 0));
        path.add(new YUKA.Vector3(2, -1, 2));
        path.add(new YUKA.Vector3(0, -1, 3));
        path.loop = true;

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
        //Create agent
        const agent = new PictogramAgent(this.scene);
        //Behaviors
        const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.25);
        agent.vehicle.steering.add(followPathBehavior);

        // const onPathBehavior = new YUKA.OnPathBehavior(path);
        // agent.vehicle.steering.add(onPathBehavior);
        
        agent.vehicle.position.copy(path._waypoints[0]);

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
