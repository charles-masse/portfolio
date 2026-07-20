
import * as THREE from 'three';

import {loadOBJ, loadTexture,} from '../../utilities/loaders.js';

import {START_TIME_SECS, SUN_SPEED, DAY_EVENTS,} from '../../settings.js';

let elapsed = 0;

export class City {

    constructor(scene, loadingManager) {

        this.scene = scene;

        this.objects = new THREE.Group();

        this.current_event = 0;
        
        this.#initialize(loadingManager);

    }

    async #initialize(loadingManager) {

        this.initialized = false;

        await this.#initCity(loadingManager);

        this.initialized = true;

    }

    async #initCity(loadingManager) {

        this.scene.background = new THREE.Color();

        const emission = await loadTexture('City/emission.jpg', loadingManager);
        emission.minFilter = THREE.NearestFilter;
        emission.magFilter = THREE.NearestFilter;

        this.city = await loadOBJ('City/model.obj', loadingManager);
        this.city.castShadow = true;
        this.city.receiveShadow = true;

        this.city.material = new THREE.MeshStandardMaterial({
            color: 0xbcd1e4,
            emissive: new THREE.Color(1, 1, 1),
            emissiveMap: emission,
        });
        //Video screen
        this.video = document.getElementById('video');

        const videoMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.VideoTexture(this.video),
        });

        const screen = new THREE.PlaneGeometry(19.2, 10.8);

        const videoScreen = new THREE.Mesh(screen, videoMaterial);
        //Play icon
        const play_plane = new THREE.PlaneGeometry(4, 4);

        const play_icon = await loadTexture('City/play.png', loadingManager);
        play_icon.minFilter = THREE.NearestFilter;
        play_icon.magFilter = THREE.NearestFilter;

        const material = new THREE.MeshBasicMaterial({
            map: play_icon,
            transparent: true,
        });
        this.playButton = new THREE.Mesh(play_plane, material);
        //Parent icon to screen with tiny offset
        this.playButton.position.set(0, 0, 0.1);
        videoScreen.attach(this.playButton);

        videoScreen.position.set(1.25, 11.5, 7);
        //Lights
        this.sun = new THREE.DirectionalLight(0xffffff, 1);
        this.sun.castShadow = true;
        // this.sun.shadow.bias = -0.001;
        this.sun.shadow.mapSize.set(1024, 1024);
        this.sun.update = function(t) {

            const radius = 75;
            const inclination = 100;
            const azimuth = 0;

            const theta = THREE.MathUtils.degToRad(-SUN_SPEED) * t;

            const pos = new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta));
            pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(inclination));
            pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(azimuth));

            this.position.copy(pos);

        };
        //Helper
        this.sun_helper = new THREE.DirectionalLightHelper(this.sun, 1);
        this.sun_helper.visible = false;
        //Ambient
        this.ambient = new THREE.AmbientLight(0xffffff, 1);

        this.objects.add(
            this.sun,
            this.sun_helper,
            this.ambient,
            this.city,
            videoScreen,
        );

    }

    interact() {

        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }

        this.playButton.visible = this.video.paused;

    }

    update(delta) {

        elapsed += delta;

        if (this.sun) {

            const time_offset = elapsed + START_TIME_SECS;
            const day_full = 360 / Math.abs(SUN_SPEED);
            const day_portion = (time_offset / day_full) % 1;

            let current_time;
            let next_time;
            for (let i = 0; i < DAY_EVENTS.length; i++) {
                
                current_time = DAY_EVENTS[i].time;
                next_time = DAY_EVENTS[(i + 1) % DAY_EVENTS.length].time;
                
                if (next_time < current_time) next_time++;

                if (day_portion >= current_time && day_portion < next_time) {

                    this.current_event = i;

                    break;
                }

            }
            //Check for current event id
            const current_id = this.current_event;
            //Send message to car module
            const cars = this.bridge.get('Cars');

            this.bridge.sendMessage(this, cars, '[Nightfall] Current event', 0, current_id);

            const current = DAY_EVENTS[current_id];

            const next_id = (this.current_event + 1) % DAY_EVENTS.length;
            const next = DAY_EVENTS[next_id];

            let blend_factor;
            if (current_id < next_id) {
                blend_factor = THREE.MathUtils.inverseLerp(current.time, next.time, day_portion);
            } else {
                blend_factor = THREE.MathUtils.inverseLerp(current.time, next.time + 1., day_portion);
            }
            //Sun
            this.sun.color.lerpColors(current.highlight_color, next.highlight_color, blend_factor);
            this.sun.update(time_offset);
            this.sun_helper.update();
            //Shadow color
            this.ambient.color.lerpColors(current.shadow_color, next.shadow_color, blend_factor);
            //Sky
            this.scene.background.lerpColors(current.sky_color, next.sky_color, blend_factor);
            //Building lights
            this.city.material.emissiveIntensity = THREE.MathUtils.lerp(current.emissive_weight, next.emissive_weight, blend_factor);
            this.city.material.emissive.lerpColors(current.emissive_color, next.emissive_color, blend_factor);
        }

    }

}
