
import * as THREE from 'three';
import * as YUKA from 'yuka';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

import {Pictogram} from '../Agents/Pictogram.js';

const MAX_AGENTS = 1000;
const CANDIDATE_NB = 7;

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

export class CrowdManager {

    constructor(scene, loadingManager) {

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
        const loader = new FBXLoader(loadingManager);
        loader.load('models/pictogram.fbx', (fbx) => {

            fbx.traverse((child) => {
                geo = child.geometry;
            });

            this.material = new THREE.ShaderMaterial({
                vertexShader: `
                    uniform float time;
                    attribute float instanceTimeOffset;

                    void main() {

                        vec3 pos = position;
                        pos.y += sin((time * 5.0) + instanceTimeOffset) * 0.5;

                        vec4 worldPosition = instanceMatrix * vec4(pos, 1.0);
                        vec4 viewPosition = viewMatrix * worldPosition;

                        gl_Position = projectionMatrix * viewPosition;

                    }
                `,
                fragmentShader: `
                    void main() {
                        //Black for now TO-DO variations
                        gl_FragColor = vec4(0, 0, 0, 1.0);

                    }
                `,
                uniforms: {
                    time: {value: 0}
                },
                side: THREE.DoubleSide,
            });
            
            const instanceTimeOffsets = new Float32Array(MAX_AGENTS);
            geo.setAttribute('instanceTimeOffset', new THREE.InstancedBufferAttribute(instanceTimeOffsets, 1));
            for (let i = 0; i < MAX_AGENTS; i++) {
                instanceTimeOffsets[i] = Math.random() * 10;
            }

            this.instanced_mesh = new THREE.InstancedMesh(geo, this.material, MAX_AGENTS);
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

            const updated_time = this.time.update();
            //Shader
            this.material.uniforms.time.value = updated_time.getElapsed();
            //Entities
            this.entity_manager.update(updated_time.getDelta());
            //Instanced
            const tempMatrix = new THREE.Matrix4();
            this.entity_manager.entities.forEach((entity, i) => {

                tempMatrix.fromArray(entity.worldMatrix.elements);
                this.instanced_mesh.setMatrixAt(i, tempMatrix);

            });
            this.instanced_mesh.instanceMatrix.needsUpdate = true;
            //UI
            document.getElementById('population').textContent = `Population: ${this.entity_manager.entities.filter(entity => entity.active).length}`;

        }

    }

}
