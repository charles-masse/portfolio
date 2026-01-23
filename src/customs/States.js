
import * as YUKA from 'yuka';

class AgentStateMachine extends YUKA.StateMachine {

    constructor(owner) {
        super(owner);

        this.animation_clock = 0;

        this.transition = false;
        this.transition_startFrame = 0;
        this.blend_weight = 0;

    }

    changeTo(id) {
        super.changeTo(id);

        this.transition = true;
        this.transition_startFrame = this.animation_clock;

    }

    update(delta){
        super.update();

        this.animation_clock += delta * 24; //24 frames per seconds
        //Clip transition--To use with `previousState` and `currentState`
        if (this.transition && this.previousState) {

            const state_blend = this.currentState.clip_blend;
            const transition_duration = this.animation_clock - this.transition_startFrame;

            console.log(this.animation_clock);
            console.log(this.transition_startFrame);

            if (transition_duration <= state_blend) {
                this.blend_weight = transition_duration / (state_blend + 1);

            } else {
                this.transition = false;
                
            }

        }

    }

}

class AgentState extends YUKA.State {

    constructor(clip_blend=3) {
        super();

        this.clip_startFrame = 0; //Randomize
        this.clip_length = 30; //When to loopback the clip
        this.clip_blend = clip_blend; //How many transition frames
        
        this.transform_magnitude = 1; //How much to multiply the transformations
        
        this.clip_atlasOffset = 0; //Offset of the texture

    }

    execute(owner) {
        super.execute(owner);

        const current_frame = (owner.stateMachine.animation_clock + this.clip_startFrame) % this.clip_length;

        //This would return the transform per vertex * transform_magnitude

    }

}

export {
    Agent,
    AgentStateMachine,
    AgentState,
};
