
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from './Agent.js';

import EntityManager from '../../extensions/EntityManager.js';

export class Cars {

    constructor() {

        this.objects = new THREE.Group();

        const geometry = new THREE.BoxGeometry(2.5, 2, 3);
        const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, 50); //TODO Max cars setting
        this.objects.add(this.instancedMesh);

        this.entityManager = new EntityManager();

        for (let i = 0; i < 50; i++) { //TODO Max cars setting
            //Link each instance to their individual agent
            const agent = new Agent();
            this.entityManager.addAgent(agent);
            //Steering
            const followPath = new YUKA.FollowPathBehavior();
            followPath.active = false;
            agent.steering.add(followPath);

            const onPath = new YUKA.OnPathBehavior();
            onPath.active = false;
            agent.steering.add(onPath);

        }

    }

    update(time) {

        this.entityManager.update(time.getDelta());

        for (let i = 0; i < this.entityManager.entities.length; i++) {
            this.instancedMesh.setMatrixAt(i, this.entityManager.entities[i].worldMatrix);
        }

        this.instancedMesh.instanceMatrix.needsUpdate = true;

    }

}
