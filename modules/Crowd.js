
import * as THREE from 'three';
import * as YUKA from 'yuka';

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

export class Crowd {

    constructor(scene, debug=false) {
        // Setup
        this.scene = scene;

        this.time = new YUKA.Time();
        this.clock = new THREE.Clock();

        this.entityManager = new YUKA.EntityManager();
        // Character test
        this.vehicleGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
        this.vehicleGeometry.rotateX(Math.PI * 0.5);
        this.vehicleMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

    }

    spawn() {

        // Path
        const path = new YUKA.Path();
        path.loop = true;
        path.add(new YUKA.Vector3(-2, -0.75, 2));
        path.add(new YUKA.Vector3(-3, -0.75, 0));
        path.add(new YUKA.Vector3(-2, -0.75, -2));
        path.add(new YUKA.Vector3(0, -0.75, 0));
        path.add(new YUKA.Vector3(2, -0.75, -2));
        path.add(new YUKA.Vector3(3, -0.75, 0));
        path.add(new YUKA.Vector3(2, -0.75, 2));
        path.add(new YUKA.Vector3(0, -0.75, 3));

        // if (debug) {

        //     const position = [];

        //     for (let i = 0; i < path._waypoints.length; i ++) {

        //         const waypoint = path._waypoints[i];
        //         position.push(waypoint.x, waypoint.y, waypoint.z);

        //     }

        //     const lineGeometry = new THREE.BufferGeometry();
        //     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
        //     const lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        //     const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
        //     this.scene.add(lines);

        // }

        const vehicleMesh = new THREE.Mesh(this.vehicleGeometry, this.vehicleMaterial);
        vehicleMesh.matrixAutoUpdate = false;
        this.scene.add(vehicleMesh);

        const vehicle = new YUKA.Vehicle();
        vehicle.maxSpeed = Math.random() + 1;
        vehicle.setRenderComponent(vehicleMesh, sync);

        const followPathBehavior = new YUKA.FollowPathBehavior(path);
        vehicle.steering.add(followPathBehavior);

        // const onPathBehavior = new YUKA.OnPathBehavior(path);
        // vehicle.steering.add(onPathBehavior);

        this.entityManager.add(vehicle);
        vehicle.position.copy(path._waypoints[0]);

    }

    update() {

        if (this.clock.getElapsedTime() > Math.round(Math.random() * (10 - 3) + 3)) {

            this.spawn();
            this.clock.start();
            console.log(`Population : ${this.entityManager.entities.length}`);

        }

        this.entityManager.update(this.time.update().getDelta());

    }

}
