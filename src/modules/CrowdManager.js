
import * as THREE from 'three';
import * as YUKA from 'yuka';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

import {Agent} from '../superClasses/Agent.js';
import {Walk} from '../stateMachines/Pictogram.js';

const MAX_AGENTS = 1000;
const CANDIDATE_NB = 7;

class Pictogram extends Agent {

    constructor() {
        super();
        //State Machine
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add('walk', new Walk());
        //Path [TO-DO] find nearest waypoint and set the path direction per agent based on global path
        const path = new YUKA.Path();
        path.add(new YUKA.Vector3(0, 0, 0));
        path.add(new YUKA.Vector3(50, 0, 30));
        path.add(new YUKA.Vector3(50, 0, -30));
        path.add(new YUKA.Vector3(0, 0, -30));
        path.loop = true; //At end of line, deactivate agent (.finished())
        for (let i = 0; i < THREE.MathUtils.randInt(0, 3); i++) path.advance();

        // if (debug) {

        //     const position = [];
        //     for (let i = 0; i < path._waypoints.length; i ++) {

        //         const waypoint = path._waypoints[i];
        //         position.push(waypoint.x, waypoint.y, waypoint.z);

        //     }

        //     const lineGeometry = new THREE.BufferGeometry();
        //     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
        //     const lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        //     const lines = new THREE.LineLoop(lineGeometry, lineMaterial);

        //     this.scene.add(lines);

        // }
        //Behaviors
        const followPathBehavior = new YUKA.FollowPathBehavior(path, THREE.MathUtils.randInt(1, 10));
        this.vehicle.steering.add(followPathBehavior);

    }

    update(delta) {
        super.update(delta);
        this.stateMachine.update();
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
        //Spawn Zone
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

            this.material = new THREE.ShaderMaterial({
                vertexShader: `
                    attribute vec3 instanceOffset;
                    attribute float instanceTimeOffset;
                    uniform float time;

                    void main() {
                        vec3 pos = position + instanceOffset;
                        pos.y += sin(time + instanceTimeOffset);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    void main() {
                        gl_FragColor = vec4(0, 0, 0, 1.0);
                    }
                `,
                uniforms: {
                    time: { value: 0 }
                }
            });

            const instanceOffsets = new Float32Array(MAX_AGENTS * 3);
            geo.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(instanceOffsets, 3));
            const instanceTimeOffsets = new Float32Array(MAX_AGENTS);
            geo.setAttribute('instanceTimeOffset', new THREE.InstancedBufferAttribute(instanceTimeOffsets, 1));

            this.instanced_mesh = new THREE.InstancedMesh(geo, this.material, MAX_AGENTS);

            for (let i = 0; i < MAX_AGENTS; i++) {
                instanceOffsets.set([Math.random() * 100, 0, Math.random() * 20], i * 3);
                instanceTimeOffsets[i] = Math.random() * 10;
            }

            this.scene.add(this.instanced_mesh);
            //Link each instance to individual agents and active the right amount
            for (let i = 0; i < MAX_AGENTS; i++) this.entity_manager.add(new Pictogram());
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


        if (this.instanced_mesh) {

            this.material.uniforms.time.value = performance.now() * 0.001;

            this.entity_manager.update(this.time.update().getDelta());
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

        const {x, y} = randomPointInTriangulated(triangulated_zone);

        const pos = new YUKA.Vector3(x, 0, y);
        const minDist = Math.min(...current_positions.map(p => pos.distanceTo(p)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

function randomPointInTriangulated(triangles) {
    //Get random triangle
    const triangle = triangles[THREE.MathUtils.randInt(0, triangles.length - 1)]; 

    let r1 = Math.random();
    let r2 = Math.random();
    if (r1 + r2 > 1) {r1 = 1 - r1; r2 = 1 - r2;};

    return {
        x: triangle[0].x + r1 * (triangle[1].x - triangle[0].x) + r2 * (triangle[2].x - triangle[0].x),
        y: triangle[0].y + r1 * (triangle[1].y - triangle[0].y) + r2 * (triangle[2].y - triangle[0].y)
    };
}
