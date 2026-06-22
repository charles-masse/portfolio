
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Path,} from '../../extensions/navigation.js';
import EntityManager from '../../extensions/EntityManager.js';

import {loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

import Agent from './Agent.js';
import vert_shader from './Shader.vert';
import frag_shader from './Shader.frag';
import {BrakingBehavior,} from './behaviors.js';

const MAX_CARS = 100;
const CAR_SIZE = new YUKA.Vector3(1, 1, 2).multiplyScalar(1.25);

const xaxis = new YUKA.Vector3();
const yaxis = new YUKA.Vector3();
/**
 * Creates a direction matrix from a direction vector.
 * 
 * {@link https://stackoverflow.com/questions/18558910/direction-vector-to-rotation-matrix}
 * @param {YUKA.Vector3} direction - The direction vector to be transformed into a matrix.
 * @param {YUKA.Vector3} up - The up vector.
 * @returns {YUKA.Matrix3} The direction matrix.
 */
function directionMatrixFromVector(direction, up=new YUKA.Vector3(0, 1, 0)) {

    xaxis.crossVectors(up, direction).normalize();
    yaxis.crossVectors(direction, xaxis).normalize();

    const matrix = new YUKA.Matrix3();

    return matrix.fromArray([
        xaxis.x, yaxis.x, direction.x,
        xaxis.y, yaxis.y, direction.y,
        xaxis.z, yaxis.z, direction.z
    ]);
}

/**
 * Checks if candidate position/direction is in conflict with other agents.
 * @param {YUKA.Vector3} pos - The 3d position of the candidate.
 * @param {YUKA.Vector3} direction - The direction vector of the candidate.
 * @param {Array.YUKA.Vehicle} entities - The other entities that will be tested.
 * @param {YUKA.Vector3} size - A vector representing width, height, depth of the bounding box.
 * @returns {boolean} If an intersection was found.
 */
function checkIntersection(pos, direction, entities, size=CAR_SIZE) {

    const candidate_BB = new YUKA.OBB(
        pos,
        size,
        directionMatrixFromVector(direction)
    );

    for (const entity of entities) {

        const entity_BB = new YUKA.OBB(
            entity.position,
            size,
            new YUKA.Matrix3().fromQuaternion(entity.rotation)
        );
        //Compare bounding boxes
        const intersect = candidate_BB.intersectsOBB(entity_BB);

        if (intersect) return true;

    }

    return false;
}

/**
 * Finds a random point on the path and the index of the next waypoint.
 * @param {Array<YUKA.Vector3>} waypoints - The waypoints the paths are made of.
 * @returns {[number, YUKA.Vector3]} A random point on the path and the index of the next waypoint.
 */
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

/**
 * Individually update an instance from the instacedMesh.
 * @param {YUKA.GameEntity} entity - The agent linked to the instance being updated.
 * @param {THREE.InstancedMesh} renderComponent - The instanced mesh the instance belongs to.
 */
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
            const brake = new BrakingBehavior();
            agent.steering.add(brake);
            
            const followPath = new YUKA.FollowPathBehavior();
            agent.steering.add(followPath);

            // const onPath = new YUKA.OnPathBehavior();
            // agent.steering.add(onPath);

        }
        
        this.objects.add(this.instancedMesh);

        this.debug = [];

        for (let i = 0; i < MAX_CARS; i++) {

            const material = new THREE.LineBasicMaterial({color: new THREE.Color().setHSL(Math.random(), 1, 0.5)});
            const geometry = new THREE.BufferGeometry();
            const line = new THREE.Line(geometry, material);

            this.objects.add(line);
            this.debug.push(line);

        }

    }

    activateAgents() {

        for (const agent of this.manager.inactive_agents) {
            //Find available spawn point
            let selected_road;
            let candidate_spawn;
            let selected_index;

            for (const road of this.stageData.roads) {
                //Convert road waypoints to vectors
                const road_vertex = road.map((point) => new YUKA.Vector3(...point));
                //Spawn at random point on line or start of line
                if (!(this.initialized)) {
                    [selected_index, candidate_spawn] = randomOnPath(road_vertex);
                }
                
                else {

                    selected_index = 1;
                    candidate_spawn = road_vertex[0];

                }

                const direction = road_vertex[selected_index].clone().sub(candidate_spawn).normalize();
                const intersect = checkIntersection(candidate_spawn, direction, this.manager.active_agents);

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

                    if (behavior instanceof YUKA.FollowPathBehavior/* || behavior instanceof YUKA.OnPathBehavior*/) {
                        behavior.path = path;
                    }

                }
                //Spawn agent with clean velocity and looking at their next target
                agent.position.copy(candidate_spawn);
                agent.velocity.set(0, 0, 0);
                agent.lookAt(selected_road[selected_index]);
                //Set variation and color
                //TODO variation
                this.instancedMesh.geometry.attributes.instance_color.array[agent.id] = Math.random();
            }

        }

    }

    update(delta) {

        //Activate new agents
        this.activateAgents();

        if (this.manager.active_agents.length != 0) {

            for (let a = 0; a < MAX_CARS; a++) {
                this.debug[a].geometry.setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0, 0)
                ]);
            }

            for (let i = 0; i < this.manager.active_agents.length; i++) {

                const test = this.manager.active_agents[i];

                if (test.steering.behaviors[0].test) {

                    this.debug[i].geometry.setFromPoints([
                        test.position.clone().add(new THREE.Vector3(0, 2, 0)),
                        test.steering.behaviors[0].test.position.clone().add(new THREE.Vector3(0, 2, 0))
                    ]);

                }

            }
            //Update agents and their instanced mesh
            this.manager.update(delta);

            this.instancedMesh.instanceMatrix.needsUpdate = true;
            
            const attributes = this.instancedMesh.geometry.attributes;
            for (const attribute_name in attributes) {

                if (attribute_name.startsWith('instance')) {
                    attributes[attribute_name].needsUpdate = true;
                }
                
            }

            this.initialized = true; //TODO CBB

        }

    }

}

export {
    directionMatrixFromVector,
    checkIntersection,
    randomOnPath,
};
