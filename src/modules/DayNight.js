
import * as THREE from 'three';

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
        //Settings
        this.radius = 7.5;
        this.omega = -10; // Speed
        this.inclination = 100;
        this.azimuth = 0;
        //Lights
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

        this.current_event = 0;

    }

    sunOrbit(t) {

        const theta = THREE.MathUtils.degToRad(this.omega) * t;

        const pos = new THREE.Vector3(this.radius * Math.cos(theta), 0, this.radius * Math.sin(theta));
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(this.inclination));
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(this.azimuth));

        return pos;
    }

    colorChange(t) {

        const day_full = 360 / Math.abs(this.omega);
        const day_portion = (t % day_full) / day_full;

        let current_event;
        let next_event;
        for (let i = 0; i < DAY_EVENTS.length; i++) {
            const idx_time = DAY_EVENTS[i].time;

            const next_idx = (i + 1) % DAY_EVENTS.length;
            let next_idx_time = DAY_EVENTS[next_idx].time;
            if (next_idx_time < idx_time) next_idx_time += 1;

            if (day_portion >= idx_time && day_portion < next_idx_time) {
                current_event = i;
                next_event = (current_event + 1) % DAY_EVENTS.length;
                break;
            }

        }

        const curent_time = DAY_EVENTS[current_event].time;
        const next_time = DAY_EVENTS[next_event].time;
        const blend_factor = lerpFactor(curent_time, next_time, day_portion);

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

        const time_in_secs = performance.now() / 1000;
        //Sun
        this.sun.position.copy(this.sunOrbit(time_in_secs));
        this.helper.update();
        //Ambient
        const [top_color, bot_color, ambient_color] = this.colorChange(time_in_secs);
        this.canvas.style.background = `linear-gradient(to bottom, ${top_color}, ${bot_color})`;
        this.ambient.color.set(ambient_color);

    }

}

function lerpFactor(a, b, value) {
    if (a > b) b += 1; //Cheat for now, make it better if needed
    return (value - a) / (b - a);
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
