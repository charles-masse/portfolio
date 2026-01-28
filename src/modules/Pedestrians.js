
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Agent} from '../customs/Agents.js';
import {WallAvoidanceBehavior, FuzzySeparationBehavior, FuzzyCohesionBehavior, NonPenetrationBehavior} from '../customs/Steering.js'

const MAX_AGENTS = 500;

export default class {

    constructor(agent_geo, agent_shader, entityManager, navMesh) {

        this.navMesh = navMesh;
        this.entityManager = entityManager;
        //Objects for scene
        this.objects = new THREE.Group()
        //Instance attributes
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instancedMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 3) /*agent_geo*/, new THREE.MeshBasicMaterial({color: 0x000000}) /*agent_shader*/, MAX_AGENTS);
        //Link each instance to individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {
            const agent = new Agent();
            //Social forces
            agent.maxForce = 1;
            agent.maxTurnRate = Math.PI * 2;
            //Forces + ORCA
            agent.maxSpeed = 1;
            agent.boundingRadius = 0.5;
            //ORCA
            agent.maxNeighbors = 10;
            agent.timeHorizon = 5;
            agent.timeHorizonObst = 5;
            //Behaviors
            const penetration = new NonPenetrationBehavior();
            agent.steering.add(penetration);

            const obstacle = new YUKA.ObstacleAvoidanceBehavior(this.entityManager.entities);
            obstacle.brakingWeight = 2.0;
            agent.steering.add(obstacle);

            const wall = new WallAvoidanceBehavior(navMesh);
            agent.steering.add(wall);

            const separation = new FuzzySeparationBehavior();
            agent.steering.add(separation);

            const cohesion = new FuzzyCohesionBehavior();
            agent.steering.add(cohesion);

            const wander = new YUKA.WanderBehavior(); //DELETE ME
            agent.steering.add(wander);

            const follow = new YUKA.FollowPathBehavior().active = false;
            agent.steering.add(follow);

            this.entityManager.addAgent(agent);

        }
        this.objects.add(this.instancedMesh);
        //Obstacles
        // const geometry = new THREE.BoxGeometry(10, 1, 10);
        // const material = new THREE.MeshBasicMaterial({color: 0xff0000});
        // const cube = new THREE.Mesh(geometry, material);
        // cube.position.set(15, 0, 15);
        // getPointsFromMesh(cube); //TO-DO
        // this.objects.add(cube)
        this.entityManager.addObstacle([new THREE.Vector2(10, 10), new THREE.Vector2(20, 10), new THREE.Vector2(20, 20), new THREE.Vector2(10, 20)]);

    }

    update(time) {

        if (this.instancedMesh) {
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

// import * as THREE from 'three';

// import * as YUKA from 'yuka';

// // import {createGraphHelper} from '../helpers/GraphHelper.js'
// import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'

// export default class {

//     constructor(navMesh, entityManager) {

//         this.objects = new THREE.Group();

//         const navMeshHelper = createConvexRegionHelper(navMesh);
//         // const graphHelper = createGraphHelper(navMesh.graph, 0.75);
        
//         this.objects.add(navMeshHelper, /*graphHelper*/);

//         entityManager.entities.forEach((entity, i) => {

//             if (entity.active) {

//                 const pos = entity.position;
//                 const {x, y} = navMesh.randomPoint();
//                 //Path
//                 const points = navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));
//                 const path = new YUKA.Path();
//                 for (const point of points) {
//                     path.add(point);
//                 }
                
//                 // entity.steering.behaviors[2].path = path;

//             }

//         });

//     }

// }
