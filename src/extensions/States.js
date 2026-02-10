
import * as YUKA from 'yuka';

class AgentState extends YUKA.State {

    constructor() {
        super();
        //Accumulators
        this.current_frame = 0;
        this.current_blendFrame = 0;
        //Clip
        this.blendFrames = 3; //How many transition frames
        //Locomotion
        this.speed = 1;
        this.direction = new YUKA.Vector3();
        this.locomotion = new YUKA.Vector3();
        //VAT
        this.length = 30; //When to loopback the clip
        this.origin = 0; //The 'zero' value
        this.amplitude = 1; //How much to multiply the transformations
        this.textureStart = 0; //Where to find the starting frame //TODO

    }

    enter() {
        this.current_blendFrame = this.blendFrames;
    }

    execute(owner) {

        this.current_frame += 1;

        if (this.current_blendFrame && owner.stateMachine.previousState) {
            this.current_blendFrame -= 1;
        }

    }

}

export {
    AgentState,
};
