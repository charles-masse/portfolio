import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
//Scene
const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry(5, 5, 5);
const material = new THREE.MeshBasicMaterial({color: 0xffffff});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
//Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 5, 10);
camera.lookAt(0, 0, 0);
//Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
//Passes
const idRender = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
)

const composer = new EffectComposer(renderer);

const beautyPass = new RenderPass(scene, camera);
composer.addPass(beautyPass);

const outlineShader = new THREE.ShaderMaterial({

    uniforms: {
        tDiffuse: {value: beautyPass.texture},
        uTexture: {value: idRender.texture},

        width: {value: window.innerWidth},
        height: {value: window.innerHeight},

        outlineThickness: {value: 2},
        outlineColor: {value: new THREE.Color(0x00ff00)},
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
        uniform sampler2D uTexture;

        uniform float width;
        uniform float height;

        uniform float outlineThickness;
        uniform vec3 outlineColor;

        varying vec2 vUv;

        void make_kernel(inout vec4 n[9], sampler2D tex, vec2 coord)
        {

            float w = outlineThickness / width;
            float h = outlineThickness / height;

            n[0] = texture2D(tex, coord + vec2(-w, -h));
            n[1] = texture2D(tex, coord + vec2(0.0, -h));
            n[2] = texture2D(tex, coord + vec2(w, -h));
            n[3] = texture2D(tex, coord + vec2(-w, 0.0));
            n[4] = texture2D(tex, coord);
            n[5] = texture2D(tex, coord + vec2(w, 0.0));
            n[6] = texture2D(tex, coord + vec2(-w, h));
            n[7] = texture2D(tex, coord + vec2(0.0, h));
            n[8] = texture2D(tex, coord + vec2(w, h));

        }

        void main() {

            vec4 n[9];
            make_kernel(n, uTexture, vUv);

            vec4 sobel_h = n[2] + 2.0*n[5] + n[8] - (n[0] + 2.0*n[3] + n[6]);
            vec4 sobel_v = n[0] + 2.0*n[1] + n[2] - (n[6] + 2.0*n[7] + n[8]);
            vec3 sobel = sqrt(sobel_h.rgb * sobel_h.rgb + sobel_v.rgb * sobel_v.rgb);

            vec3 beauty = texture2D(tDiffuse, vUv).rgb;

            float edge = length(sobel);

            vec3 finalColor = mix(beauty, outlineColor, edge);

            gl_FragColor = vec4(finalColor, 1.0);

        }

    `,
});

const outlinePass = new ShaderPass(outlineShader);
composer.addPass(outlinePass);

animate();

function animate() {
    
    renderer.setRenderTarget(idRender);
    renderer.clear();
    renderer.render(scene, camera);

    composer.render();

}
