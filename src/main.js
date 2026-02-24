import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

const AGENT_NUM = 10;
//Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
//Scene
const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry(5, 5, 5);
geometry.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(AGENT_NUM), 1));
geometry.setAttribute('cam_dist', new THREE.InstancedBufferAttribute(new Float32Array(AGENT_NUM), 1));
//Geo
const material = new THREE.ShaderMaterial({

    vertexShader: `

        attribute vec3 instance_id;
        varying vec3 vColor;

        void main() {

            vColor = instance_id;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);

        }

    `,

    fragmentShader: `

        varying vec3 vColor;

        void main() {

            gl_FragColor = vec4(vColor, 1.0);

        }

    `,
});

const instancedMesh = new THREE.InstancedMesh(geometry, material, AGENT_NUM);

const color = new Float32Array(AGENT_NUM * 3);
const camDist = new Float32Array(AGENT_NUM);

for (let i = 0; i < AGENT_NUM; i++) {

    const trans = new THREE.Vector3((Math.random() * 50) - 25, 0, Math.random() * -100)

    const translation = new THREE.Matrix4().makeTranslation(trans);
    const rotation = new THREE.Matrix4().makeRotationZ(Math.random() * 360);

    const position_matrix = new THREE.Matrix4().multiplyMatrices(translation, rotation);

    instancedMesh.setMatrixAt(i, position_matrix);

    for (let i = 0; i < AGENT_NUM; i++) {
        color[i * 3 + 0] = Math.random();
        color[i * 3 + 1] = Math.random();
        color[i * 3 + 2] = Math.random();
    }

}

instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
instancedMesh.geometry.setAttribute("cam_dist", new THREE.InstancedBufferAttribute(camDist, 1));
instancedMesh.instanceMatrix.needsUpdate = true;

scene.add(instancedMesh);
//Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
//Passes
const idRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const depthRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

depthRender.depthTexture = new THREE.DepthTexture();
depthRender.depthTexture.type = THREE.UnsignedShortType;
depthRender.depthTexture.format = THREE.DepthFormat;
depthRender.depthBuffer = true;

const composer = new EffectComposer(renderer);

const beautyPass = new RenderPass(scene, camera);
composer.addPass(beautyPass);

const outlineShader = new THREE.ShaderMaterial({

    uniforms: {
        tDiffuse: {value: beautyPass.texture},
        tDepth: { value: depthRender.depthTexture },
        tId: {value: idRender.texture},

        width: {value: window.innerWidth},
        height: {value: window.innerHeight},

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
        uniform sampler2D tDepth;
        uniform sampler2D tId;

        uniform float width;
        uniform float height;

        uniform vec3 outlineColor;

        varying vec2 vUv;

        void make_kernel(inout vec4 n[9], sampler2D tex, vec2 coord)
        {

            float w = (1. - texture2D(tDepth, vUv).r) * (400. / width);
            float h = (1. - texture2D(tDepth, vUv).r) * (400. / height);

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
            make_kernel(n, tId, vUv);

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

    renderer.setRenderTarget(depthRender);
    renderer.clear();
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);

    composer.render();

}
