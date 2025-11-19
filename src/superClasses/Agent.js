
import * as YUKA from 'yuka';

class Agent extends YUKA.GameEntity {

    constructor() {
        super();
        //Vehicle
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = (Math.random() + 0.5) * 3;
        //State machine
        this.stateMachine = new AgentStateMachine(this);

        this.setActive(false);

    }

    setActive(bool) {

        if (bool) {
            this.active = true;

        } else {
            this.setPosition(0, -9999, 0); //Shadow Realm
            this.active = false;

        }

    }

    setPosition(...position) {

        if (position.length === 1 && position[0] instanceof YUKA.Vector3) {
            this.vehicle.position.copy(position[0]);
        } 

        else if (position.length === 3 && position.every(a => typeof a === 'number')) {
            this.vehicle.position.set(position[0], position[1], position[2]);
        } 

        this.sync();

    }

    sync() {

        this.position.copy(this.vehicle.position);
        this.rotation.copy(this.vehicle.rotation);

    }

    update(delta) {
        super.update(delta);

        if (this.active) {

            this.currentTime += delta;
            //Vehicle
            this.vehicle.update(delta);
            this.sync();
            //State MAchine
            this.stateMachine.update();
            
        }

    }

}

class AgentStateMachine extends YUKA.StateMachine {

    constructor(owner) {
        super(owner);

        this.transition_frames = 0;

    }

    changeTo(id) {
        super.changeTo(id);

        this.transition_frames = 1;

    }

    update(){
        super.update();
        //Transition
        if (this.transition_frames && this.previousState) {

            if (this.transition_frames <= this.previousState.clip_blend) {

                console.log(`Transition : ${this.transition_frames}`);

                this.transition_frames++;

            } else {
                this.transition_frames = 0;
            }

        }

    }

}

class AgentState extends YUKA.State {

    constructor(clip_blend=3) {
        super();
        
        this.current_frame = 0; //The current frame of the clip
        this.clip_length = 1; //When to loopback the clip
        this.clip_blend = clip_blend; //How many transition frames to the clip
        
        this.transform_magnitude = 1; //How much to multiply the transformations
        
        this.clip_atlasOffset = 0; //Offset of the texture

    }

}


export {
    Agent,
    AgentStateMachine,
    AgentState,
};
