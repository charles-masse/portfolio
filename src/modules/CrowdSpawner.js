
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {GUI} from '../customs/GUI.js';
import {Agent} from '../customs/RVO2.js';

const MAX_AGENTS = 250;
const CANDIDATE_NB = 7;

function bestCandidate(current_positions, navMesh) {

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
        //Objects for scene
        this.objects = new THREE.Group()
        //Instance attributes
        this.instanceTimeOffsets = new Float32Array(MAX_AGENTS);
        agent_geo.setAttribute('instance_frame', new THREE.InstancedBufferAttribute(this.instanceTimeOffsets, 1));

        this.instancedMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 3) /*agent_geo*/, new THREE.MeshBasicMaterial({color: 0x000000}) /*agent_shader*/, MAX_AGENTS);
        //Link each instance to individual agent
        for (let i = 0; i < MAX_AGENTS; i++) {
            this.entityManager.addAgent(new Agent(this.navMesh));
        }
        this.objects.add(this.instancedMesh);
        //Obstacles
        const geometry = new THREE.BoxGeometry(10, 1, 10);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000});
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(15, 0, 15);
        // getPointsFromMesh(cube); //TO-DO
        this.objects.add(cube)

        this.entityManager.addObstacle([new THREE.Vector2(10, 10), new THREE.Vector2(20, 10), new THREE.Vector2(20, 20), new THREE.Vector2(10, 20)]);
        //UI
        const gui = new GUI({title:'Crowd Spawner'});
        gui.domElement.style.position = 'static';

        const settings = {Population: MAX_AGENTS / 2.0};
        this.populationController = gui.add(settings, 'Population', 1, MAX_AGENTS, 1).onChange( value => {
            this.updateAgentAmount(value);
        });

        document.getElementById('gui-container').appendChild(gui.domElement);

        this.updateAgentAmount(settings.Population);

    }

    updateAgentAmount(nb) {

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

    }

    update(time) {

        if (this.instancedMesh) {
            //Update instances' position
            this.entityManager.entities.forEach((entity, i) => {
                this.instancedMesh.setMatrixAt(i, entity.worldMatrix);
            });
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            // //Update Shader attribute
            // const instance_frame_attribute = this.instancedMesh.geometry.getAttribute('instance_frame');
            // const instance_frame_array = instance_frame_attribute.array;

            // for (let i = 0; i < MAX_AGENTS; i++) {
            //     instance_frame_array[i] = Math.round(time * 24); //Time in frames
            // }
            // instance_frame_attribute.needsUpdate = true;

        }

    }

}
