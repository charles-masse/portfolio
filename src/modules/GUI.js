
import {customGUI, GraphController} from '../customs/GUI.js';

export default class {

    constructor() {
        
        this.container = document.getElementById('gui-container');

        const guiMain = this.addGUI('Spawner');

        guiMain.add({Population: 500}, 'Population', 1, 1000, 1);

        const guiDebug = this.addGUI('Agent Info');

        const pos = guiDebug.addFolder('Position');
        pos.add({x:0}, 'x').disable();
        pos.add({y:0}, 'y').disable();
        pos.add({z:0}, 'z').disable();

        pos.close();

        const rot = guiDebug.addFolder('Rotation');
        rot.add({x:0}, 'x').disable();
        rot.add({y:0}, 'y').disable();
        rot.add({z:0}, 'z').disable();

        rot.close();

        guiDebug.add({Variation:'skirt'}, 'Variation', ['pants', 'skirt']);

        guiDebug.addGraph({}, 'Fuzzy');

        guiDebug.close();

    }

    addGUI(title) {

      const gui = new customGUI({title});

      this.container.appendChild(gui.domElement);
      gui.domElement.style.position = 'static';

      return gui;
    }
    
}
