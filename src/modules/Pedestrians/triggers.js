
import * as YUKA from 'yuka';

const direction = new YUKA.Vector3();

class CrosswalkTrigger extends YUKA.Trigger {

    constructor(region) {
        super(region);

        this.region = region;

        this.maxNeighbors = 99;
        this.neighborhoodRadius = 8;

        this.position.copy(region.polygon.centroid);

    }

    handleMessage(/*telegram*/) {
        //Skip message
        return true;
    }

    execute(entity) {

        if (this.enabled === true) {

            entity.triggers.push(this);

            entity.getDirection(direction);
            const facing = direction.dot(this.forward);
            
            if (facing < 0) {
                entity.steering.behaviors[0].target = this.region.polygon.centroid;
            }

        }
    
    }

}

export {
    CrosswalkTrigger,
};
