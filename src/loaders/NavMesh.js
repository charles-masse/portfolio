
import * as THREE from 'three';

import {CustomNavMeshLoader} from '../customs/NavMesh.js'

export default function(loadingManager, path='models/navMesh.glb') {

    const navMesh = new Promise((resolve) => {

        const loader = new CustomNavMeshLoader(loadingManager);
        loader.load(path).then((gltf) => {
            resolve(gltf)
        });

    });

    return navMesh;
}
