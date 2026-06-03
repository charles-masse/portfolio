
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Path,} from '../../extensions/Navigation.js';
import EntityManager from '../../extensions/EntityManager.js';

import {loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

import Agent from './Agent.js';
import vert_shader from './Shader.vert';
import frag_shader from './Shader.frag';
import {brakingBehavior,} from './Behaviors.js';

const MAX_CARS = 75;

function createBB(pos, size=3) {

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

function renderInstance(entity, renderComponent) {
    renderComponent.setMatrixAt(entity.id, entity.worldMatrix);
}

export class Cars {

    constructor(stageData, loadingManager) {

        this.stageData = stageData;

        this.initialized = false;

        this.manager = new EntityManager();
        this.manager.active_agents = [];
        this.manager.inactive_agents = [];

        this.objects = new THREE.Group();
        
        this.init(loadingManager);

    }

    async init(loadingManager) {
        //Load
        const agent_mesh = await loadGLTF('Cars/model.gltf', loadingManager);
        const agent_geo = agent_mesh.geometry;
        agent_geo.setAttribute('instance_color', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CARS), 1));
        agent_geo.setAttribute('instance_variation', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CARS), 1));
        const palette_texture = await loadTexture('Cars/palette.png', loadingManager);

        this.instancedMesh = new THREE.InstancedMesh(
            agent_geo,
            new THREE.ShaderMaterial({
                vertexShader: vert_shader,
                fragmentShader: frag_shader,
                uniforms: {
                    palette: {value: rawTexture(palette_texture)},
                },
            }),
            MAX_CARS
        );

        // const variation = new Float32Array(MAX_CARS);
        
        for (let i = 0; i < MAX_CARS; i++) {
            //Link each instance to their individual agent
            const agent = new Agent(i);
            //Render
            agent.setRenderComponent(
                this.instancedMesh,
                (entity, renderComponent) => renderInstance(entity, renderComponent)
            );
            this.manager.addAgent(agent);
            this.manager.inactive_agents.push(agent);
            //Steering
            const brake = new brakingBehavior();
            agent.steering.add(brake);
            
            const followPath = new YUKA.FollowPathBehavior();
            agent.steering.add(followPath);

            const onPath = new YUKA.OnPathBehavior();
            agent.steering.add(onPath);

        }
        
        this.objects.add(this.instancedMesh);

    }

    activateAgents() {

        for (const agent of this.manager.inactive_agents) {
            //Find available spawn point
            let selected_road;
            let selected_spawn;
            let selected_index;

            for (const road of this.stageData.roads) {

                const road_vertex = road.map((point) => new YUKA.Vector3(...point));

                let intersect = false;
                //Spawn at random point on line or start of line
                if (!(this.initialized)) {
                    [selected_index, selected_spawn] = randomOnPath(road_vertex);
                } else {
                    selected_index = 1;
                    selected_spawn = road_vertex[0];
                }

                const bounding_box = createBB(selected_spawn);

                for (const active_agent of this.manager.active_agents) {

                    const pos = active_agent.position;
                    intersect = bounding_box.intersectsAABB(createBB(pos));
                    //Skip road if spawn is occupied
                    if (intersect) break;

                }

                if (!intersect) {
                    
                    selected_road = road_vertex;

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
                //Find path behaviors
                for (const behavior of agent.steering.behaviors) {

                    if (behavior instanceof YUKA.FollowPathBehavior || behavior instanceof YUKA.OnPathBehavior) {
                        behavior.path = path;
                    }

                }
                //Cleanup old velocity
                agent.velocity.set(0, 0, 0);
                //Spawn agent
                agent.position.copy(selected_spawn);
                // agent.smoother = null;
                agent.lookAt(selected_road[selected_index]);
                // agent.smoother = new YUKA.Smoother(10);
                //Set variation and color
                this.instancedMesh.geometry.attributes.instance_color.array[agent.id] = Math.random();
            }

        }

    }

    update(delta) {

        if (this.instancedMesh) {

            this.activateAgents();
            
            this.manager.update(delta);
            //Update instanced mesh and its instance attributes
            this.instancedMesh.instanceMatrix.needsUpdate = true;

            const attributes = this.instancedMesh.geometry.attributes;
            for (const attribute_name in attributes) {

                if (attribute_name.startsWith('instance')) {
                    attributes[attribute_name].needsUpdate = true;
                }
                
            }

            this.initialized = true;

        }

    }

}
