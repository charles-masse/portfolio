
import * as THREE from 'three';
import * as YUKA from 'yuka';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

import {Agent} from '../superClasses/Agent.js';
import {Walk} from '../stateMachines/Pictogram.js';

const MAX_AGENTS = 1000;
const CANDIDATE_NB = 5;

class Pictogram extends Agent {

    constructor() {
        super();
        //State Machine
        this.currentTime = 0;
        this.stateDuration = 5;
        this.crossFadeDuration = 1;

        this.stateMachine = new YUKA.StateMachine(this);

        this.stateMachine.add('WALK', new Walk());
        //Animations
        // const animations = model.animations;
        // this.mixer = new THREE.AnimationMixer(model);

        // const actions = {};
        // animations.forEach((clip) => {
        //     actions[clip.name] = this.mixer.clipAction(clip);
        // });

        // actions['Take 001'].play();
        //Path
        const path = new YUKA.Path();
        path.add(new YUKA.Vector3(0, 0, 0));
        path.add(new YUKA.Vector3(50, 0, 30));
        path.add(new YUKA.Vector3(50, 0, -30));
        path.add(new YUKA.Vector3(0, 0, -30));
        path.loop = true;
        //Behaviors
        const followPathBehavior = new YUKA.FollowPathBehavior(path);
        this.vehicle.steering.add(followPathBehavior);
        // const onPathBehavior = new YUKA.OnPathBehavior(path);
        // this.vehicle.steering.add(onPathBehavior);

    }

}

export class CrowdManager {

    constructor(scene) {

        this.scene = scene;

        this.time = new YUKA.Time();
        this.entity_manager = new YUKA.EntityManager();
        //UI
        const slider = document.getElementById('mySlider');
        slider.max = MAX_AGENTS;
        slider.value = Math.round(MAX_AGENTS / 2);
        slider.addEventListener('input', () => {this.updateAgents(slider.value)});
        //Spawn zone
        const polygon = [
            new THREE.Vector2(0, 10),
            new THREE.Vector2(75, 15),
            new THREE.Vector2(50, -20),
            new THREE.Vector2(0, -5)
        ];
        this.triangulated_spawn = triangulate(polygon);
        //Create instanced geo
        let geo;
        const loader = new FBXLoader();
        loader.load('models/pictogram.fbx', (fbx) => {

            fbx.traverse((child) => {
                geo = child.geometry;
            });

            const material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
            });

            this.instanced_mesh = new THREE.InstancedMesh(geo, material, MAX_AGENTS);
            this.scene.add(this.instanced_mesh);
            //Link each instance to individual agents
            for (let i = 0; i < MAX_AGENTS; i++) {
                this.entity_manager.add(new Pictogram());
            }
            //Activate default number of agents
            this.updateAgents(slider.value);

        });

    }

    updateAgents(nb) {

        let active_agents = this.entity_manager.entities.filter(agent => agent.active);
        while (active_agents.length != nb) {

            if (active_agents.length < nb) {

                const positions = this.entity_manager.entities.map(agent => agent.position);
                const spawn_position = bestCandidate(positions, this.triangulated_spawn);

                this.entity_manager.entities[active_agents.length].setActive(true);
                this.entity_manager.entities[active_agents.length].setPosition(spawn_position);

            } else {

                this.entity_manager.entities[active_agents.length - 1].setActive(false);

            }

            active_agents = this.entity_manager.entities.filter(agent => agent.active);

        }

    }

    update() {

        this.entity_manager.update(this.time.update().getDelta());

        if (this.instanced_mesh) {

            const tempMatrix = new THREE.Matrix4();
            this.entity_manager.entities.forEach((entity, i) => {

                tempMatrix.fromArray(entity.worldMatrix.elements);
                this.instanced_mesh.setMatrixAt(i, tempMatrix);

            });

            this.instanced_mesh.instanceMatrix.needsUpdate = true;
            
            document.getElementById('population').textContent = `Population: ${this.entity_manager.entities.filter(entity => entity.active).length}`;

        }

    }

}

function triangulate(polygon) {

    const triangles = THREE.ShapeUtils.triangulateShape(polygon, []);
    return triangles.map(pt => pt.map(i => polygon[i]));
}

function bestCandidate(current_positions, triangulated_zone) {

    let best;
    let maxDist = -Infinity;
    for (let i = 0; i < CANDIDATE_NB; i++) {

        const {x, y} = randomPointInTriangles(triangulated_zone);

        const pos = new YUKA.Vector3(x, 0, y);
        const minDist = Math.min(...current_positions.map(p => pos.distanceTo(p)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

function randomPointInTriangles(triangles) {

    const triangle = triangles[THREE.MathUtils.randInt(0, triangles.length - 1)]; 

    let r1 = Math.random();
    let r2 = Math.random();

    if (r1 + r2 > 1) {r1 = 1 - r1; r2 = 1 - r2;};

    return {
        x: triangle[0].x + r1 * (triangle[1].x - triangle[0].x) + r2 * (triangle[2].x - triangle[0].x),
        y: triangle[0].y + r1 * (triangle[1].y - triangle[0].y) + r2 * (triangle[2].y - triangle[0].y)
    };
}

//     // if (debug) {

//     //     const position = [];

//     //     for (let i = 0; i < path._waypoints.length; i ++) {

//     //         const waypoint = path._waypoints[i];
//     //         position.push(waypoint.x, waypoint.y, waypoint.z);


//     //     }

//     //     const lineGeometry = new THREE.BufferGeometry();
//     //     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
//     //     const lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
//     //     const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
//     //     this.scene.add(lines);

//     // }