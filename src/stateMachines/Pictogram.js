
import * as YUKA from 'yuka';

class Walk extends YUKA.State {

    enter(char) {
        console.log(`enter: Walk`)
    }

    execute(char) {
        console.log(`Walk`)
    }

    exit(char) {
        console.log(`exit: Walk`)
    }

}

export {
    Walk
};