
import * as THREE from 'three';

import {loadOBJ,} from '../../utilities/loaders.js';

import {START_TIME_SECS, SUN_SPEED, DAY_EVENTS,} from '../../settings.js';

export class City {

    constructor(scene, loadingManager) {

        this.scene = scene;

        this.objects = new THREE.Group();

        this.current_event = 0;
        
        this.init(loadingManager);

    }

    async init(loadingManager) {

        this.scene.background = new THREE.Color();

        const city = await loadOBJ('City/model.obj', loadingManager);
        city.material = new THREE.MeshStandardMaterial({color: 0xbcd1e4});
        city.castShadow = true;
        city.receiveShadow = true;
        //Video screen
        this.video = document.getElementById('video');

        const videoMaterial =  new THREE.MeshBasicMaterial({
            map: new THREE.VideoTexture(this.video),
        });
        const screen = new THREE.PlaneGeometry(19.2, 10.8);
        const videoScreen = new THREE.Mesh(screen, videoMaterial);
        videoScreen.position.set(1.25, 11.5, 7);
        //TODO change to an actual icon
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshBasicMaterial();
        this.playButton = new THREE.Mesh(geometry, material);
        this.playButton.position.set(1.25, 11.5, 7);
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
            this.playButton,
            this.sun,
            this.sun_helper,
            this.ambient,
            city,
            videoScreen,
        );

    }

    update(elapsed) {

        if (this.sun) {

            const time_offset = elapsed + START_TIME_SECS;
            const day_full = 360 / Math.abs(SUN_SPEED);
            const day_portion = (time_offset / day_full) % 1;

            let current_time;
            let next_time;
            for (let i = 0; i < DAY_EVENTS.length; i++) {
                
                current_time = DAY_EVENTS[i].time;
                next_time = DAY_EVENTS[(i + 1) % DAY_EVENTS.length].time;
                
                if (next_time < current_time) next_time += 1;

                if (day_portion >= current_time && day_portion < next_time) {

                    this.current_event = i;

                    break;
                }

            }

            const current_id = this.current_event;
            const current = DAY_EVENTS[current_id];

            const next_id = (this.current_event + 1) % DAY_EVENTS.length
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
            // this.emissives.children[0].material.emissiveIntensity = this.cityLights(time_offset);

        }

    }

    interact() {

        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }

        this.playButton.visible = this.video.paused;
        //Send message to agents
        // this.pedestrians.manager.entities.forEach((entity) => {
        //     this.pedestrians.manager.sendMessage(this, entity, '[MovieScreen] State Change', 0, this.video.paused);
        // });
        
    }

}
