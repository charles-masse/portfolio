
import * as THREE from 'three';
//Day/Night
export const START_TIME_SECS = 5;
export const SUN_SPEED = 10;
export const DAY_EVENTS = [
    { //Sunrise
        time: 0,
        sky_color: new THREE.Color(0.690, 0.482, 0.625),
        shadow_color: new THREE.Color(0.965, 0.447, 0.502),
        highlight_color: new THREE.Color(1., 0.847, 0.650),
        emissive_weight: 0,
        emissive_color: new THREE.Color(0., 0., 0.),
    },
    { //Midday
        time: 0.24,
        sky_color: new THREE.Color(0.5, 0.875, 1.),
        shadow_color: new THREE.Color(0., 0.749, 1.),
        highlight_color: new THREE.Color(1., 1., 1.),
        emissive_weight: 0,
        emissive_color: new THREE.Color(0., 0., 0.),
    },
    { //Sunset
        time: 0.5,
        sky_color: new THREE.Color(0.965, 0.447, 0.502),
        shadow_color: new THREE.Color(0.098, 0.098, 0.439),
        highlight_color: new THREE.Color(1., 0.720, 0.420),
        emissive_weight: 0.3,
        emissive_color: new THREE.Color(),
    },
    { //Midnight
        time: 0.75,
        sky_color: new THREE.Color(0.049, 0.049, 0.220),
        shadow_color: new THREE.Color(0.098, 0.098, 0.439),
        highlight_color: new THREE.Color(0.6, 0.720, 1.),
        emissive_weight: 1.,
        emissive_color: new THREE.Color(),
    },
];
//Charts
export const COLORS = [
    'rgb(130, 70, 200)',
    'rgb(220, 200, 40)',
    'rgb(0, 70, 180)',
    'rgb(190, 100, 50)',
    'rgb(0, 200, 220)',
    'rgb(180, 50, 70)',
    'rgb(0, 140, 120)',
    'rgb(220, 140, 40)',
    'rgb(40, 180, 90)',
    'rgb(150, 200, 60)',
];
