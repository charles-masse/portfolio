
import * as THREE from 'three';

export class DayNight {

    constructor() {

        this.radius = 5;

        this.omega = -5; // Speed

        this.inclination = 100;
        this.azimuth = 0;

    }

    orbit(time) {

        const theta = THREE.MathUtils.degToRad(this.omega) * time;

        const pos = new THREE.Vector3(this.radius * Math.cos(theta), 0, this.radius * Math.sin(theta));

        pos.applyAxisAngle(new THREE.Vector3(1,0,0), THREE.MathUtils.degToRad(this.inclination));
        pos.applyAxisAngle(new THREE.Vector3(0,1,0), THREE.MathUtils.degToRad(this.azimuth));

        // console.log(pos);
        return pos;

    }

    color_change(time) {

        const full_day = 360 / Math.abs(this.omega);

        if (time % full_day + 1 > full_day / 2) {
            return 'MidnightBlue';
        } else {
            return 'DeepSkyBlue';
        }

        return color;

    }

    update(time) {

        const sunPos = this.orbit(time);
        const ambientColor = this.color_change(time);

        return {sunPos, ambientColor};

    }

}
