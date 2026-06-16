
import * as YUKA from 'yuka';

const direction = new YUKA.Vector3();

class CrosswalkTrigger extends YUKA.Trigger {

    constructor(region) {
        super(region);

        this.region = region;

        this.maxNeighbors = 99;
        this.neighborhoodRadius = 10;

        this.position.copy(region.polygon.centroid);

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

class PolygonalTriggerRegion extends YUKA.TriggerRegion {

    constructor(points) {
        super();

        this.polygon = new YUKA.Polygon().fromContour(points);
        this.polygon.computeCentroid();

    }

    touching(entity) {
        return this.polygon.contains(entity.position);
    }

}

export {
    CrosswalkTrigger,
    PolygonalTriggerRegion,
};
