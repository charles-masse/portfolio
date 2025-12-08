
import * as THREE from 'three';

import * as YUKA from 'yuka';

import NavMesh from '../modules/NavMesh.js';
import {Pictogram_agent, Pictogram_geo, Pictogram_shader} from '../Agents/Pictogram.js';

const MAX_AGENTS = 250;
const CANDIDATE_NB = 7;

export function bestCandidate(current_positions, navMesh) {

    let best;
    let maxDist = -Infinity;
    for (let i = 0; i < CANDIDATE_NB; i++) {

        const {x, y} = navMesh.randomPoint();

        const pos = new YUKA.Vector3(x, 0, y);
        const minDist = Math.min(...current_positions.map(p => pos.distanceTo(p)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

export default class {

    constructor(scene, loadingManager) {

        this.scene = scene;

        this.time = new YUKA.Time();
        this.entity_manager = new YUKA.EntityManager();
        //UI
        this.slider = document.getElementById('mySlider');
        this.slider.max = MAX_AGENTS;
        this.slider.value = Math.round(MAX_AGENTS / 2);
        this.slider.addEventListener('input', () => {this.updateAgentNumber(this.slider.value)});

        // const from = new YUKA.Vector3(0, 0, -10);
        // const to = new YUKA.Vector3(-20, 0, 10);

        // const path = navMesh.findPath(from, to);
        // pathHelper.geometry = new THREE.BufferGeometry().setFromPoints(path);

        // const pathMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        // const pathHelper = new THREE.Line(new THREE.BufferGeometry(), pathMaterial);
        // scene.add(pathHelper);
        
        this.init();

    }

    async init() {

        this.navMesh = new NavMesh(this.scene);
        await this.navMesh.load();

        const geo = await Pictogram_geo;
        const shader = await Pictogram_shader;
        //Instance attributes
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instanced_mesh = new THREE.InstancedMesh(geo, shader, MAX_AGENTS);
        this.scene.add(this.instanced_mesh);
        //Link each instance to individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {
            this.entity_manager.add(new Pictogram_agent());
        }

        this.updateAgentNumber(this.slider.value);

    }

    async updateAgentNumber(nb) {

        let active_agents = this.entity_manager.entities.filter(agent => agent.active);
        while (active_agents.length != nb) {

            if (active_agents.length < nb) {

                this.entity_manager.entities[active_agents.length].setActive(true);

                const positions = this.entity_manager.entities.map(agent => agent.position);
                const spawn_position = bestCandidate(positions, this.navMesh);
                this.entity_manager.entities[active_agents.length].setPosition(spawn_position);

            } else {

                this.entity_manager.entities[active_agents.length - 1].setActive(false);

            }

            active_agents = this.entity_manager.entities.filter(agent => agent.active);

        }

        document.getElementById('population').textContent = `Population: ${this.entity_manager.entities.filter(entity => entity.active).length}`;

    }

    update() {

        if (this.instanced_mesh) {

            const updated_time = this.time.update();

            this.entity_manager.update(updated_time.getDelta());
            //Update instances position
            const tempMatrix = new THREE.Matrix4();
            this.entity_manager.entities.forEach((entity, i) => {

                tempMatrix.fromArray(entity.worldMatrix.elements);
                this.instanced_mesh.setMatrixAt(i, tempMatrix);

            });

            this.instanced_mesh.instanceMatrix.needsUpdate = true;
            //Update Shader attributes
            const instance_frame_attribute = this.instanced_mesh.geometry.getAttribute('instance_frame');
            const instance_frame_array = instance_frame_attribute.array;

            for (let i = 0; i < MAX_AGENTS; i++) {
                instance_frame_array[i] = Math.round(updated_time.getElapsed() * 24);
            }

            instance_frame_attribute.needsUpdate = true;

        }

    }

}
