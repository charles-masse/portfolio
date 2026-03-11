
import {GUI,} from '../extensions/GUI.js';

import {MAX_AGENTS,} from '../settings.js';

export default class {

    constructor(entityManager) {

        const gui = new GUI({title:'Crowd Spawner'});
        gui.domElement.style.position = 'static';

        const data = {Population: MAX_AGENTS / 2.0};
        entityManager.population = data.Population;

        gui.add(data, 'Population', 1, MAX_AGENTS, 1).onFinishChange(value => {
            entityManager.population = value;
        });
        
        document.getElementById('gui-container').appendChild(gui.domElement);

    }

}
