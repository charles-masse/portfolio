
// import * as THREE from 'three';

import * as YUKA from 'yuka';

export default class extends YUKA.Path {

    constructor() {
        super();

        this.done = false;

    }

    finished() {
        return this.done;
    }

    advance() {

        this._index ++;

        if ((this._index === this._waypoints.length)) {

            if (this.loop === true) {
                this._index = 0;
            } 

            else {

                this.done = true;
                this._index --;
                
            }

        }

        return this;
    }

}
