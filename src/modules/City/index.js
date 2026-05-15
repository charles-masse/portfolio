
import * as THREE from 'three';

import {loadOBJ,} from '../../utilities/loaders.js';

export class City {

    constructor(loadingManager) {

        this.objects = new THREE.Group();
        
        this.init(loadingManager);

    }

    async init(loadingManager) {

        const city = await loadOBJ('City/model.obj', loadingManager);
        city.material = new THREE.MeshStandardMaterial({color: 0x808080});
        city.castShadow = true;
        city.receiveShadow = true;
        //DELETE
        const sun = new THREE.DirectionalLight(0xffffff, 5);
        sun.castShadow = true;
        sun.shadow.bias = -0.001;
        sun.shadow.mapSize.set(1024, 1024);

        sun.position.set(100, 100, 100)

        this.objects.add(city, sun);

    }

}
