
import * as THREE from 'three';

export default class {

    constructor() {

        this.objects = new THREE.Group();
        
        this.video = document.getElementById('video');
        const texture = new THREE.VideoTexture(this.video);
        const videoMaterial =  new THREE.MeshBasicMaterial({map: texture, side:THREE.FrontSide, toneMapped: false});
        const screen = new THREE.PlaneGeometry(9.6, 5.4);
        const videoScreen = new THREE.Mesh(screen, videoMaterial);

        videoScreen.position.set(0, 6.5, 5.01);
        
        this.play();

        this.objects.add(videoScreen);

    }

    play() {
        this.video.play();
    }

}
