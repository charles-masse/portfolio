
import * as YUKA from 'yuka';

class AgentStateMachine extends YUKA.StateMachine {

    update() {
        super.update();
        //Still execute state if it's transitioning out
        if (this.previousState !== null && this.previousState.current_blendFrame) {
            this.previousState.execute();
        }
        
    }

}

class AgentState extends YUKA.State {

    constructor(locomotion) {
        super();
        //Accumulators
        this.current_frame = 0;
        this.current_blendFrame = 0;
        //Clip
        this.blendFrames = 3; //How many transition frames

    }

    enter(owner) {

        if (owner.stateMachine.previousState) {
            this.current_blendFrame = this.blendFrames;
        }
        
    }

    execute(owner) {

        this.current_frame += 1;
        //Blend frames
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
