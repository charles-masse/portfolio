
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {GUI,} from '../extensions/GUI.js';

import {COLORS, MAX_NEIGHBORS,} from '../settings.js';

export default class {

    constructor(entityManager,) {

        this.entities = entityManager.entities;

        this.selected_agent = null;
        //UI
        this.gui = new GUI({title:'Agent Info'});
        this.gui.domElement.style.position = 'static';
        document.getElementById('gui-container').appendChild(this.gui.domElement);

        const controller_values = {
            id: 0,
            'Pos x': 0,
            'Pos y': 0,
            'Pos z': 0,
            'Dir x': 0,
            'Dir y': 0,
            'Dir z': 0,
            Variation:'skirt',
            Distance:[],
            Result:[]
        };

        this.gui.addText(' Click on an Agent for more info.');

        this.id = this.gui.add(controller_values, 'id').disable().hide();

        const pos = this.gui.addFolder('Position').close().hide();
        this.posX = pos.add(controller_values, 'Pos x').disable();
        this.posY = pos.add(controller_values, 'Pos y').disable();
        this.posZ = pos.add(controller_values, 'Pos z').disable();

        const dir = this.gui.addFolder('Direction').close().hide();
        this.dirX = dir.add(controller_values, 'Dir x').disable();
        this.dirY = dir.add(controller_values, 'Dir y').disable();
        this.dirZ = dir.add(controller_values, 'Dir z').disable();

        const anims = this.gui.addFolder('Animations').hide();
        this.test = anims.addDelaunay(this.entities[0].blendSpaces, 'Blend Spaces');

        this.gui.add(controller_values, 'Variation', ['pants', 'skirt', 'tie']).hide();

        //Scene objects
        this.objects = new THREE.Group();
        this.initLines();

    }

    initLines() {

        this.neighbor_lines = [];

        for (let i = 0; i < MAX_NEIGHBORS; i++) {

            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({color: COLORS[i],});
            const line = new THREE.Line(geometry, material);

            this.neighbor_lines.push(line);
            this.objects.add(line);

        }

    }

    selectAgent(point) {

        let nearest = null;
        let min_distance = Infinity;

        this.entities.forEach((entity, i) => {

            const distance = entity.position.squaredDistanceTo(point);
            if (distance < min_distance) {

                min_distance = distance;
                nearest = i;

            }

        });

        if (this.selected_agent != nearest) {
            this.selected_agent = nearest;

        } else {
            this.selected_agent = null;
        }
        
        this.id.setValue(nearest);
        this.showInfo();

    }

    showInfo() {

        const controllers = this.gui.children;

        if (this.selected_agent) {

            controllers[0].hide();
            for (let i = 1; i < controllers.length; i++) controllers[i].show();

        } else {

            controllers[0].show();
            for (let i = 1; i < controllers.length; i++) controllers[i].hide();

        }

    }

    update() {

        if (this.selected_agent) {

            const agent = this.entities[this.selected_agent];

            this.test.setValue(agent);
            this.test.updateDisplay();

            this.posX.setValue(agent.position.x.toFixed(4));
            this.posY.setValue(agent.position.y.toFixed(4));
            this.posZ.setValue(agent.position.z.toFixed(4));

            const direction = agent.getDirection(new YUKA.Vector3());
            
            this.dirX.setValue(direction.x.toFixed(4));
            this.dirY.setValue(direction.y.toFixed(4));
            this.dirZ.setValue(direction.z.toFixed(4));
            //Lines
            for (const line in this.neighbor_lines) {

                if (line in agent.neighbors) {
                    this.neighbor_lines[line].geometry.setFromPoints([
                        new YUKA.Vector3(0, 0.05, 0).add(agent.position),
                        new YUKA.Vector3(0, 0.05, 0).add(agent.neighbors[line].position)
                    ]);
                }

                else {
                    this.neighbor_lines[line].geometry.setFromPoints([
                        new YUKA.Vector3(0, -9999, 0),
                        new YUKA.Vector3(0, -9999, 0)
                    ]);

                }

            }

        }

    }

}
