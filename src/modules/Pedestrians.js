
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Agent, EntityManager} from '../customs/Agents.js';
import {WallAvoidanceBehavior, FuzzySeparationBehavior, FuzzyCohesionBehavior, NonPenetrationBehavior} from '../customs/Steering.js'

import {createGraphHelper} from '../helpers/GraphHelper.js'
import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'

import {MAX_AGENTS} from '../settings.js';

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

        this.entityManager = new EntityManager(navMesh);
        this.objects = new THREE.Group();

        const navMeshHelper = createConvexRegionHelper(navMesh);
        const graphHelper = createGraphHelper(navMesh.graph, 0.25);

        this.objects.add(navMeshHelper, graphHelper);
        //Instance attributes
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instancedMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 3) /*agent_geo*/, new THREE.MeshBasicMaterial({color: 0x000000}) /*agent_shader*/, MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent();
            //Social forces
            agent.neighborhoodRadius = 3;
            agent.maxForce = 1.1;
            agent.maxTurnRate = Math.PI / 3.0;
            //Forces + ORCA
            agent.maxSpeed = 0.75;
            agent.boundingRadius = 0.4;
            //ORCA
            agent.timeHorizon = 8;
            agent.timeHorizonObst = 10;
            //Behaviors
            const penetration = new NonPenetrationBehavior();
            agent.steering.add(penetration);

            const obstacle = new YUKA.ObstacleAvoidanceBehavior(this.entityManager.entities);
            // obstacle.brakingWeight = 1;
            agent.steering.add(obstacle);

            const wall = new WallAvoidanceBehavior(navMesh);
            wall.weight = 0.5;
            agent.steering.add(wall);

            const separation = new FuzzySeparationBehavior();
            separation.weight = 0.5;
            agent.steering.add(separation);

            const cohesion = new FuzzyCohesionBehavior();
            cohesion.weight = 0.25;
            agent.steering.add(cohesion);

            const wander = new YUKA.WanderBehavior(); //DELETE ME
            agent.steering.add(wander);

            // const follow = new YUKA.FollowPathBehavior().active = false;
            // agent.steering.add(follow);

            this.entityManager.addAgent(agent);

        }
        //Obstacles //Too many--hard on the framerate, please fix
        for (const wall of navMesh.perimeter) {

            const from_thick = wall.from.clone().add(wall.normal.clone().multiplyScalar(-1));
            const to_thick = wall.to.clone().add(wall.normal.clone().multiplyScalar(-1));

            this.entityManager.addObstacle([
                new THREE.Vector2(wall.from.x, wall.from.z),
                new THREE.Vector2(wall.to.x, wall.to.z),
                new THREE.Vector2(to_thick.x, to_thick.z),
                new THREE.Vector2(from_thick.x, from_thick.z),
            ]);

        }
        
    }

    update(delta) {

        if (this.instancedMesh) {
            this.entityManager.update(delta);
            //Update instances' position
            this.entityManager.entities.forEach((entity, i) => {
                this.instancedMesh.setMatrixAt(i, entity.worldMatrix);
            });
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            // //Update Shader attribute
            // const instance_frame_attribute = this.instancedMesh.geometry.getAttribute('instance_frame');
            // const instance_frame_array = instance_frame_attribute.array;

            // for (let i = 0; i < MAX_AGENTS; i++) {
            //     instance_frame_array[i] = Math.round(time * 24); //Time in frames
            // }
            // instance_frame_attribute.needsUpdate = true;

        }

    }

}
