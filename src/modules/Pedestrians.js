
import * as THREE from 'three';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

import * as YUKA from 'yuka';

import {NavMeshLoader,} from '../extensions/NavMesh.js'
import {WallAvoidanceBehavior,} from '../extensions/Steering.js';

import Agent from '../agents/pedestrians/Agent.js';
import AgentManager from '../agents/pedestrians/AgentManager.js';
import Shader from '../agents/pedestrians/Shader.js'

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
//Loaders
async function loadGeo(loadingManager) {

    const geo = new Promise((resolve) => {

        new GLTFLoader(loadingManager).load('models/pictogram.gltf', (gltf) => {

            let mesh = null;

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    mesh = child;
                }
            });

            const geo = mesh.geometry;
            
            geo.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            
            // geo.setAttribute('length', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            // geo.setAttribute('origin', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            // geo.setAttribute('amplitude', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            // geo.setAttribute('textureStart', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));

            resolve(geo);

        });

    });

    return geo;
}

async function loadTexture(loadingManager) {

    const loader = new THREE.TextureLoader(loadingManager);
    const texture = loader.loadAsync('VATs/animations.png');

    return texture;
}

async function loadNavMesh(loadingManager) {

    const navMesh = new Promise((resolve) => {
        new NavMeshLoader(loadingManager).load('models/navmesh.gltf').then((gltf) => {resolve(gltf)});
    });

    return navMesh;
}
//Render
function renderInstance(agent, renderComponent) {
    //Geo
    renderComponent.setMatrixAt(agent.agentId, agent.worldMatrix);
    //Attributes
    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
    instance_depth.array[agent.agentId] = new YUKA.Vector3(0, 20, 30).sub(agent.position).length(); //TO DO

    const instance_frame = renderComponent.geometry.getAttribute('instance_frame');
    instance_frame.array[agent.agentId] = agent.stateMachine.currentState.current_frame;

}

export default class {

    constructor(loadingManager) {

        this.loadingManager = loadingManager;

        this.objects = new THREE.Group();
 
    }

    async init() {

        const navMesh = await loadNavMesh(this.loadingManager);
        // this.objects.add(createConvexRegionHelper(navMesh));

        this.entityManager = new AgentManager();
        this.entityManager.navMesh = navMesh;
        //Loaders
        const geo = await loadGeo(this.loadingManager);
        const texture = await loadTexture(this.loadingManager);
        //Instance
        this.instancedMesh = new THREE.InstancedMesh(geo, new Shader(texture), MAX_AGENTS);
        this.objects.add(this.instancedMesh);
        //Link each instance to their individual agent
        const color = new Float32Array(MAX_AGENTS * 3);
        
        for (let i = 0; i < MAX_AGENTS; i++) {

            const agent = new Agent(i);
            //Steering
            const wall = new WallAvoidanceBehavior(navMesh); //Might not need, have the pathfinder return center of regions instead
            agent.steering.add(wall);

            const follow = new YUKA.FollowPathBehavior();
            agent.steering.add(follow);

            agent.setRenderComponent(this.instancedMesh, renderInstance);
            this.entityManager.addAgent(agent);

            color[i * 3 + 0] = Math.random();
            color[i * 3 + 1] = Math.random();
            color[i * 3 + 2] = Math.random();

        }

        this.instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
        this.instancedMesh.acti
        //Obstacles TODO
        this.entityManager.addObstacle([
            new THREE.Vector2(-5, 10),
            new THREE.Vector2(5, 10),
            new THREE.Vector2(5, 25),
            new THREE.Vector2(-5, 25),
        ]);

        this.entityManager.addObstacle([
            new THREE.Vector2(10, 5),
            new THREE.Vector2(20, 5),
            new THREE.Vector2(20, 20),
            new THREE.Vector2(10, 20),
        ]);

        this.entityManager.addObstacle([
            new THREE.Vector2(-20, 20),
            new THREE.Vector2(-10, 20),
            new THREE.Vector2(-10, 5),
            new THREE.Vector2(-20, 5),
        ]);

        return this;
    }

    update(time) {

        this.entityManager.update(time.getDelta());
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;

        const attributes = this.instancedMesh.geometry.attributes;
        for (const name in attributes) {

            if (name.startsWith('instance')) {
                attributes[name].needsUpdate = true;
            }
            
        }

    }

}
