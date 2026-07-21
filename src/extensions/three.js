
import * as THREE from 'three';

class PerspectiveCamera extends THREE.PerspectiveCamera {

    fromJSON(json) {

        this.aspect = json.aspect;
        this.far = json.far;
        this.filmGauge = json.filmGauge;
        this.filmOffset = json.filmOffset;
        this.focus = json.focus;
        this.fov = json.fov;
        // this.layers.set(json.layers);

        this.matrix = new THREE.Matrix4().fromArray(json.matrix);
        this.matrix.decompose(
            this.position,
            this.quaternion,
            this.scale
        );
        this.updateMatrix();

        this.near = json.near;
        this.up = new THREE.Vector3().fromArray(json.up);
        this.zoom = json.zoom;

        this.updateProjectionMatrix();

        return this;
    }

}

export {
    PerspectiveCamera
};
