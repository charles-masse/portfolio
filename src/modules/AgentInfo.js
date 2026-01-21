
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {GUI} from '../customs/GUI.js';

export default class {

    constructor(entityManager) {

        this.entities = entityManager.entities;

        this.selected_agent = null;
        //UI
        this.gui = new GUI({title: 'Agent Info'});
        this.gui.domElement.style.position = 'static';
        document.getElementById('gui-container').appendChild(this.gui.domElement);

        const controller_values = {
            id: 0,
            'Pos x': 0,
            'Pos y': 0,
            'Pos z': 0,
            'Rot x': 0,
            'Rot y': 0,
            'Rot z': 0,
            'Rot w': 0,
            Variation:'skirt',
            Distance:[],
            Result:[]
        };

        this.gui.addText(' Click on an Agent for more info.')

        this.id = this.gui.add(controller_values, 'id').disable().hide();

        const pos = this.gui.addFolder('Position').close().hide();
        this.posX = pos.add(controller_values, 'Pos x').disable();
        this.posY = pos.add(controller_values, 'Pos y').disable();
        this.posZ = pos.add(controller_values, 'Pos z').disable();

        const rot = this.gui.addFolder('Rotation').close().hide();
        this.rotX = rot.add(controller_values, 'Rot x').disable();
        this.rotY = rot.add(controller_values, 'Rot y').disable();
        this.rotZ = rot.add(controller_values, 'Rot z').disable();
        this.rotW = rot.add(controller_values, 'Rot w').disable();

        this.gui.add(controller_values, 'Variation', ['pants', 'skirt', 'tie']).hide();

        // const fuzzy = this.gui.addFolder('Cohesion').hide();

        // const flvs = this.entities[0].steering.behaviors[0].fuzzy.flvs;
        // this.facingAngle = fuzzy.addFuzzy(controller_values, '[In] facing angle', flvs.get('facingAngle'), -180, 180).disable();
        // this.result = fuzzy.addFuzzy(controller_values, 'Weight [Out]', flvs.get('weight')).disable();
        //For scene objects
        this.objects = new THREE.Group();

    }

    selectAgent(point) {

        let nearest = null;
        let min_distance = Infinity;

        for (let i = 0; i < this.entities.length; i++) {

            const distance = this.entities[i].position.squaredDistanceTo(point);
            if (distance < min_distance) {

                min_distance = distance;
                nearest = i;

            }

        }

        if (this.selected_agent != nearest) {
            this.selected_agent = nearest;

        } else {
            this.selected_agent = null;
        }
        
        this.id.setValue(nearest);
        this.showInfo();

    }

    showInfo() {

        const constrollers = this.gui.children;

        if (this.selected_agent) {

            constrollers[0].hide();
            for (let i = 1; i < constrollers.length; i++) constrollers[i].show();

        } else {

            constrollers[0].show();
            for (let i = 1; i < constrollers.length; i++) constrollers[i].hide();

        }

    }

    update(time) {
        //TODO--Cheat for now, but has a hit on the framerate
        this.objects.traverse(child => {

            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                child.material.dispose();
            }
            
        });

        this.objects.clear()

        if (this.selected_agent) {

            const agent = this.entities[this.selected_agent];
            const pos = agent.position;

            if (agent.steering.behaviors[0].hit) {

                const material = new THREE.LineBasicMaterial({color: 0xff0000});
                const geometry = new THREE.BufferGeometry().setFromPoints([new YUKA.Vector3(0, 0.1, 0).add(pos), new YUKA.Vector3(0, 0.1, 0).addVectors(pos, agent.steering.behaviors[0].force)]);
                const line = new THREE.Line(geometry, material);

                this.objects.add(line);

            }
            //Update UI
            this.posX.setValue(agent.position.x.toFixed(4));
            this.posY.setValue(agent.position.y.toFixed(4));
            this.posZ.setValue(agent.position.z.toFixed(4));

            this.rotX.setValue(agent.rotation.x.toFixed(4));
            this.rotY.setValue(agent.rotation.y.toFixed(4));
            this.rotZ.setValue(agent.rotation.z.toFixed(4));
            this.rotW.setValue(agent.rotation.w.toFixed(4));

            // this.facingAngle.setValue(agent.steering.behaviors[0].facingAngle);
            // this.result.setValue(agent.steering.behaviors[0]._separation.outputs);

        }

    }
        
}
