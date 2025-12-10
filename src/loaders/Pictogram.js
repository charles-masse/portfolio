
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

async function PictogramGeo(loadingManager) {

    const loaded = new Promise((resolve) => {

        const loader = new GLTFLoader(loadingManager);
        loader.load('models/pictogram.gltf', (gltf) => {

                let mesh = null;

                gltf.scene.traverse((child) => {
                    if (child.isMesh) mesh = child;
                });

                resolve(mesh.geometry);
            },

        );
    });

    return loaded;

}

async function PictogramShader(loadingManager) {

    const loaded = new Promise((resolve) => {

        const loader = new THREE.TextureLoader(loadingManager);
        loader.load('./textures/animations.png', (animation_texture) => {

            const shader = new THREE.ShaderMaterial({
                vertexShader: `
                    attribute float instance_frame;

                    uniform sampler2D animationAtlas;
                    uniform vec2 atlasSize;

                    void main() {
                        float vertex_id = float(gl_VertexID);
                        vec3 anim_data = texture2D(
                            animationAtlas,
                            vec2(
                                (vertex_id + 0.5) / atlasSize.x,
                                (mod(48.0 - instance_frame + 0.5, atlasSize.y)) / atlasSize.y
                            )
                        ).rgb;

                        vec3 anim_data_scaled = anim_data * 3.6485204696655273;
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

export {PictogramGeo, PictogramShader};
