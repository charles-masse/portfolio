
import {GUI} from '../customs/GUI.js';

import {MAX_AGENTS} from '../settings.js';

export default class {

    constructor(entityManager) {

        this.entityManager = entityManager;

        const gui = new GUI({title:'Crowd Spawner'});
        gui.domElement.style.position = 'static';

        const settings = {Population: MAX_AGENTS / 2.0};
        const populationController = gui.add(settings, 'Population', 1, MAX_AGENTS, 1).onFinishChange( value => {
            this.entityManager.activateAgents(value);
        });

        document.getElementById('gui-container').appendChild(gui.domElement);

        this.entityManager.activateAgents(settings.Population);

    }

}
