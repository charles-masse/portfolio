
import * as THREE from 'three';

import {customGUI, FuzzyController} from '../customs/GUI.js';

export default class {

    constructor(entityManager) {

        this.selected_agent = entityManager.entities[0];

        this.container = document.getElementById('gui-container');

        const gui = new customGUI({title: 'Agent Info'});
        gui.domElement.style.position = 'static';
        this.container.appendChild(gui.domElement);

        const controller_values = {id: 0, 'Pos x': 0, 'Pos y': 0, 'Pos z': 0, 'Rot x': 0, 'Rot y': 0, 'Rot z': 0, Variation:'skirt', Distance:[], Result:[]};

        gui.add(controller_values, 'id').disable();

        const pos = gui.addFolder('Position').close();
        this.posX = pos.add(controller_values, 'Pos x').disable();
        this.posY = pos.add(controller_values, 'Pos y').disable();
        this.posZ = pos.add(controller_values, 'Pos z').disable();

        const rot = gui.addFolder('Rotation').close();
        this.rotX = rot.add(controller_values, 'Rot x').disable();
        this.rotY = rot.add(controller_values, 'Rot y').disable();
        this.rotZ = rot.add(controller_values, 'Rot z').disable();

        gui.add(controller_values, 'Variation', ['pants', 'skirt', 'tie']);

        const fuzzy = gui.addFolder('Fuzzy Module')// .hide();

        const flvs = this.selected_agent.steering.behaviors[0].fuzzy.flvs;

        this.test = fuzzy.addFuzzy(controller_values, 'Distance', flvs.get('distance')).disable();
        // fuzzy.addFuzzy(controller_values, 'Result', flvs.get('result')).disable();
        //For scene objects
        this.objects = new THREE.Group();

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

        for (const n of this.selected_agent.neighbors) {

            const points = [
                this.selected_agent.position,
                n.position
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({color: 0xff0000});

            const line = new THREE.Line(geometry, material);

            this.objects.add(line);

        }

        this.posX.setValue(this.selected_agent.position.x.toFixed(4));
        this.posY.setValue(this.selected_agent.position.y.toFixed(4));
        this.posZ.setValue(this.selected_agent.position.z.toFixed(4));

        this.rotX.setValue(this.selected_agent.position.x.toFixed(4));
        this.rotY.setValue(this.selected_agent.position.y.toFixed(4));
        this.rotZ.setValue(this.selected_agent.position.z.toFixed(4));

        this.test.setValue([this.selected_agent.steering.behaviors[0].test]);

    }
    
}
