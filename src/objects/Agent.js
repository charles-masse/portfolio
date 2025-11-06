
// import * as THREE from 'three';
import * as YUKA from 'yuka';
// //States
// import {Walk} from '../stateMachines/Pictogram.js';

class Agent extends YUKA.GameEntity {

    constructor() {
        super();

        this.currentTime = 0; //tracks how long the entity is in the current state
        this.stateDuration = 5; //duration of a single state in seconds
        this.crossFadeDuration = 1; //duration of a crossfade in seconds
        //Vehicle
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = (Math.random() + 0.1) * 0.5;

        this.setActive(false)

        // //Animations
        // const animations = model.animations;
        // this.mixer = new THREE.AnimationMixer(model);

        // const actions = {};
        // animations.forEach((clip) => {
        //     actions[clip.name] = this.mixer.clipAction(clip);
        // });

        // actions['Take 001'].play();

        // this.stateMachine = new YUKA.StateMachine(this);
        // this.stateMachine.add('WALK', new Walk());

    }

    setActive(bool, pos=NaN) {

        if (bool === true) {
            this.active = true;
            if (pos) {
                this.vehicle.position = pos;
            } else {
                this.vehicle.position.set(0, 0, 0);
            }
            
        }

        if (bool === false) {
            this.active = false;
            this.vehicle.position.set(0, 25, 0);
            console.log(bool)
            // this.steering.behaviors.length = 0;
        }

        this.position.copy(this.vehicle.position) 

    }

    update(delta) {

        if (this.active) {

            this.currentTime += delta;

            // if (this.mixer) {
            //     this.mixer.update(delta);
            // }
            // this.stateMachine.update();

            this.vehicle.update(delta);
            this.position.copy(this.vehicle.position);
            this.rotation.copy(this.vehicle.rotation);
            super.update(delta);

        }

    }

}

export {Agent};
