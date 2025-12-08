
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';

export default class {

    constructor(scene, loadingManager) {

        const textureLoader = new THREE.TextureLoader(loadingManager);

        this.material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            emissive: 0xffffff,
            emissiveIntensity: 1,
            emissiveMap: textureLoader.load('./textures/cityEmission.jpg'),
            side: THREE.DoubleSide,
        });

        const objLoader = new OBJLoader(loadingManager);
        objLoader.load('./models/city.obj', (mesh) => {
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.material = this.material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(mesh);

        });

    }

}
