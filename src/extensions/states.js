
// import * as THREE from 'three';

import * as YUKA from 'yuka';

class State extends YUKA.State {

    constructor() {
        super();

        this.blendFrames = 3;
        this.speed = 1;
        //Accumulators
        this.current_frame = 0;
        this.current_blendFrame = 0;

    }

    enter(owner) {

        if (owner.stateMachine.previousState) {
            this.current_blendFrame = this.blendFrames;
        }
        
    }

    execute(owner) {

        this.current_frame++;
        //Blend frames
        if (this.current_blendFrame != 0 && owner.stateMachine.previousState) {
            this.current_blendFrame--;
        }

    }

    exit(owner) {
        this.current_blendFrame = owner.stateMachine.currentState.blendFrames;
    }

}

class StateMachine extends YUKA.StateMachine {

    update() {
        super.update();
        
        if (this.previousState && this.previousState.current_blendFrame > 0) {
            //Still execute state if it's transitioning out
            this.previousState.execute(this.owner);
            // //Speed transition
            //TODO
            // const currentSpeed = THREE.MathUtils.lerp(this.currentState.speed, this.previousState.speed, this.currentState.current_blendFrame / this.currentState.blendFrames + 1);
            // console.log(this.currentState, this.previousState);
            // this.owner.maxSpeed = currentSpeed;

        }

        this.owner.maxSpeed = this.currentState.speed;

        // } else {
        //     this.owner.maxSpeed = this.currentState.speed;
        // }

    }

}

export {
    State,
    StateMachine,
};
