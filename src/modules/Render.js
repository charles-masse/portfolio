
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

export default class {

    constructor(renderer, camera, scene) {

        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;
        
        this.composer = new EffectComposer(this.renderer);
        //Color id
        this.idRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        //Depth
        this.depthRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.depthRender.depthTexture = new THREE.DepthTexture();
        this.depthRender.depthTexture.type = THREE.UnsignedShortType;
        this.depthRender.depthTexture.format = THREE.DepthFormat;
        this.depthRender.depthBuffer = true;
        //Beauty
        this.beautyPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.beautyPass);
        //Outline
        const outlineShader = new THREE.ShaderMaterial({

            uniforms: {

                tDiffuse: {value: this.beautyPass.texture},
                tDepth: {value: this.depthRender.depthTexture},
                tId: {value: this.idRender.texture},

                width: {value: window.innerWidth},
                height: {value: window.innerHeight},
                
                outlineColor: {value: new THREE.Color(0xffffff)},

            },

            vertexShader: `

                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }

            `,

            fragmentShader: `

                uniform sampler2D tDiffuse;
                uniform sampler2D tDepth;
                uniform sampler2D tId;

                uniform float width;
                uniform float height;

                uniform vec3 outlineColor;

                varying vec2 vUv;

                void make_kernel(inout vec4 n[9], inout float d[9], sampler2D tex, sampler2D depthTex, vec2 coord) {

                    float depth = texture2D(depthTex, coord).r;

                    float w = ((1.0 - depth) * 150.0) / width;
                    float h = ((1.0 - depth) * 150.0) / height;

                    vec2 offsets[9];
                    offsets[0] = vec2(-w, -h);
                    offsets[1] = vec2(0.0, -h);
                    offsets[2] = vec2(w, -h);
                    offsets[3] = vec2(-w, 0.0);
                    offsets[4] = vec2(0.0, 0.0);
                    offsets[5] = vec2(w, 0.0);
                    offsets[6] = vec2(-w, h);
                    offsets[7] = vec2(0.0, h);
                    offsets[8] = vec2(w, h);

                    for (int i = 0; i < 9; i++) {
                        n[i] = texture2D(tex, coord + offsets[i]);
                        d[i] = texture2D(depthTex, coord + offsets[i]).r;
                    }

                }

                void main() {

                    vec4 n[9];
                    float d[9];

                    make_kernel(n, d, tId, tDepth, vUv);
                    //Sobel
                    vec4 sobel_h = n[2] + 2. * n[5] + n[8] - (n[0] + 2. * n[3] + n[6]);
                    vec4 sobel_v = n[0] + 2. * n[1] + n[2] - (n[6] + 2. * n[7] + n[8]);
                    vec3 sobel = sqrt(sobel_h.rgb * sobel_h.rgb + sobel_v.rgb * sobel_v.rgb);

                    float edge = length(sobel);
                    //Depth occlusion
                    float depth = d[4];
                    vec4 id = n[4];

                    float occluded = 0.;

                    float depthThreshold = 0.05;

                    for (int i = 0; i < 9; i++) {
                        if (i == 4) continue;

                        bool differentObject = distance(n[i], id) > 0.001;
                        bool neighborCloser = d[i] < depth - depthThreshold;

                        if (differentObject && neighborCloser) {
                            occluded = 1.0;
                            break;
                        }
                    }

                    edge *= (1. - occluded);
                    //Mix colors
                    vec3 beauty = texture2D(tDiffuse, vUv).rgb;
                    vec3 finalColor = mix(beauty, outlineColor, edge);
                    gl_FragColor = vec4(finalColor, 1.);
                
                }

            `,
        });

        this.outlinePass = new ShaderPass(outlineShader);
        this.composer.addPass(this.outlinePass);

    }

    update() {

        const crowd = this.scene.children[2].children[0];

        this.camera.layers.set(1);
        crowd.layers.set(1);

        this.renderer.setRenderTarget(this.idRender);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        this.renderer.setRenderTarget(this.depthRender);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        this.camera.layers.set(0);
        crowd.layers.set(0);

        this.renderer.setRenderTarget(null);

        this.composer.render();

    }

}
