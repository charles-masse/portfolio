
import * as YUKA from 'yuka';

export default class extends YUKA.SteeringBehavior {

    constructor(path = new YUKA.Path(), nextWaypointDistance=1) {
        super();

        this.path = path;

        this.nextWaypointDistance = nextWaypointDistance;

        this._arrive = new YUKA.ArriveBehavior();
        this._seek = new YUKA.SeekBehavior();

    }

    calculate(vehicle, force) {

        const path = this.path;

        const distanceSq = path.current().squaredDistanceTo(vehicle.position);

        if (distanceSq < (this.nextWaypointDistance * this.nextWaypointDistance)) {

            path.advance();

        }

        const target = path.current();

        if (path.finished() === true) {

            this._arrive.target = target;
            this._arrive.calculate(vehicle, force);

        } else {

            this._seek.target = target;
            this._seek.calculate(vehicle, force);

        }

        return force;

    }

}

// class AlignmentBehavior extends SteeringBehavior {

//     constructor() {
//         super();
//     }

//     calculate( vehicle, force) {

//         averageDirection.set( 0, 0, 0 );
//         // iterate over all neighbors to calculate the average direction vector
//         const neighbors = vehicle.neighbors;
//         for ( let i = 0, l = neighbors.length; i < l; i ++ ) {

//             const neighbor = neighbors[ i ];

//             neighbor.getDirection( direction$1 );

//             averageDirection.add( direction$1 );

//         }

//         if ( neighbors.length > 0 ) {

//             averageDirection.divideScalar( neighbors.length );

//             vehicle.getDirection( direction$1 );
//             force.subVectors( averageDirection, direction$1 );

//         }

//         return force;

//     }

// }