
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Path,} from '../../extensions/navigation.js';
import EntityManager from '../../extensions/EntityManager.js';

import {loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

import {checkIntersection, randomOnPath,} from './utilities.js';

import Agent from './Agent.js';
import vert_shader from './Shader.vert';
import frag_shader from './Shader.frag';

const MAX_CARS = 100;

export class Cars {

    constructor(stageData, loadingManager) {

        this.objects = new THREE.Group();
        //Convert road waypoints to vectors
        this.roads = [];
        
        for (const road of stageData.roads) {
            this.roads.push(road.map((point) => new YUKA.Vector3(...point)));
        }
        //Entity manager for cars
        this.manager = new EntityManager();

        this.manager.active_agents = [];
        this.manager.inactive_agents = [];

        this.#initialize(loadingManager);

    }

    async #initialize(loadingManager) {

        this.initialized = false;

        await this.#initCrowd(loadingManager);
        await this.#initLights();

        this.initialized = true;

    }

    async #initCrowd(loadingManager) {
        //Load geometry and textures
        const agent_mesh = await loadGLTF('Cars/model.gltf', loadingManager);

        const agent_geo = agent_mesh.geometry;
        agent_geo.setAttribute('instance_color', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CARS), 1));
        agent_geo.setAttribute('instance_variation', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CARS), 1));
        agent_geo.setAttribute('instance_headlights', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CARS), 1));

        const palette_texture = await loadTexture('Cars/palette.png', loadingManager);
        const alpha_texture = await loadTexture('Cars/alpha.png', loadingManager);
        //Create instanced mesh for cars
        this.instancedMesh = new THREE.InstancedMesh(
            agent_geo,
            new THREE.ShaderMaterial({
                transparent: true,
                uniforms: {
                    palette: {value: rawTexture(palette_texture)},
                    alpha: {value: rawTexture(alpha_texture)},
                },
                vertexShader: vert_shader,
                fragmentShader: frag_shader,
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
                (entity, renderComponent) => renderComponent.setMatrixAt(entity.id, entity.worldMatrix)
            );
            this.manager.addAgent(agent);
            this.manager.inactive_agents.push(agent);

        }
        //Add instanced mesh to scene object group
        this.objects.add(this.instancedMesh);
        
        this.activateAgents();

    }

    #initLights() {

        this.lights = [];
        //TODO load from JSON
        const NWStop = new YUKA.GameEntity();
        NWStop.boundingRadius = 0.5;
        NWStop.position.set(-10.825, 0, 32.275);
        NWStop.forward.set(0.44721, 0, 0.89443);
        this.manager.add(NWStop);
        this.lights.push(NWStop);

        const NEStop = new YUKA.GameEntity();
        NEStop.boundingRadius = 0.5;
        NEStop.position.set(10.75, 0, 26.5);
        NEStop.forward.set(-0.58817, 0, 0.80874);
        this.manager.add(NEStop);
        this.lights.push(NEStop);

        const SWStop = new YUKA.GameEntity();
        SWStop.boundingRadius = 0.5;
        SWStop.position.set(2.75, 0, 55);
        SWStop.forward.set(-0.12403, 0, -0.99228);
        this.manager.add(SWStop);
        this.lights.push(SWStop);

        const SEStop = new YUKA.GameEntity();
        SEStop.boundingRadius = 0.5;
        SEStop.position.set(7.5, 0, 55);
        SEStop.forward.set(0.04994, 0, -0.99875);
        this.manager.add(SEStop);
        this.lights.push(SEStop);

    }

    activateAgents() {

        for (const agent of this.manager.inactive_agents) {
            //Find available spawn point
            let selected_road;
            let candidate_spawn;
            let selected_index;

            for (const road of this.roads) {
                //Spawn at random point on line or start of line
                if (!(this.initialized)) {
                    [selected_index, candidate_spawn] = randomOnPath(road);
                } else {

                    selected_index = 1;
                    candidate_spawn = road[0];

                }

                const direction = road[selected_index].clone().sub(candidate_spawn).normalize();
                const intersect = checkIntersection(candidate_spawn, direction, this.manager.active_agents);

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
                //Create new path
                const path = new Path();
                for (const point of selected_road) {
                    path.add(point);
                }
                path._index = selected_index;
                //Find path behaviors and apply the new path
                for (const behavior of agent.steering.behaviors) {

                    if (behavior instanceof YUKA.FollowPathBehavior/* || behavior instanceof YUKA.OnPathBehavior*/) {
                        behavior.path = path;
                    }

                }
                //Spawn agent with clean velocity and looking at their next target
                agent.position.copy(candidate_spawn);
                agent.velocity.set(0, 0, 0);
                agent.lookAt(selected_road[selected_index]);
                //Set variation and color
                this.instancedMesh.geometry.attributes.instance_color.array[agent.id] = Math.random();
            }

        }

    }

    handleMessage(telegram) {
        //Headlights
        if (telegram.sender === this.bridge.getModuleByName('City')) {
            //TODO activate/deactivate alpha
            for (const agent of this.manager.active_agents) {
                if (telegram.data >= 2) {
                    this.instancedMesh.geometry.attributes.instance_headlights.array[agent.id] = 0.;
                } else {
                    this.instancedMesh.geometry.attributes.instance_headlights.array[agent.id] = 1.;
                }

            }
        //Traffic
        } else if (telegram.sender === this.bridge.getModuleByName('Pedestrians')) {

            if (telegram.data == 0) {

                this.lights[0].active = false;
                this.lights[1].active = true;
                this.lights[2].active = false;
                this.lights[3].active = true;

            } 
            
            else if (telegram.data == 1) {

                this.lights[0].active = true;
                this.lights[1].active = false;
                this.lights[2].active = true;
                this.lights[3].active = false;

            }

        }

    }

    update(delta) {
        //Activate new agents
        this.activateAgents();

        if (this.manager.active_agents.length != 0) {
            //Update agents and their instanced mesh
            this.manager.update(delta);

            this.instancedMesh.instanceMatrix.needsUpdate = true;
            
            const attributes = this.instancedMesh.geometry.attributes;
            for (const attribute_name in attributes) {

                if (attribute_name.startsWith('instance')) {
                    attributes[attribute_name].needsUpdate = true;
                }
                
            }

        }

    }

}
