
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {Agent} from '../customs/Agent.js';

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

    constructor(agent_geo, agent_shader, navMesh, entityManager) {

        this.navMesh = navMesh;
        this.entityManager = entityManager;
        //Instance attributes
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instancedMesh = new THREE.InstancedMesh(agent_geo, agent_shader, MAX_AGENTS);
        //Link each instance to individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {
            this.entityManager.add(new Agent());
        }

        /*this.updateAgentNumber(this.slider.value);*/
        this.updateAgentNumber(10);

        this.objects = new THREE.Group();
        this.objects.add(this.instancedMesh);

    }

    async updateAgentNumber(nb) {

        let active_agents = this.entityManager.entities.filter(agent => agent.active);
        while (active_agents.length != nb) {

            if (active_agents.length < nb) {

                this.entityManager.entities[active_agents.length].setActive(true);

                const positions = this.entityManager.entities.map(agent => agent.position);
                const spawn_position = bestCandidate(positions, this.navMesh);
                this.entityManager.entities[active_agents.length].position.copy(spawn_position);

            } else {

                this.entityManager.entities[active_agents.length - 1].setActive(false);

            }

            active_agents = this.entityManager.entities.filter(agent => agent.active);

        }

        // document.getElementById('population').textContent = `Population: ${this.entityManager.entities.filter(entity => entity.active).length}`;

    }

    update(time) {

        if (this.instancedMesh) {
            //Update instances' position
            this.entityManager.entities.forEach((entity, i) => {
                this.instancedMesh.setMatrixAt(i, entity.worldMatrix);
            });
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            //Update Shader attribute
            const instance_frame_attribute = this.instancedMesh.geometry.getAttribute('instance_frame');
            const instance_frame_array = instance_frame_attribute.array;

            for (let i = 0; i < MAX_AGENTS; i++) {
                instance_frame_array[i] = Math.round(time * 24); //Time in frames
            }
            instance_frame_attribute.needsUpdate = true;

        }

    }

}
