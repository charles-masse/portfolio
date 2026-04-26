
import * as YUKA from 'yuka';

class FollowPathBehavior extends YUKA.FollowPathBehavior {

    calculate(vehicle, force/* , delta*/) {

        const path = this.path;
        //Calculate distance in square space from current waypoint to vehicle
        const distanceSq = path.current().squaredDistanceTo(vehicle.position);
        //Reached the end
        if (path.done()) {
            vehicle.setActive(false);
        }
        //Move to next waypoint/end if close enough to current target
        if (distanceSq < (this.nextWaypointDistance * this.nextWaypointDistance)) {
            path.advance();
        }

        this._seek.target = path.current();
        this._seek.calculate(vehicle, force);
        
        return force;
    }

}

export {
    FollowPathBehavior,
};
