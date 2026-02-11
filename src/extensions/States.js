
import * as YUKA from 'yuka';

class AgentStateMachine extends YUKA.StateMachine {

    update() {
        super.update();
        //Still execute state if it's transitioning out
        if (this.previousState !== null && this.previousState.current_blendFrame) {
            this.previousState.execute();
        }
        //TODO blended speed
        this.owner.maxSpeed = this.currentState.locomotion.length();

    }

    getBlendWeight() {

    }

    getBestClip() {

        console.log(this);

    }

}

class AgentState extends YUKA.State {

    constructor() {
        super();
        //Accumulators
        this.current_frame = 0;
        this.current_blendFrame = 0;
        //Clip
        this.blendFrames = 3; //How many transition frames
        //TODO transition frames, sync, etc.
        //Steering
        this.direction = new YUKA.Vector3(0, 0, 1);
        this.locomotion = new YUKA.Vector3(0, 0, 0);
        //VAT
        this.length = 24; //When to loopback the clip
        this.origin = 0; //The 'zero' value
        this.amplitude = 1; //How much to multiply the transformations
        this.textureStart = 0; //Where to find the starting frame TODO

    }

    enter(owner) {

        if (owner.stateMachine.previousState) {
            this.current_blendFrame = this.blendFrames;
        }
        
    }

    execute(owner) {

        this.current_frame += 1;

        if (this.current_blendFrame && owner.stateMachine.previousState) {
            this.current_blendFrame -= 1;
        }

    }

    exit(owner) {
        this.current_blendFrame = owner.stateMachine.currentState.blendFrames;
    }

}

export {
    AgentStateMachine,
    AgentState,
};
