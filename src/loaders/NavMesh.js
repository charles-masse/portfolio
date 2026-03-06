
import {NavMeshLoader,} from '../extensions/NavMesh.js'

export default function(loadingManager, path='models/navmesh.gltf') {

    const navMesh = new Promise((resolve) => {

        new NavMeshLoader(loadingManager).load(path).then((gltf) => {
            resolve(gltf)
        });

    });

    return navMesh;
}
