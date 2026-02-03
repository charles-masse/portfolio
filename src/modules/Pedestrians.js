
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Agent, EntityManager,} from '../customs/Agents.js';
import {WallAvoidanceBehavior,} from '../customs/Steering.js'

import {createGraphHelper,} from '../helpers/GraphHelper.js'
import {createConvexRegionHelper,} from '../helpers/NavMeshHelper.js'

import {MAX_AGENTS,} from '../settings.js';

function getPointsFromMesh(mesh) {

    mesh.updateMatrixWorld(true);

    const points = [];

    const pt = new THREE.Vector3();

    mesh.geometry.attributes.position.forEach((position, i) => {
        pt.fromBufferAttribute(position, i);
        pt.applyMatrix4(mesh.matrixWorld);
        points.push(pt.clone());
    });

    return points;
}

export default class {

    constructor(agent_geo, agent_shader, navMesh) {

        this.entityManager = new EntityManager();

        this.objects = new THREE.Group();

        // const navMeshHelper = createConvexRegionHelper(navMesh);
        // const graphHelper = createGraphHelper(navMesh.graph, 0.25);
        // this.objects.add(navMeshHelper, graphHelper);
        //Instance
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instancedMesh = new THREE.InstancedMesh(agent_geo, new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide}) /*agent_shader*/, MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to their individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent(navMesh);
            //Settings
            // agent.maxForce = 1.5;
            agent.neighborhoodRadius = 2;
            agent.maxTurnRate = Math.PI / 3.5;

            agent.maxSpeed = 0.5;
            agent.boundingRadius = 0.3;

            agent.timeHorizon = 2.5;
            agent.timeHorizonObst = 0.5;
            //Steering
            const follow = new YUKA.FollowPathBehavior();
            agent.steering.add(follow);

            // const obstacle = new YUKA.ObstacleAvoidanceBehavior(this.entityManager.entities);
            // obstacle.brakingWeight = 0.15;
            // agent.steering.add(obstacle);

            const wall = new WallAvoidanceBehavior(navMesh);
            wall.weight = 0.5;
            agent.steering.add(wall);

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

    update(delta) {

        this.entityManager.update(delta);
        //Update instances' position
        this.entityManager.entities.forEach((entity, i) => {
            this.instancedMesh.setMatrixAt(i, entity.worldMatrix);
        });

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        //Update Shader attribute
        // const instance_frame_attribute = this.instancedMesh.geometry.getAttribute('instance_frame');
        // const instance_frame_array = instance_frame_attribute.array;

        // for (let i = 0; i < MAX_AGENTS; i++) {
        //     instance_frame_array[i] = Math.round(time * 24); //Time in frames
        // }
        // instance_frame_attribute.needsUpdate = true;

    }

}
