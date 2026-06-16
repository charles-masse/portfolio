
import * as THREE from 'three';

import * as YUKA from 'yuka';

import GUI from '../../extensions/GUI.js';
import EntityManager from '../../extensions/EntityManager.js';
import {NavMesh, Path,} from '../../extensions/Navigation.js';

import {loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

import Agent from './Agent.js';
import vert_shader from './Shader.vert';
import {ArriveBehavior,} from './behaviors.js';

// import {createGraphHelper,} from '../../helpers/GraphHelper.js';
// import {createConvexRegionHelper,} from '../../helpers/NavMeshHelper.js';

const MAX_AGENTS = 200;

/**
 * Find a point on the navmesh that is as far as possible from the other entities.
 * @param {YUKA.NavMesh} navMesh - The navmesh to find the point on.
 * @param {YUKA.GameEntity[]} entities - The entities to find the point far from.
 * @returns {YUKA.Vector3} The best point found.
 */
function findBestNavMeshPoint(navMesh, entities) {

    let best;
    let maxDist = -Infinity;

    for (let i = 0; i < 10; i++) {

        const pos = navMesh.randomPoint();
        const minDist = Math.min(...entities.map((entity) => pos.distanceTo(entity.position)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

/**
 * Individually update an instance from the instacedMesh.
 * @param {YUKA.GameEntity} entity - The agent linked to the instance being updated.
 * @param {THREE.InstancedMesh} renderComponent - The instanced mesh the instance belongs to.
 * @param {THREE.Camera} camera - The scene's camera, used to calculate the distance from the agent to the camera.
 */
function renderInstance(entity, renderComponent, camera) {
    //Geo
    renderComponent.setMatrixAt(entity.id, entity.worldMatrix);
    //Attributes
    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
    instance_depth.array[entity.id] = camera.position.clone().sub(entity.position).length();

    const instance_frame = renderComponent.geometry.getAttribute('instance_frame');
    instance_frame.array[entity.id] = entity.stateMachine.currentState.current_frame;

}

export class Pedestrians {

    constructor(stageData, camera, loadingManager) {

        this.manager = new EntityManager();
        this.manager.active_agents = [];
        this.manager.inactive_agents = [];

        this.objects = new THREE.Group();

        this.initUI();
        this.init(stageData, camera, loadingManager);
 
    }

    initUI() {

        const gui = new GUI({title:'Crowd Spawner'});
        gui.domElement.style.position = 'static';
        document.getElementById('gui-container').appendChild(gui.domElement);

        const data = {Population: MAX_AGENTS / 2.0};
        this.population = data.Population;

        gui.add(data, 'Population', 1, MAX_AGENTS, 1).onFinishChange(
            (value) => {
                this.population = value;
                this.activateAgents(value);
            }
        );
        
    }

    async init(stageData, camera, loadingManager) {
        //Create navmesh
        const navMesh = new NavMesh();
        navMesh.mergeConvexRegions = false;
        const polygons = [stageData.navmesh.map((poly) => new YUKA.Polygon().fromContour(poly.map((pt) => new YUKA.Vector3(...pt))))];
        navMesh.fromPolygons(polygons.flat());
        this.manager.navMesh = navMesh;
        //Create Spawn points
        this.exits = stageData.spawns.map((pt) => new YUKA.Vector3(...pt));
        //Create Obstacles
        for (const obstacle of stageData.obstacles) {
            this.manager.addObstacle(obstacle.map((pt) => new THREE.Vector2(pt[0], pt[2])));
        }
        this.manager.buildObstacleTree();
        //Helpers
        // this.objects.add(createConvexRegionHelper(navMesh));
        // this.objects.add(createGraphHelper(navMesh.graph, 0.25, 0x00ff00, 0xff0000));
        //Load
        const agent_mesh = await loadGLTF('Pedestrians/pictogram.gltf', loadingManager);
        const anim_texture = await loadTexture('Pedestrians/VAT.png', loadingManager);
        const alpha_texture = await loadTexture('Pedestrians/pictogramAlpha.png', loadingManager);

        const agent_geo = agent_mesh.geometry;
        //Custom attributes
        agent_geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        //Instance agents
        this.instancedMesh = new THREE.InstancedMesh(
            agent_geo,
            new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    animations: {value: rawTexture(anim_texture)},
                    atlasSize: {
                        value: new THREE.Vector2(
                            anim_texture.image.width,
                            anim_texture.image.height
                        )
                    },
                    alpha: {value: rawTexture(alpha_texture)},
                },
                vertexShader: vert_shader,
            }),
            MAX_AGENTS
        );
        this.objects.add(this.instancedMesh);

            
        
        const color = new Float32Array(MAX_AGENTS * 3);
        const variation = new Float32Array(MAX_AGENTS);

        for (let i = 0; i < MAX_AGENTS; i++) {
            //Link each instance to their individual agent
            const agent = new Agent(i);
            this.manager.inactive_agents.push(agent);
            //Steering
            // const obstacle = new YUKA.ObstacleAvoidanceBehavior(this.manager.entities);
            // obstacle.brakingWeight = agent.maxSpeed;
            // obstacle.dBoxMinLength = agent.boundingRadius * 2;
            // agent.steering.add(obstacle);

            const arrive = new ArriveBehavior();
            agent.steering.add(arrive);

            const followPath = new YUKA.FollowPathBehavior();
            agent.steering.add(followPath);
            //Render
            agent.setRenderComponent(
                this.instancedMesh,
                (entity, renderComponent) => renderInstance(entity, renderComponent, camera)
            );
            this.manager.addAgent(agent);
            //Shader attributes
            color[i * 3 + 0] = Math.random();
            color[i * 3 + 1] = Math.random();
            color[i * 3 + 2] = Math.random();

            variation[i] = Math.floor(Math.random() * 2);

        }

        this.activateAgents(-1);

        this.instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
        this.instancedMesh.geometry.setAttribute("instance_variation", new THREE.InstancedBufferAttribute(variation, 1));

    }

    activateAgents(input=null) {

        while (this.manager.active_agents.length != this.population) {
            //Not enough agents
            if (this.manager.active_agents.length < this.population) {

                const agent = this.manager.inactive_agents[0];

                if (input) {
                    agent.position.copy(findBestNavMeshPoint(this.manager.navMesh, this.manager.active_agents));
                } else {
                    agent.position.copy(YUKA.MathUtils.choice(this.exits));
                }
                //Create path
                const path = new Path();
                for (const point of this.manager.navMesh.findPath(agent.position, YUKA.MathUtils.choice(this.exits))) {
                    path.add(point);
                }
                //Find path behavior
                for (const behavior of agent.steering.behaviors) {

                    if (behavior instanceof YUKA.FollowPathBehavior || behavior instanceof YUKA.OnPathBehavior) {
                        behavior.path = path;

                        break;
                    }
                    
                }
                //Reset velocity and activate
                agent.velocity.set(0, 0, 0);

                // agent.smoother = null;
                agent.lookAt(path.current());
                // agent.smoother = new YUKA.Smoother(50);

                agent.setActive(true);

            }
            //Too many agents
            else if (this.manager.active_agents.length > this.population) {

                const agent = this.manager.active_agents[0];
                agent.setActive(false);

            }

        }

    }

    update(delta) {
        //Wait until it fully loads before updating
        if (this.manager.active_agents.length != 0) {

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

        }

    }

}
