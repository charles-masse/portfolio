
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
        //DELETE ME
        const sun = new THREE.DirectionalLight(0xffffff, 5);
        sun.castShadow = true;
        sun.shadow.bias = -0.001;
        sun.shadow.mapSize.set(1024, 1024);
        sun.position.set(100, 100, 100);
        //Video screen
        this.objects.add(city, sun);

        this.video = document.getElementById('video');

        const videoMaterial =  new THREE.MeshBasicMaterial({
            map: new THREE.VideoTexture(this.video),
        });
        const screen = new THREE.PlaneGeometry(19.2, 10.8);
        const videoScreen = new THREE.Mesh(screen, videoMaterial);
        videoScreen.position.set(1.25, 11.5, 7);

        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshBasicMaterial();
        this.playButton = new THREE.Mesh(geometry, material);
        this.playButton.position.set(1.25, 11.5, 7);

        this.objects.add(videoScreen);
        this.objects.add(this.playButton);

    }

    interact() {

        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }

        this.playButton.visible = this.video.paused;
        // //Send message to agents
        // this.pedestrians.manager.entities.forEach((entity) => {
        //     this.pedestrians.manager.sendMessage(this, entity, '[MovieScreen] State Change', 0, this.video.paused);
        // });
        
    }

}
