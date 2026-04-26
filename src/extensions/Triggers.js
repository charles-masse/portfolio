
import * as YUKA from 'yuka';

class PolygonalTriggerRegion extends YUKA.TriggerRegion {

    constructor(points) {
        super();

        this.polygon = new YUKA.Polygon().fromContour(points);
        this.polygon.computeCentroid();

    }

    touching(entity) {
        return this.polygon.contains(entity.position);
    }

    update(trigger) {

        trigger.position = this.polygon.centroid;

        return this;
    }

}

export {
    PolygonalTriggerRegion,
};
