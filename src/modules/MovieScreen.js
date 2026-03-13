
import * as THREE from 'three';

// import * as YUKA from 'yuka';

export default class {

    constructor(pedestrians) {

        this.pedestrians = pedestrians;

        this._state = 0;

        this.video = document.getElementById('video');

        const videoMaterial =  new THREE.MeshBasicMaterial({
            map: new THREE.VideoTexture(this.video),
        });
        const screen = new THREE.PlaneGeometry(9.6, 5.4);
        const videoScreen = new THREE.Mesh(screen, videoMaterial);
        videoScreen.position.set(0, 6.5, 5.01);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial();
        this.playButton = new THREE.Mesh(geometry, material);
        this.playButton.position.set(0, 6.5, 5.01)

        this.objects = new THREE.Group();
        this.objects.add(videoScreen);
        this.objects.add(this.playButton);

    }

    update() {

        if (this._state === 0) {

            this.video.play();
            this._state = 1;
            this.playButton.visible = false;

        }

        else {

            this.video.pause();
            this._state = 0;
            this.playButton.visible = true;

        }
        //Send message to agents
        this.pedestrians.entityManager.entities.forEach((entity, i) => {
            this.pedestrians.entityManager.sendMessage(null, entity, 'MovieScreen : State Change', 0, this._state);
        });
        
    }

}
