
import * as YUKA from 'yuka';

const toAgent = new YUKA.Vector3();

export default class extends YUKA.SteeringBehavior {

    constructor() {
        super();

    }

    calculate( vehicle, force, /* delta */ ) {

        const neighbors = vehicle.neighbors;

        for ( let i = 0, l = neighbors.length; i < l; i ++ ) {

            const neighbor = neighbors[ i ];

            toAgent.subVectors( vehicle.position, neighbor.position );

            let length = toAgent.length();

            // handle zero length if both vehicles have the same position

            if ( length === 0 ) length = 0.0001;

            // scale the force inversely proportional to the agents distance from its neighbor

            toAgent.normalize().divideScalar( length );

            force.add( toAgent );

        }

        return force;

    }

}

    // constructor(path = new YUKA.Path(), nextWaypointDistance=1) {
    //     super();

    //     this.path = path;

    //     this.nextWaypointDistance = nextWaypointDistance;

    //     this._arrive = new YUKA.ArriveBehavior();
    //     this._seek = new YUKA.SeekBehavior();

    // }

    // calculate(vehicle, force) {

    //     const path = this.path;

    //     const distanceSq = path.current().squaredDistanceTo(vehicle.position);

    //     if (distanceSq < (this.nextWaypointDistance * this.nextWaypointDistance)) {

    //         path.advance();

    //     }

    //     const target = path.current();

    //     if (path.finished() === true) {

    //         // this._arrive.target = target;
    //         // this._arrive.calculate(vehicle, force);

    //         vehicle.velocity = new YUKA.Vector3(0, 0, 0);

    //     } else {

    //         this._seek.target = target;
    //         this._seek.calculate(vehicle, force);

    //         force = force.normalize();

    //     }

    //     return force;

    // }
