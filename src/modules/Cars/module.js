
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Path,} from '../../extensions/Navigation.js';
import EntityManager from '../../extensions/EntityManager.js';

import Agent from './Agent.js';
import {brakingBehavior} from './Behaviors.js';

const MAX_CARS = 50;

const ROADS = [
    [
        new YUKA.Vector3(-38, 0, -24),
        new YUKA.Vector3(-9, 0, 36),
        new YUKA.Vector3(-5, 0, 59),
    ],
    [
        new YUKA.Vector3(3, 0, 59),
        new YUKA.Vector3(-6, 0, 30),
        new YUKA.Vector3(-32, 0, -25),
    ],
    [
        new YUKA.Vector3(34, 0, -25),
        new YUKA.Vector3(8, 0, 30),
        new YUKA.Vector3(-2, 0, 59),
    ],
    [
        new YUKA.Vector3(7.5, 0, 59),
        new YUKA.Vector3(11.5, 0, 35.5),
        new YUKA.Vector3(40, 0, -24),
    ]
];

function createBB(pos, size=4) {

    const half_size = size / 2.;

    const bounding_box = new YUKA.AABB(
        pos.clone().add(new YUKA.Vector3(-half_size, -half_size, -half_size)),
        pos.clone().add(new YUKA.Vector3( half_size,  half_size,  half_size))
    );

    return bounding_box;
}

function randomOnPath(waypoints) {

    const random_index = YUKA.MathUtils.randInt(1, waypoints.length - 1);

    const rng = Math.random();
    const result = new THREE.Vector3(
        THREE.MathUtils.lerp(waypoints[random_index - 1].x, waypoints[random_index].x, rng),
        THREE.MathUtils.lerp(waypoints[random_index - 1].y, waypoints[random_index].y, rng),
        THREE.MathUtils.lerp(waypoints[random_index - 1].z, waypoints[random_index].z, rng),
    );

    return [random_index, result];

}

export default class {

    constructor() {

        this.init = true;

        this.manager = new EntityManager();
        this.manager.active_agents = [];
        this.manager.inactive_agents = [];

        this.objects = new THREE.Group();

        const geometry = new THREE.BoxGeometry(2.5, 2, 3);
        const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, MAX_CARS);

        for (let i = 0; i < MAX_CARS; i++) {
            //Link each instance to their individual agent
            const agent = new Agent();
            this.manager.addAgent(agent);
            this.manager.inactive_agents.push(agent);
            //Steering
            const followPath = new YUKA.FollowPathBehavior();
            agent.steering.add(followPath);

            const onPath = new YUKA.OnPathBehavior();
            agent.steering.add(onPath);

            const brake = new brakingBehavior();
            agent.steering.add(brake);

        }

        this.objects.add(this.instancedMesh);

    }

    activateAgents() {

        for (const agent of this.manager.inactive_agents) {
            //Find available spawn point
            let selected_road;
            let selected_spawn;
            let selected_index;

            const road_candidates = ROADS.slice();

            for (const road of road_candidates) {

                let intersect = false;
                //Spawn at random point on line or start of line
                if (this.init) {
                    [selected_index, selected_spawn] = randomOnPath(road);
                } else {
                    selected_index = 0;
                    selected_spawn = road[0];
                }

                const bounding_box = createBB(selected_spawn);

                for (const active_agent of this.manager.active_agents) {

                    const pos = active_agent.position;
                    intersect = bounding_box.intersectsAABB(createBB(pos));
                    //Skip road if spawn is occupied
                    if (intersect) break;

                }

                if (!intersect) {
                    
                    selected_road = road;

                    break;
                }

            }

            if (selected_road) {
                //Activate agent
                const aid = this.manager.inactive_agents.indexOf(agent);
                this.manager.inactive_agents.splice(aid, 1);

                this.manager.active_agents.push(agent);
                agent.active = true;
                //Add new path
                const path = new Path();
                for (const point of selected_road) {
                    path.add(point);
                }
                path._index = selected_index;
                
                agent.steering.behaviors[0].path = path;
                agent.steering.behaviors[1].path = path;
                //Spawn at beginning of path with 0 velocity
                agent.position.copy(selected_spawn);
                agent.velocity.set(0, 0, 0);

            }

        }

        this.init = false;

    }

    update(time) {

        this.activateAgents();
        
        this.manager.update(time.getDelta());

        for (let i = 0; i < this.manager.entities.length; i++) {
            this.instancedMesh.setMatrixAt(i, this.manager.entities[i].worldMatrix);
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true;

    }

}
