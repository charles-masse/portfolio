
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from '../extensions/Agent.js';
import AgentManager from '../extensions/AgentManager.js';
import {AgentState,} from '../extensions/States.js';
import {WallAvoidanceBehavior,} from '../extensions/Steering.js'

// import {createGraphHelper,} from '../helpers/GraphHelper.js'
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

    constructor(agent_geo, agent_shader, navMesh) {

        this.entityManager = new AgentManager();

        this.objects = new THREE.Group();

        // const navMeshHelper = createConvexRegionHelper(navMesh);
        // const graphHelper = createGraphHelper(navMesh.graph, 0.25);
        // this.objects.add(navMeshHelper, graphHelper);

        this.instancedMesh = new THREE.InstancedMesh(agent_geo, agent_shader, MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to their individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent(navMesh, i);
            agent.setRenderComponent(this.instancedMesh);
            
            agent.neighborhoodRadius = 2;
            agent.maxSpeed = 0.35;
            agent.boundingRadius = 0.35;
            //RVO2 Settings
            agent.timeHorizon = 2;
            agent.timeHorizonObst = 3;
            //Steering
            const follow = new YUKA.FollowPathBehavior();
            agent.steering.add(follow);

            const wall = new WallAvoidanceBehavior(navMesh);
            wall.weight = 0.75;
            agent.steering.add(wall);
            //States
            agent.stateMachine.add('walk', new AgentState());
            agent.stateMachine.changeTo('walk');

            this.entityManager.addAgent(agent);

        }
        //ORCA Obstacles
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
