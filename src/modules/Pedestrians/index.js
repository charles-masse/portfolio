
import * as THREE from 'three';

import * as YUKA from 'yuka';

import GUI from '../../extensions/GUI.js';
import EntityManager from '../../extensions/EntityManager.js';
import {NavMesh, Path, PolygonalTriggerRegion,} from '../../extensions/navigation.js';

import {loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

import {CrosswalkTrigger,} from './triggers.js';
import {findBestNavMeshPoint,} from './utilities.js';

import Agent from './Agent.js';
import vert_shader from './Shader.vert';
import {ArriveBehavior,} from './behaviors.js';

// import {createGraphHelper,} from '../../helpers/GraphHelper.js';
// import {createConvexRegionHelper,} from '../../helpers/NavMeshHelper.js';

const MAX_AGENTS = 250;

let accumulator = 0;

export class Pedestrians {

    constructor(stageData, camera, loadingManager) {

        this.state = 0;
        this.crosswalks = [];
        
        this.objects = new THREE.Group();
        //Spawn points
        this.exits = stageData.spawns.map((pt) => new YUKA.Vector3(...pt));
        //Entity manager
        this.manager = new EntityManager();
        this.manager.active_agents = [];
        this.manager.inactive_agents = [];
        
        this.#initialize(stageData, camera, loadingManager);
 
    }

    async #initialize(stageData, camera, loadingManager) {

        this.initialized = false;

        await this.#initUI();
        await this.#initNavMesh(stageData);
        await this.#initCrowd(stageData, camera, loadingManager);
        await this.#initCrosswalk();

        this.initialized = true;

    }

    #initUI() {

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

    #initNavMesh(stageData) {
        //Create navmesh
        const navMesh = new NavMesh();
        navMesh.mergeConvexRegions = false;

        const polygons = [stageData.navmesh.map((poly) => new YUKA.Polygon().fromContour(poly.map((pt) => new YUKA.Vector3(...pt))))];
        navMesh.fromPolygons(polygons.flat());

        this.manager.navMesh = navMesh;
        //Helpers
        // this.objects.add(createConvexRegionHelper(navMesh));
        // this.objects.add(createGraphHelper(navMesh.graph, 0.25, 0x00ff00, 0xff0000));

    }
    
    async #initCrowd(stageData, camera, loadingManager) {
        //Generate obstacle tree
        for (const obstacle of stageData.obstacles) {
            this.manager.addObstacle(obstacle.map((pt) => new THREE.Vector2(pt[0], pt[2])));
        }
        
        this.manager.buildObstacleTree();
        //Load
        const agent_mesh = await loadGLTF('Pedestrians/pictogram.gltf', loadingManager);
        const anim_texture = await loadTexture('Pedestrians/VAT.png', loadingManager);
        const alpha_texture = await loadTexture('Pedestrians/alpha.png', loadingManager);

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
            const arrive = new ArriveBehavior();
            agent.steering.add(arrive);

            const followPath = new YUKA.FollowPathBehavior();
            agent.steering.add(followPath);
            //Render
            agent.setRenderComponent(
                this.instancedMesh,
                (entity, renderComponent) => {
                    //Geo
                    renderComponent.setMatrixAt(entity.id, entity.worldMatrix);
                    //Attributes
                    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
                    instance_depth.array[entity.id] = camera.position.clone().sub(entity.position).length();

                    const instance_frame = renderComponent.geometry.getAttribute('instance_frame');
                    instance_frame.array[entity.id] = entity.stateMachine.currentState.current_frame;
                }
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

    #initCrosswalk() {
        //TODO load from JSON
        const NWCross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(-7, 0, 25),
            new YUKA.Vector3(-6.5, 0, 26.5),
            new YUKA.Vector3(-4, 0, 28),
            new YUKA.Vector3(-2.75, 0, 27.5)
        ]));
        NWCross.forward = new YUKA.Vector3(0.58124, 0, -0.81373);
        this.manager.add(NWCross);
        this.crosswalks.push(NWCross);

        const NECross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(3.25, 0, 26.75),
            new YUKA.Vector3(6, 0, 27.75),
            new YUKA.Vector3(8.75, 0, 26),
            new YUKA.Vector3(9.5, 0, 24)
        ]));
        NECross.forward = new YUKA.Vector3(-0.44721, 0, -0.89443);
        this.manager.add(NECross);
        this.crosswalks.push(NECross);

        const SWCross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(-11, 0, 35.25),
            new YUKA.Vector3(-13, 0, 35.25),
            new YUKA.Vector3(-9.5, 0, 42.5),
            new YUKA.Vector3(-9, 0, 38.5)
        ]));
        SWCross.forward = new YUKA.Vector3(-0.53, 0, 0.848);
        this.manager.add(SWCross);
        this.crosswalks.push(SWCross);

        const SECross = new CrosswalkTrigger(new PolygonalTriggerRegion([
            new YUKA.Vector3(13, 0, 35.25),
            new YUKA.Vector3(11, 0, 39),
            new YUKA.Vector3(12.5, 0, 42.25),
            new YUKA.Vector3(15, 0, 37)
        ]));
        SECross.forward = new YUKA.Vector3(0.44721, 0, 0.89443);
        this.manager.add(SECross);
        this.crosswalks.push(SECross);

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

                agent.smoother = null;
                agent.lookAt(path.current());
                agent.smoother = new YUKA.Smoother(25);

                agent.setActive(true);

            }
            //Too many agents
            else if (this.manager.active_agents.length > this.population) {

                const agent = this.manager.active_agents[0];
                agent.setActive(false);

            }

        }

    }

    handleMessage(telegram) {

        if (telegram.sender === this.bridge.getModuleByName('City')) {

            this.manager.active_agents.forEach((entity) => {
                this.manager.sendMessage(telegram.sender, entity, telegram.message, telegram.delay, telegram.data);
            });

        }

    }

    update(delta) {
        //Wait until it fully loads before updating
        if (this.initialized) {

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
        //Traffic lights
        //TODO
        accumulator += delta;

        if (accumulator >= 15) {

            this.state++;
            accumulator = accumulator % 15;
        
        }

        this.state = this.state % 2;

        if (this.crosswalks.length && this.state === 0) {

            this.crosswalks[0].enabled = true;
            this.crosswalks[1].enabled = false;
            this.crosswalks[2].enabled = true;
            this.crosswalks[3].enabled = false;

        } else if (this.crosswalks.length && this.state === 1) {

            this.crosswalks[0].enabled = false;
            this.crosswalks[1].enabled = true;
            this.crosswalks[2].enabled = false;
            this.crosswalks[3].enabled = true;

        }
        //Sending message to cars
        const cars = this.bridge.getModuleByName('Cars');

        this.manager.sendMessage(this, cars, 'Traffic lights', 0, this.state);

    }

}
