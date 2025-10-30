
import * as THREE from 'three';
import * as YUKA from 'yuka';

import {Walk} from '../stateMachines/pictogram.js';

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

class PictogramAgent extends YUKA.GameEntity {

    constructor() {
        super();

        // this.currentTime = 0; // tracks how long the entity is in the current state
        // this.stateDuration = 5; // duration of a single state in seconds
        // this.crossFadeDuration = 1; // duration of a crossfade in seconds
        //Geo
        const testGeo = new THREE.ConeGeometry(0.1, 0.5, 8);
        testGeo.rotateX(Math.PI * 0.5);
        const testMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        this.mesh = new THREE.Mesh(testGeo, testMaterial);
        this.mesh.matrixAutoUpdate = false;
        //Animations
        // this.mixer = new THREE.AnimationMixer(pictogramMesh);
        // this.animations = animations;

        // this.stateMachine = new YUKA.StateMachine(this);
        // this.stateMachine.add('WALK', new Walk());
        
        // const walkAnim = mixer.clipAction('Walk');
        // walkAnim.play();
        // walkAnim.enabled = false;
        // animations.set('WALK', walkAnim );
        // Behaviors
        this.vehicle = new YUKA.Vehicle();

        this.vehicle.maxSpeed = Math.random() + 1;
        this.setRenderComponent(this.mesh, sync);
        
    }

    //TO DO--Random variations

    update(delta) {

        this.currentTime += delta;
        // this.stateMachine.update();
        // this.mixer.update(delta);
        this.vehicle.update(delta);
        this.position.copy(this.vehicle.position);
        this.rotation.copy(this.vehicle.rotation);

        return this;

    }

}

export {PictogramAgent};
