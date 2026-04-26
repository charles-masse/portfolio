
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from '../agents/pedestrians/Agent.js';
import Shader from '../agents/pedestrians/Shader.js';

import {NavMesh,} from '../extensions/Navigation.js';
import {KdTreeManager,} from '../extensions/Entities.js';
import {PolygonalTriggerRegion,} from '../extensions/Triggers.js';
import {FollowPathBehavior,} from '../extensions/Steering.js';

import {StopSign,} from '../agents/Triggers.js';

import {loadJSON, loadGLTF, loadTexture, rawTexture,} from '../utilities/loaders.js';
import {createConvexRegionHelper,} from '../helpers/NavMeshHelper.js';

import {MAX_AGENTS,} from '../settings.js';

function renderInstance(entity, renderComponent, camera) {
    //Geo
    renderComponent.setMatrixAt(entity.id, entity.worldMatrix);
    //Attributes
    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
    instance_depth.array[entity.id] = camera.position.clone().sub(entity.position).length();

    const instance_frame = renderComponent.geometry.getAttribute('instance_frame');
    instance_frame.array[entity.id] = entity.stateMachine.currentState.current_frame;

}

export default class {

    constructor(loadingManager, camera) {

        this.loadingManager = loadingManager;
        this.camera = camera;

        this.objects = new THREE.Group();
 
    }

    async init() {

        this.entityManager = new KdTreeManager();
        //Stage data loader
        const stage_data = await loadJSON('stage.json', this.loadingManager);
        //Create navmesh
        const navMesh = new NavMesh();
        navMesh.mergeConvexRegions = false;
        const polygons = [stage_data.navmesh.map((poly) => new YUKA.Polygon().fromContour(poly.map((pt) => new YUKA.Vector3(...pt))))];
        navMesh.fromPolygons(polygons.flat());
        this.entityManager.navMesh = navMesh;
        //Create Spawn points
        //TODO
        //Create Triggers
        for (const tid in stage_data.triggers) {

            const points = stage_data.triggers[tid].points.map((pt) => new YUKA.Vector3(...pt));
            const region = new PolygonalTriggerRegion(points);
            this.entityManager.add(new StopSign(region));

        }
        //Create Obstacles
        for (const oid in stage_data.obstacles) {
            this.entityManager.addObstacle(stage_data.obstacles[oid].map((pt) => new THREE.Vector2(pt[0], pt[2])));
        }
        //Helpers
        this.objects.add(createConvexRegionHelper(navMesh));
        //Pedestrian mesh
        const agent_mesh = await loadGLTF('models/pictogram.gltf', this.loadingManager);
        const anim_texture = await loadTexture('VATs/animations.png', this.loadingManager);
        const alpha_texture = await loadTexture('textures/pictogramAlpha.png', this.loadingManager);
        //Custom attributes
        const agent_geo = agent_mesh.geometry;
        agent_geo.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_variation', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        //Pedestrian instance
        this.instancedMesh = new THREE.InstancedMesh(agent_geo, new Shader(rawTexture(anim_texture), rawTexture(alpha_texture)), MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        
        const color = new Float32Array(MAX_AGENTS * 3);
        const variation = new Float32Array(MAX_AGENTS);
        
        for (let i = 0; i < MAX_AGENTS; i++) {
            //Link each instance to their individual agent
            const agent = new Agent(i);
            //Steering
            const follow = new FollowPathBehavior();
            follow.nextWaypointDistance = 0.5;
            agent.steering.add(follow);

            const onPath = new YUKA.OnPathBehavior();
            onPath.radius = 0.05;
            onPath.predictionFactor = 0.5;
            agent.steering.add(onPath);
            //Render
            agent.setRenderComponent(
                this.instancedMesh,
                (entity, renderComponent) => renderInstance(entity, renderComponent, this.camera)
            );
            this.entityManager.addAgent(agent);
            //Shader attributes
            color[i * 3 + 0] = Math.random();
            color[i * 3 + 1] = Math.random();
            color[i * 3 + 2] = Math.random();

            variation[i] = Math.floor(Math.random() * 2);

        }

        this.instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
        this.instancedMesh.geometry.setAttribute("instance_variation", new THREE.InstancedBufferAttribute(variation, 1));

        return this;
    }

    update(time) {

        this.entityManager.update(time.getDelta());
        //Update instances
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        //Update attributes
        const attributes = this.instancedMesh.geometry.attributes;
        for (const name in attributes) {

            if (name.startsWith('instance')) {
                attributes[name].needsUpdate = true;
            }
            
        }

    }

}
