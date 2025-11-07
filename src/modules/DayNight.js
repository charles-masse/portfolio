
import * as THREE from 'three';

const START_TIME_SECS = 5;
const SUN_SPEED = -20;

const DAY_EVENTS = [
    {   //Sunrise
        time:0,
        top_color:{r:106, g:132, b:191},
        bot_color:{r:246, g:114, b:128},
        ambient_color:{r:246, g:114, b:128},
    },
    {   //Midday
        time:0.24,
        top_color:{r:0, g:191, b:255},
        bot_color:{r:255, g:255, b:255},
        ambient_color:{r:0, g:191, b:255},
    },
    {   //Sunset
        time:0.5,
        top_color:{r:246, g:114, b:128},
        bot_color:{r:246, g:114, b:128},
        ambient_color:{r:25, g:25, b:112},
    },
    {   //Midnight
        time:0.75,
        top_color:{r:25, g:25, b:112},
        bot_color:{r:0, g:0, b:0},
        ambient_color:{r:25, g:25, b:112},
    },
];

export class DayNight {

    constructor(scene, canvas, debug=false) {

        this.canvas = canvas;
        this.debug = debug;
        //Lights
        this.sun = new THREE.DirectionalLight(0xffffff, 20);
        this.sun.castShadow = true;
        this.sun.shadow.radius = 2;
        this.sun.shadow.bias = -0.001;
        this.sun.shadow.mapSize.set(2048, 2048);
        scene.add(this.sun);

        this.helper = new THREE.DirectionalLightHelper(this.sun, 1);
        if (this.debug) scene.add(this.helper);
        this.ambient = new THREE.AmbientLight(0xffffff, 10);
        scene.add(this.ambient);

        this.current_event = 0;

    }

    sunOrbit(t) {

        const radius = 7.5;
        const inclination = 100;
        const azimuth = 0;

        const theta = THREE.MathUtils.degToRad(SUN_SPEED) * t;

        const pos = new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta));
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(inclination));
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(azimuth));

        return pos;
    }

    colorChange(t) {

        const day_full = 360 / Math.abs(SUN_SPEED);
        const day_portion = (t % day_full) / day_full;

        let current_event;
        let current_time;
        let next_event;
        let next_time;
        for (let i = 0; i < DAY_EVENTS.length; i++) {
            current_time = DAY_EVENTS[i].time;

            const next_idx = (i + 1) % DAY_EVENTS.length;
            next_time = DAY_EVENTS[next_idx].time;
            if (next_time < current_time) next_time += 1;

            if (day_portion >= current_time && day_portion < next_time) {
                current_event = i;
                next_event = (current_event + 1) % DAY_EVENTS.length;
                break;
            }

        }

        const blend_factor = THREE.MathUtils.inverseLerp(current_time, next_time, day_portion);

        const top_color = lerpColor(DAY_EVENTS[current_event].top_color, DAY_EVENTS[next_event].top_color, blend_factor);
        const bot_color = lerpColor(DAY_EVENTS[current_event].bot_color, DAY_EVENTS[next_event].bot_color, blend_factor);
        const ambient_color = lerpColor(DAY_EVENTS[current_event].ambient_color, DAY_EVENTS[next_event].ambient_color, blend_factor);

        return [
            colorToString(top_color),
            colorToString(bot_color),
            colorToString(ambient_color),
        ];
    }

    update() {

        const time_in_secs = (performance.now() / 1000) + START_TIME_SECS;
        //Sun
        this.sun.position.copy(this.sunOrbit(time_in_secs));
        this.helper.update();
        //Ambient
        const [top_color, bot_color, ambient_color] = this.colorChange(time_in_secs);
        this.canvas.style.background = `linear-gradient(to bottom, ${top_color}, ${bot_color})`;
        this.ambient.color.set(ambient_color);

    }

}

function lerpColor(c1, c2, t) {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
    };
}

function colorToString(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
