
import * as THREE from 'three';

import {NavMeshLoader} from '../customs/NavMesh.js'

export default function(loadingManager, path='models/navMesh.glb') {

    const navMesh = new Promise((resolve) => {

        const loader = new NavMeshLoader(loadingManager)
            .load(path).then((gltf) => {
                resolve(gltf)
            });

    });

    return navMesh;
}
