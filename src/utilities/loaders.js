
import * as THREE from 'three';
import {OBJLoader,} from 'three/addons/loaders/OBJLoader.js';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

// import * as YUKA from 'yuka';

import {NavMeshLoader,} from '../extensions/Navigation.js';

async function loadObj(path, loadingManager=null) {
    
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

async function loadNavMesh(path, loadingManager=null) {

    const navMesh = new Promise((resolve) => {
        
        new NavMeshLoader(loadingManager).load(path, {'mergeConvexRegions': false}).then((gltf) => {
            resolve(gltf);
        });

    });

    return navMesh;
}

export {
    loadObj,
    loadGLTF,
    loadTexture,
    rawTexture,
    loadNavMesh,
};
