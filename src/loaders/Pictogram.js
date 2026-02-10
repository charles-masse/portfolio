
import * as THREE from 'three';
import {GLTFLoader,} from 'three/addons/loaders/GLTFLoader.js';

import {MAX_AGENTS,} from '../settings.js';

async function PictogramGeo(loadingManager) {

    const geo = new Promise((resolve) => {

        const loader = new GLTFLoader(loadingManager)
            .load('models/pictogram.gltf', (gltf) => {

                let mesh = null;

                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        mesh = child;
                    }
                });

                const geo = mesh.geometry;
                //For VAT setup
                geo.setAttribute('current_frame', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
                geo.setAttribute('length', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
                geo.setAttribute('origin', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));
                geo.setAttribute('amplitude', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));

                // geo.setAttribute('textureStart', new THREE.InstancedBufferAttribute(new Float32Array(MAX_AGENTS), 1));

                resolve(geo);
            },

        );
    });

    return geo;
}

async function PictogramShader(loadingManager) {

    const loaded = new Promise((resolve) => {

        const loader = new THREE.TextureLoader(loadingManager)
            .load('./VAT/animations.png', (animation_texture) => {

            const shader = new THREE.ShaderMaterial({
                vertexShader: `
                    attribute float current_frame;
                    attribute float length;
                    attribute float origin;
                    attribute float amplitude;

                    uniform sampler2D animationAtlas;
                    uniform vec2 atlasSize;

                    void main() {

                        vec3 rest = vec3(0.5059214058523709);
                        float amplitude = 0.9067607074975969;

                        float vertex_id = float(gl_VertexID);
                        vec3 anim_data = texture2D(
                            animationAtlas,
                            vec2(
                                (vertex_id + 0.5) / atlasSize.x,
                                1. - mod((current_frame + 0.5), atlasSize.y) / atlasSize.y
                            )
                        ).rgb;

                        vec3 anim_data_scaled = (anim_data - rest) * amplitude;
                        vec4 world_position = instanceMatrix * vec4(position + anim_data_scaled, 1.0);
                        gl_Position = projectionMatrix * modelViewMatrix * world_position;
                    
                    }
                `,
                fragmentShader: `
                    void main() {
                        gl_FragColor = vec4(0., 0., 0., 1.0);
                    }
                `,
                uniforms: {
                    animationAtlas: {value: animation_texture},
                    atlasSize: {value: new THREE.Vector2(
                        animation_texture.image.width,
                        animation_texture.image.height
                    )}
                },
                side: THREE.DoubleSide,
            });

            resolve(shader);

        });

    });

    return loaded;
}

export {
    PictogramGeo,
    PictogramShader,
};
