
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

import idMaterial from '/src/shaders/idMaterial.js';
import depthMaterial from '/src/shaders/depthMaterial.js';
import outlineShader from '/src/shaders/outlineShader.js';

const AGENT_NUM = 10;
//Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

const geometry = new THREE.BoxGeometry(5, 5, 5);
geometry.setAttribute('instance_id', new THREE.InstancedBufferAttribute(new Float32Array(AGENT_NUM), 1));
geometry.setAttribute('instance_depth', new THREE.InstancedBufferAttribute(new Float32Array(AGENT_NUM), 1));
//Instances
const instancedMesh = new THREE.InstancedMesh(geometry, new idMaterial(), AGENT_NUM);

const color = new Float32Array(AGENT_NUM * 3);

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

    camDist[i] = trans.clone().sub(camera.position).length();

}

instancedMesh.instanceMatrix.needsUpdate = true;
instancedMesh.geometry.setAttribute("instance_id", new THREE.InstancedBufferAttribute(color, 3));
instancedMesh.geometry.setAttribute("instance_depth", new THREE.InstancedBufferAttribute(camDist, 1));

scene.add(instancedMesh);
//Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
//Passes
const composer = new EffectComposer(renderer);

const idRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const depthRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

const beautyPass = new RenderPass(scene, camera);
composer.addPass(beautyPass);

const outlinePass = new ShaderPass(new outlineShader(idRender));
composer.addPass(outlinePass);

animate();

function animate() {
    
    renderer.setRenderTarget(idRender);
    renderer.clear();
    renderer.render(scene, camera);

    instancedMesh.material = new depthMaterial();

    renderer.setRenderTarget(depthRender);
    renderer.clear();
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);

    composer.render();

}
