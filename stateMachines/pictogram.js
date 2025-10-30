
import * as YUKA from 'yuka';

class Walk extends YUKA.State {

    enter(char) {

        // char.ui.currentState.textContent = 'WALK';

        const walk = char.animations.get('WALK');
        walk.reset().fadeIn(char.crossFadeDuration);

    }

    execute(char) {

        // if (char.currentTime >= char.stateDuration) {

        //     char.currentTime = 0;
        //     char.stateMachine.changeTo(IDLE);

        // }

    }

    exit(char) {

        const walk = char.animations.get('WALK');
        walk.fadeOut(char.crossFadeDuration);

    }

}

export {
    Walk
};