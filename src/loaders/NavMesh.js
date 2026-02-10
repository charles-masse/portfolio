
import * as THREE from 'three';

import {NavMeshLoader,} from '../extensions/NavMesh.js'

export default function(loadingManager, path='models/navmesh.gltf') {

    const navMesh = new Promise((resolve) => {

        const loader = new NavMeshLoader(loadingManager)
            .load(path).then((gltf) => {
                resolve(gltf)
            });

    });

    return navMesh;
}
