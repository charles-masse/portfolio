
import * as THREE from 'three';
//
function lerpColor(c1, c2, t) {

    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
    };

}
//
export class DayNight {

    constructor(scene, canvas, debug=false) {
        // Settings
        this.radius = 7.5;
        this.omega = -5; // Speed
        this.inclination = 100;
        this.azimuth = 0;

        this.canvas = canvas;
        this.debug = debug;

        this.sun = new THREE.DirectionalLight(0xffffff, 20);
        this.sun.castShadow = true;
        this.sun.shadow.radius = 2;
        this.sun.shadow.bias = -0.001;
        this.sun.shadow.mapSize.set(2048, 2048);
        scene.add(this.sun);

        this.helper = new THREE.DirectionalLightHelper(this.sun, 1);
        if (this.debug) {
            scene.add(this.helper);
        }
        this.ambient = new THREE.AmbientLight(0xffffff, 10);
        scene.add(this.ambient);
    }

    sunOrbit(t) {

        const theta = THREE.MathUtils.degToRad(this.omega) * t;

        const pos = new THREE.Vector3(this.radius * Math.cos(theta), 0, this.radius * Math.sin(theta));
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(this.inclination));
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.azimuth));

        if (this.debug) {
            console.log(`Sun Orbit position : ${pos.toArray()}`);
        }
        return pos;

    }

    colorChange(t) {

        const day_full = 360 / Math.abs(this.omega);
        const day_portion = (t % (day_full)) / day_full;

        let color;
        if (day_portion > 0.5) {
            color = {r:25, g:25, b:112};
        } else {
            color = lerpColor({r:0, g:191, b:255}, {r:25, g:25, b:112}, day_portion * 2);
        }

        if (this.debug) {
            console.log(`Ambient Color : rgb(${color.r}, ${color.g}, ${color.b})`);
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;

    }

    update() {
        // Time in seconds
        const time_in_secs = performance.now() / 1000;
        // Sun
        this.sun.position.copy(this.sunOrbit(time_in_secs));
        this.helper.update();
        // Ambient
        const ambientColor = this.colorChange(time_in_secs);
        this.ambient.color.set(ambientColor);
        this.canvas.style.background = `linear-gradient(to bottom, ${ambientColor}, rgb(255, 255, 255))`;

    }

}
