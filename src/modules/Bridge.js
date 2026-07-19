
import * as THREE from 'three';

// import * as YUKA from 'yuka';

import {ModuleBridge} from '../core/modules.js';

export default class extends ModuleBridge {

    constructor(camera) {
        super();

        this.camera = camera;

        this.#initListeners();

    }

    #initListeners() {

        window.addEventListener('pointerdown', () => {

            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            //Movie screen
            const city = this.getModuleByName('City');

            const intersection = raycaster.intersectObject(city.objects.children[4], true);

            if (intersection.length) {

                city.interact();
                // Send message to pedestrians
                const pedestrians = this.getModuleByName('Pedestrians');
                
                this.sendMessage(city, pedestrians, '[MovieScreen] State Change', 0, city.video.paused);

            }

        });

    }

    update(delta) {

        super.update(delta);
        //Disable loading screen after all modules have been initialized
        const loadingScreen = document.getElementById('loading-screen');

        if (loadingScreen && this.modules.filter(module => module.initialized).length === this.modules.length) {
            
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', loadingScreen.remove);

        }
        
    }

}
