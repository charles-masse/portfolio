
import * as YUKA from 'yuka';

import {Walk} from '../stateMachines/pictogram.js';

class PictogramAgent extends YUKA.GameEntity {

    constructor(mixer, animations) {

        super();

        this.mixer = mixer;
        this.animations = animations;

        this.stateMachine = new StateMachine(this);
        this.stateMachine.add('WALK', new Walk());

        this.currentTime = 0; // tracks how long the entity is in the current state
        this.stateDuration = 5; // duration of a single state in seconds
        this.crossFadeDuration = 1; // duration of a crossfade in seconds

    }

    update( delta ) {

        this.currentTime += delta;
        this.stateMachine.update();
        this.mixer.update(delta);

        return this;

    }

}

export {PictogramAgent};
