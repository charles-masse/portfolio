
import * as THREE from 'three';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

import {MAX_AGENTS,} from '../settings.js';

async function PictogramGeo(loadingManager) {

    const geo = new Promise((resolve) => {

        new GLTFLoader(loadingManager).load('models/pictogram.gltf', (gltf) => {

            let mesh = null;

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    mesh = child;
                }
            });

            const geo = mesh.geometry;
            //For VAT setup
            geo.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));

            geo.setAttribute('current_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('length', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('origin', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('amplitude', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
            geo.setAttribute('textureStart', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));

            resolve(geo);
        });

    });

    return geo;
}

async function PictogramTexture(loadingManager) {

    const loader = new THREE.TextureLoader(loadingManager);
    const texture = await loader.loadAsync('./VATs/animations.png');

    return texture;
}

export {
    PictogramGeo,
    PictogramTexture,
};
