
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from './Agent.js';
import Shader from './Shader.js';

import {GUI,} from '../../extensions/GUI.js';
import EntityManager from '../../extensions/EntityManager.js';
import {NavMesh, Path,} from '../../extensions/Navigation.js';

import {loadJSON, loadGLTF, loadTexture, rawTexture,} from '../../utilities/loaders.js';

// import {createConvexRegionHelper,} from '../../helpers/NavMeshHelper.js';
// import {createGraphHelper,} from '../../helpers/GraphHelper.js';

import {MAX_AGENTS,} from '../../settings.js';

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

    constructor(camera, loadingManager) {

        this.manager = new EntityManager();
        this.manager.active_agents = [];
        this.manager.inactive_agents = [];

        this.objects = new THREE.Group();

        this.initUI();
        this.init(camera, loadingManager);
 
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

    async init(camera, loadingManager) {
        //Stage data loader
        const stage_data = await loadJSON('stage.json', loadingManager);
        //Create navmesh
        const navMesh = new NavMesh();
        navMesh.mergeConvexRegions = false;
        const polygons = [stage_data.navmesh.map((poly) => new YUKA.Polygon().fromContour(poly.map((pt) => new YUKA.Vector3(...pt))))];
        navMesh.fromPolygons(polygons.flat());
        this.manager.navMesh = navMesh;
        //Create Spawn points
        this.exits = stage_data.spawns.map((pt) => new YUKA.Vector3(...pt));
        //Create Triggers
        // for (const tid in stage_data.triggers) {

        //     const points = stage_data.triggers[tid].points.map((pt) => new YUKA.Vector3(...pt));
        //     const region = new PolygonalTriggerRegion(points);
        //     this.manager.add(new StopSign(region));

        // }
        //Create Obstacles
        for (const oid in stage_data.obstacles) {
            this.manager.addObstacle(stage_data.obstacles[oid].map((pt) => new THREE.Vector2(pt[0], pt[2])));
        }
        //Helpers
        //TODO Make a custom helper
        // this.objects.add(createConvexRegionHelper(navMesh));
        // this.objects.add(createGraphHelper(navMesh.graph, 0.5, 0x00ff00, 0xff0000));
        //Load
        const agent_mesh = await loadGLTF('models/pictogram.gltf', loadingManager);
        //Custom attributes
        const agent_geo = agent_mesh.geometry;
        agent_geo.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_variation', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        const anim_texture = await loadTexture('VATs/animations.png', loadingManager);
        const alpha_texture = await loadTexture('textures/pictogramAlpha.png', loadingManager);
        //Pedestrian instance
        this.instancedMesh = new THREE.InstancedMesh(agent_geo, new Shader(rawTexture(anim_texture), rawTexture(alpha_texture)), MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        
        const color = new Float32Array(MAX_AGENTS * 3);
        const variation = new Float32Array(MAX_AGENTS);
        
        for (let i = 0; i < MAX_AGENTS; i++) {
            //Link each instance to their individual agent
            const agent = new Agent(i);
            this.manager.inactive_agents.push(agent);
            //Steering
            const follow = new YUKA.FollowPathBehavior();
            follow.nextWaypointDistance = 0.8;
            agent.steering.add(follow);
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

    bestCandidate() {

        let best;
        let maxDist = -Infinity;

        for (let i = 0; i < 10; i++) {

            const pos = this.manager.navMesh.randomPoint();
            const minDist = Math.min(...this.manager.active_agents.map((entity) => pos.distanceTo(entity.position)));

            if (minDist > maxDist) {
                maxDist = minDist;
                best = pos;
            }

        }

        return best;
    }

    activateAgents(input=null) {

        while (this.manager.active_agents.length != this.population) {
            //Not enough agents
            if (this.manager.active_agents.length < this.population) {

                const id = this.manager.inactive_agents.length - 1;
                const agent = this.manager.inactive_agents[id];

                if (input) {
                    agent.position.copy(this.bestCandidate());
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

                    if (behavior instanceof YUKA.FollowPathBehavior) {
                        behavior.path = path;

                        break;
                    }
                    
                }

                agent.setActive(true);

            }
            //Too many agents
            else if (this.manager.active_agents.length > this.population) {
                //Pick random agent
                const random_id = Math.floor(Math.random() * this.manager.active_agents.length);
                const agent = this.manager.active_agents[random_id];

                agent.setActive(false);

            }

        }

    }

    update(time) {
        //Wait until it fully loads before updating
        if (this.manager.entities.length) {

            this.activateAgents();

            this.manager.update(time.getDelta());
            //Update instances and its attributes
            this.instancedMesh.instanceMatrix.needsUpdate = true;

            const attributes = this.instancedMesh.geometry.attributes;

            for (const name in attributes) {
                if (name.startsWith('instance')) {
                    attributes[name].needsUpdate = true;
                }
            }

        }

    }

}
