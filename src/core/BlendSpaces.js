
import * as THREE from 'three';

import * as YUKA from 'yuka';

import Delaunator from 'delaunator';

class LocomotionClip {

    constructor(name) {

        this.name = name;
        this.locomotion = new YUKA.Vector3();

    }

}

class BlendSpaces {

    constructor(owner) {

        this.owner = owner;

        this.clips = [];
        this.triangles = [];

    }

    add(clip) {

        this.clips.push(clip);

        this.update();

    }

    remove(clip_name) {

        const index = this.clips.indexOf(clip_name);
        if (index > -1) {
          this.clips.splice(index, 1);
        }

        this.update();

    }

    getClipWeights(local_velocity) {
        //Find the triangle where the locomotion resides
        let results = {};
        
        for (let i = 0; i < this.triangles.length; i += 3) {

            const triangle = new THREE.Triangle(
                this.clips[this.triangles[i]].locomotion,
                this.clips[this.triangles[i+1]].locomotion,
                this.clips[this.triangles[i+2]].locomotion
            );

            if (triangle.containsPoint(local_velocity)) {
                results = {triangle:triangle, id:i};
                break;
            }

        }
        //Find the weights of each clips
        let barycentric_coords = new THREE.Vector3();

        if (results) {
            results.triangle.getBarycoord(local_velocity, barycentric_coords);

            return {
                clips : [
                    this.clips[this.triangles[results.id]],
                    this.clips[this.triangles[results.id+1]],
                    this.clips[this.triangles[results.id+2]]
                ],
                weights : barycentric_coords
            };

        }

        return null;

    }

    update() {
        //Delaunay triangulation
        const delaunay = new Delaunator(this.clips.flatMap(clip => [clip.locomotion.x, clip.locomotion.z]));
        this.triangles = delaunay.triangles;

    }

}

export {
    LocomotionClip,
    BlendSpaces,
};