
import {GUI} from '../customs/GUI.js';

const MAX_AGENTS = 500;

export default class {

    constructor(entityManager) {

        this.entityManager = entityManager;

        const gui = new GUI({title:'Crowd Spawner'});
        gui.domElement.style.position = 'static';

        const settings = {Population: MAX_AGENTS / 2.0};
        this.populationController = gui.add(settings, 'Population', 1, MAX_AGENTS, 1).onChange( value => {
            this.entityManager.activateAgents(value);
        });

        document.getElementById('gui-container').appendChild(gui.domElement);

        this.entityManager.activateAgents(settings.Population);

    }

}
