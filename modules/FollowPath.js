
import * as THREE from 'three';
import * as YUKA from 'yuka';

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

export class FollowPath {

    constructor(scene) {
        // Setup
        let time = new YUKA.Time();
        this.time = time

        const entityManager = new YUKA.EntityManager();
        this.entityManager = entityManager

        const vehicle = new YUKA.Vehicle();

        const vehicleGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
        vehicleGeometry.rotateX(Math.PI * 0.5);
        const vehicleMaterial = new THREE.MeshNormalMaterial();
        const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
        vehicleMesh.matrixAutoUpdate = false;
        scene.add(vehicleMesh);

        vehicle.setRenderComponent(vehicleMesh, sync);
        // Path
        const path = new YUKA.Path();
        path.loop = true;
        path.add(new YUKA.Vector3(-4, 0, 4));
        path.add(new YUKA.Vector3(-6, 0, 0));
        path.add(new YUKA.Vector3(-4, 0, -4));
        path.add(new YUKA.Vector3(0, 0, 0));
        path.add(new YUKA.Vector3(4, 0, -4));
        path.add(new YUKA.Vector3(6, 0, 0));
        path.add(new YUKA.Vector3(4, 0, 4));
        path.add(new YUKA.Vector3(0, 0, 6));

        vehicle.position.copy(path.current());
        // use "FollowPathBehavior" for basic path following
        const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
        vehicle.steering.add(followPathBehavior);
        // use "OnPathBehavior" to realize a more strict path following.
        const onPathBehavior = new YUKA.OnPathBehavior(path);
        vehicle.steering.add(onPathBehavior);

        this.entityManager.add(vehicle);
        //
        const position = [];

        for (let i = 0; i < path._waypoints.length; i ++) {

            const waypoint = path._waypoints[i];

            position.push(waypoint.x, waypoint.y, waypoint.z);

        }

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));

        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
        scene.add(lines);

    }

    update() {

        const delta = this.time.update().getDelta();
        this.entityManager.update(delta);

    }

}
