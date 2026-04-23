
import * as THREE from 'three';
import {OBJLoader,} from 'three/addons/loaders/OBJLoader.js';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

async function loadJSON(path, loadingManager=null) {

    const loader = new THREE.FileLoader(loadingManager);

    const data = await new Promise((resolve) => {

        loader.load(path, (text) => {

            const json = JSON.parse(text);

            resolve(json);
        });

    });

    return data;
}

async function loadOBJ(path, loadingManager=null) {
    
    const mesh = new Promise((resolve) => {

        new OBJLoader(loadingManager).load(path, (obj) => {

            let mesh = null;
            
            obj.traverse((child) => {

                if (child.isMesh) {
                    mesh = child;
                }

            });

            resolve(mesh);
        });

    });

    return mesh;
}

async function loadGLTF(path, loadingManager=null) {

    const mesh = new Promise((resolve) => {

        new GLTFLoader(loadingManager).load(path, (gltf) => {

            let mesh = null;

            gltf.scene.traverse((child) => {

                if (child.isMesh) {
                    mesh = child;
                }

            });

            resolve(mesh);
        });

    });

    return mesh;
}

async function loadTexture(path, loadingManager=null) {

    const loader = new THREE.TextureLoader(loadingManager);
    const texture = loader.loadAsync(path);

    return texture;
}

function rawTexture(texture) {

    texture.flipY = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    return texture;
}

export {
    loadJSON,
    loadOBJ,
    loadGLTF,
    loadTexture,
    rawTexture,
};
