
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from '../extensions/Agent.js';
import AgentManager from '../extensions/AgentManager.js';
// import {AgentState,} from '../extensions/States.js';
import {WallAvoidanceBehavior,} from '../extensions/Steering.js'

import pictogramMaterial from '../shaders/pictogramMaterial.js'

// import {createConvexRegionHelper,} from '../helpers/NavMeshHelper.js'

import {MAX_AGENTS,} from '../settings.js';

// function getPointsFromMesh(mesh) {

//     mesh.updateMatrixWorld(true);

//     const points = [];

//     const pt = new THREE.Vector3();

//     mesh.geometry.attributes.position.forEach((position, i) => {
//         pt.fromBufferAttribute(position, i);
//         pt.applyMatrix4(mesh.matrixWorld);
//         points.push(pt.clone());
//     });

//     return points;
// }

export default class {

    constructor(agent_geo, agent_texture, navMesh) {

        this.entityManager = new AgentManager();

        this.objects = new THREE.Group();
        //Helpers
        // this.objects.add(createConvexRegionHelper(navMesh));
        //Instance
        this.instancedMesh = new THREE.InstancedMesh(agent_geo, new pictogramMaterial(agent_texture), MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to their individual agent
        const color = new Float32Array(MAX_AGENTS * 3);
        
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent(navMesh, i);
            agent.setRenderComponent(this.instancedMesh);
            //Settings
            agent.neighborhoodRadius = 2.5;
            agent.boundingRadius = 0.5;
            //ORCA
            agent.timeHorizon = 3;
            agent.timeHorizonObst = 6;
            //Steering
            const follow = new YUKA.FollowPathBehavior();
            agent.steering.add(follow);

            const wall = new WallAvoidanceBehavior(navMesh);
            agent.steering.add(wall);

            this.entityManager.addAgent(agent);

            color[i * 3 + 0] = Math.random();
            color[i * 3 + 1] = Math.random();
            color[i * 3 + 2] = Math.random();

        }

        this.instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
        //ORCA Obstacles TODO
        this.entityManager.addObstacle([
            new THREE.Vector2(-5, 10),
            new THREE.Vector2(5, 10),
            new THREE.Vector2(5, 25),
            new THREE.Vector2(-5, 25),
        ]);

        this.entityManager.addObstacle([
            new THREE.Vector2(-5, -5),
            new THREE.Vector2(20, -5),
            new THREE.Vector2(20, 5),
            new THREE.Vector2(-5, 5),
        ]);

        this.entityManager.addObstacle([
            new THREE.Vector2(-25, -25),
            new THREE.Vector2(25, -25),
            new THREE.Vector2(25, -30),
            new THREE.Vector2(-25, -30),
        ]);
        
    }

    update(time) {
        this.entityManager.update(time.getDelta());
    }

}
