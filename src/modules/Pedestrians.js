
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Agent from '../agents/pedestrians/Agent.js';
import Shader from '../agents/pedestrians/Shader.js';

import {KdTreeManager,} from '../extensions/Entities.js';
import {WallAvoidanceBehavior,} from '../extensions/Steering.js';

import {StopSign,} from '../agents/Triggers.js';

import {loadGLTF, loadTexture, rawTexture, loadNavMesh,} from '../utilities/loaders.js';
import {createConvexRegionHelper,} from '../helpers/NavMeshHelper.js'

import {MAX_AGENTS,} from '../settings.js';

// function getPointsFromMesh(mesh) {

//     mesh.updateMatrixWorld(true);

//     const points = [];

//     const pt = new THREE.Vector3();

//     mesh.geometry.attributes.position.forEach((position, i) => {
//         pt.fromBufferAttribute(position, i);
//         pt.applyMatrix4(mesh.matrixWorld);
//         points.push(pt.clone());
//     });

//     return points;
// }

function renderInstance(entity, renderComponent, camera) {
    //Geo
    renderComponent.setMatrixAt(entity.agentId, entity.worldMatrix);
    //Attributes
    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
    instance_depth.array[entity.agentId] = camera.position.clone().sub(entity.position).length();

    const instance_frame = renderComponent.geometry.getAttribute('instance_frame');
    instance_frame.array[entity.agentId] = entity.stateMachine.currentState.current_frame;

}

export default class {

    constructor(loadingManager, camera) {

        this.loadingManager = loadingManager;
        this.camera = camera;

        this.objects = new THREE.Group();
 
    }

    async init() {

        const navMesh = await loadNavMesh('models/navmesh.gltf', this.loadingManager);
        const agent_mesh = await loadGLTF('models/pictogram.gltf', this.loadingManager);
        const anim_texture = await loadTexture('VATs/animations.png', this.loadingManager);
        const alpha_texture = await loadTexture('textures/pictogramAlpha.png', this.loadingManager);
        //Helpers
        this.objects.add(createConvexRegionHelper(navMesh));

        const agent_geo = agent_mesh.geometry;
        agent_geo.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_variation', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
        
        this.entityManager = new KdTreeManager();
        this.entityManager.navMesh = navMesh;
        //Instance
        this.instancedMesh = new THREE.InstancedMesh(agent_geo, new Shader(rawTexture(anim_texture), rawTexture(alpha_texture)), MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to their individual agent
        const color = new Float32Array(MAX_AGENTS * 3);
        const variation = new Float32Array(MAX_AGENTS);
        
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent(i);
            //Steering
            const wall = new WallAvoidanceBehavior(navMesh); //TODO Remove after Path rework
            agent.steering.add(wall);

            const follow = new YUKA.FollowPathBehavior();
            agent.steering.add(follow);
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
        //TODO Obstacles
        // this.entityManager.addObstacle([
        //     new THREE.Vector2(-5, 10),
        //     new THREE.Vector2(5, 10),
        //     new THREE.Vector2(5, 25),
        //     new THREE.Vector2(-5, 25),
        // ]);

        // this.entityManager.addObstacle([
        //     new THREE.Vector2(10, 5),
        //     new THREE.Vector2(20, 5),
        //     new THREE.Vector2(20, 20),
        //     new THREE.Vector2(10, 20),
        // ]);

        // this.entityManager.addObstacle([
        //     new THREE.Vector2(-20, 20),
        //     new THREE.Vector2(-10, 20),
        //     new THREE.Vector2(-10, 5),
        //     new THREE.Vector2(-20, 5),
        // ]);
        //Stop signs
        // this.stop = new StopSign(new YUKA.RectangularTriggerRegion(new YUKA.Vector3(15, 5, 15)));
        // this.stop.position.set(-8, 0, 33);

        // this.entityManager.add(this.stop);

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
