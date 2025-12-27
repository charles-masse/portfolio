
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';

export default function (
    loadingManager,
    texture_path='./textures/cityEmission.jpg',
    model_path='./models/city.obj',
) {

    const city = new Promise((resolve) => {

        const textureLoader = new THREE.TextureLoader(loadingManager);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            emissive: 0xffffff,
            emissiveIntensity: 1,
            emissiveMap: textureLoader.load(texture_path),
            side: THREE.DoubleSide,
        });

        const objLoader = new OBJLoader(loadingManager)
            .load(model_path, (mesh) => {
                mesh.traverse((child) => {

                    if (child.isMesh) {
                        child.material = material;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }

                });

                resolve(mesh);
            });

    });

    return city;
}
