
// import * as THREE from 'three';

import * as YUKA from 'yuka';

// const toTrigger = new YUKA.Vector3();

class LightTrigger extends YUKA.Trigger {

    constructor(region) {
        super(region);

        this.maxNeighbors = 99;
        this.neighborhoodRadius = 10;

    }

    // execute(entity) {

    //     toTrigger.subVectors(this.position, entity.position);
    //     const distance_toTrigger = toTrigger.length();

    //     const override = THREE.MathUtils.inverseLerp(20, 10, distance_toTrigger);

    //     // const facing = this.forward.dot(toTrigger.normalize());

    //     if (this.state === 0 && entity.steering.behaviors[0].override < override/* && facing > 0*/) {
    //         entity.steering.behaviors[0].override = override;
    //     }

    // }

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
    LightTrigger,
    PolygonalTriggerRegion,
};
