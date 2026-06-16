
import * as THREE from 'three';
import {OBJLoader,} from 'three/addons/loaders/OBJLoader.js';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

/**
 * Loads a JSON file from the specified path and returns the parsed data.
 * @param {string} path - The path to the JSON file to be loaded.
 * @param {THREE.LoadingManager} loadingManager - An optional loading manager to track the loading process.
 * @returns {Promise<string>} A promise that resolves with the parsed JSON data.
 */
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

/**
 * Loads an OBJ file from the specified path and returns the parsed mesh.
 * @param {string} path - The path to the OBJ file to be loaded.
 * @param {THREE.LoadingManager} loadingManager - An optional loading manager to track the loading process.
 * @returns {Promise<THREE.Mesh>} A promise that resolves with the parsed mesh.
 */
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

/**
 * Loads a GLTF file from the specified path and returns the parsed mesh.
 * @param {string} path - The path to the GLTF file to be loaded.
 * @param {THREE.LoadingManager} loadingManager - An optional loading manager to track the loading process.
 * @returns {Promise<THREE.Mesh>} A promise that resolves with the parsed mesh.
 */
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

/**
 * Loads a texture from the specified path and returns the parsed texture.
 * @param {string} path - The path to the texture file to be loaded.
 * @param {THREE.LoadingManager} loadingManager - An optional loading manager to track the loading process.
 * @returns {Promise<THREE.Texture>} A promise that resolves with the parsed texture.
 */
async function loadTexture(path, loadingManager=null) {

    const loader = new THREE.TextureLoader(loadingManager);
    const texture = loader.loadAsync(path);

    return texture;
}

/**
 * Removes the default settings from a texture, making it suitable for use as a data texture.
 * @param {THREE.Texture} texture - The texture to be prepared.
 * @returns {THREE.Texture} The prepared texture.
 */
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
