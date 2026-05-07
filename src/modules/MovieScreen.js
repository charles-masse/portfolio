
import * as THREE from 'three';

export default class {

    constructor(pedestrians) {

        this.pedestrians = pedestrians;

        this.video = document.getElementById('video');
        this.video.pause();

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

        this.objects = new THREE.Group();
        this.objects.add(videoScreen);
        this.objects.add(this.playButton);

    }

    update() {

        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }

        this.playButton.visible = this.video.paused;
        //Send message to agents
        this.pedestrians.manager.entities.forEach((entity) => {
            this.pedestrians.manager.sendMessage(this, entity, '[MovieScreen] State Change', 0, this.video.paused);
        });
        
    }

}
