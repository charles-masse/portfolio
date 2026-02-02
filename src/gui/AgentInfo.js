
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {GUI} from '../customs/GUI.js';

export default class {

    constructor(entityManager) {

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

        const rot = this.gui.addFolder('Direction').close().hide();
        this.rotX = rot.add(controller_values, 'Dir x').disable();
        this.rotY = rot.add(controller_values, 'Dir y').disable();
        this.rotZ = rot.add(controller_values, 'Dir z').disable();

        this.gui.add(controller_values, 'Variation', ['pants', 'skirt', 'tie']).hide();

        const behaviors = this.entities[0].steering.behaviors;

        const separation = this.gui.addFolder('Separation').hide();

        const separation_flvs = behaviors[3].fuzzy.flvs
        this.separation_direction = separation.addFuzzy(controller_values, '[I] Direction', separation_flvs.get('direction'), -180, 180).disable();
        this.separation_distance = separation.addFuzzy(controller_values, '[I] Distance', separation_flvs.get('distance'), 0, 3).disable();
        this.separation_weight = separation.addFuzzy(controller_values, '[O] Weight', separation_flvs.get('weight'), 0, 1).disable();

        const cohesion = this.gui.addFolder('Cohesion').hide();

        const cohesion_flvs = behaviors[4].fuzzy.flvs
        this.cohesion_facing = cohesion.addFuzzy(controller_values, '[I] Facing Angle', cohesion_flvs.get('facingAngle'), -180, 180).disable();
        this.cohesion_direction = cohesion.addFuzzy(controller_values, '[I] Direction', cohesion_flvs.get('direction'), -180, 180).disable();
        this.cohesion_weight = cohesion.addFuzzy(controller_values, '[O] Weight', cohesion_flvs.get('weight'), 0, 1).disable();
        //For scene objects
        this.objects = new THREE.Group();

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

    update(time) {

        if (this.selected_agent) {

            const agent = this.entities[this.selected_agent];

            this.posX.setValue(agent.position.x.toFixed(4));
            this.posY.setValue(agent.position.y.toFixed(4));
            this.posZ.setValue(agent.position.z.toFixed(4));

            const direction = agent.getDirection(new YUKA.Vector3());
            this.rotX.setValue(direction.x.toFixed(4));
            this.rotY.setValue(direction.y.toFixed(4));
            this.rotZ.setValue(direction.z.toFixed(4));
            //Fuzzy
            const separation = agent.steering.behaviors[3].fuzzy.flvs;
            this.separation_direction.setValue(separation.get('direction').io);
            this.separation_distance.setValue(separation.get('distance').io);
            this.separation_weight.setValue(separation.get('weight').io);

            const cohesion = agent.steering.behaviors[4].fuzzy.flvs;
            this.cohesion_facing.setValue(cohesion.get('facingAngle').io);
            this.cohesion_direction.setValue(cohesion.get('direction').io);
            this.cohesion_weight.setValue(cohesion.get('weight').io);

        }

    }
    
}
