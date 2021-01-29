////////////////////////////////////////////////////////////////////////////////
// Moving flashlight - make the flashlight move by changing the position in
// the fragment shader
////////////////////////////////////////////////////////////////////////////////
/*global THREE, requestAnimationFrame, Detector, dat */
import * as THREE from 'https://unpkg.com/three@0.119.0/build/three.module.js';
import { TrackballControls } from 'https://unpkg.com/three@0.119.0/examples/jsm/controls/TrackballControls.js';
import { TeapotBufferGeometry } from 'https://unpkg.com/three@0.119.0/examples/jsm/geometries/TeapotBufferGeometry.js';
import {GUI} from "https://unpkg.com/three@0.119.0/examples/jsm/libs/dat.gui.module.js";

var container, camera, scene, renderer;
var cameraControls;
var effectController;
var clock = new THREE.Clock();
var teapotSize = 600;
var tess = 7; 
var newTess = tess;
var tessLevel = [2, 3, 4, 5, 6, 8, 10, 12, 16, 24, 32];
var maxTessLevel = tessLevel.length - 1;
var ambientLight, light;
var teapot;
var phongBalancedMaterial;
var phongBalancedGroundMaterial;
var flashlightOffset;

function init() {
	var canvasWidth = 846; 
	var canvasHeight = 494;
	var canvasRatio = canvasWidth / canvasHeight;

	// LIGHTS
	ambientLight = new THREE.AmbientLight(0x333333); // 0.2

	light = new THREE.DirectionalLight(0xffffff, 1.0);
	// direction is set by controller

	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(new THREE.Color(0xAAAAAA), 1.0);

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// CAMERA
	camera = new THREE.PerspectiveCamera(45, canvasRatio, 0.01, 800);
	camera.position.set( 4.3, 8.9, 10.6 );

	// CONTROLS
	cameraControls = new TrackballControls(camera, renderer.domElement);
	cameraControls.target.set(0, 0.5, 0);

	// MATERIALS
	flashlightOffset = new THREE.Vector2();

	var materialColor = new THREE.Color();
	materialColor.setHSL(1.0, 0.8, 0.6);

	phongBalancedMaterial = createShaderMaterial("phongBalanced", light, ambientLight);
	phongBalancedMaterial.uniforms.uMaterialColor.value.copy(materialColor);
	phongBalancedMaterial.side = THREE.DoubleSide;

	phongBalancedGroundMaterial = createShaderMaterial("phongBalanced", light, ambientLight);
	phongBalancedGroundMaterial.side = THREE.DoubleSide;
	phongBalancedGroundMaterial.uniforms.shininess.value = 20;
	phongBalancedGroundMaterial.uniforms.uKd.value = 0.5;
	phongBalancedGroundMaterial.uniforms.uKs.value = 0.2;

    materialColor.setRGB(0, 1, 1);
	phongBalancedGroundMaterial.uniforms.uMaterialColor.value.copy(materialColor);
	phongBalancedGroundMaterial.uniforms.uSpecularColor.value.copy(materialColor);

}


function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x808080, 2000, 4000);

	scene.add(camera);

	scene.add(ambientLight);
	scene.add(light);

	var teapotSize = 1;
	var teapot = new THREE.Mesh(
		new TeapotBufferGeometry(teapotSize, 20, true, true, true, true), 
		phongBalancedMaterial);
	teapot.position.y += teapotSize;

	var solidGround = new THREE.Mesh(
		new THREE.PlaneGeometry( 100, 100, 1,1 ),
		phongBalancedGroundMaterial );
	solidGround.rotation.x = - Math.PI / 2;
	scene.add( solidGround );

	scene.add(teapot);
}

function loadShader(shadertype) {
  console.log('document', document.getElementById(shadertype));
	return document.getElementById(shadertype).textContent;
}

function createShaderMaterial(id, light, ambientLight) {

	var shaderTypes = {

		'phongBalanced' : {

			uniforms: {

				"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
				"uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },

				"uAmbientLightColor": { type: "c", value: new THREE.Color( 0x050505 ) },

				"uMaterialColor":  { type: "c", value: new THREE.Color( 0xffffff ) },
				"uSpecularColor":  { type: "c", value: new THREE.Color( 0xffffff ) },

				uKd: {
					type: "f",
					value: 0.7
				},
				uKs: {
					type: "f",
					value: 0.3
				},
				shininess: {
					type: "f",
					value: 100.0
				},
				uDropoff: {
					type: "f",
					value: 0.5
				}
			}
		}

	};

	var shader = shaderTypes[id];

	var u = THREE.UniformsUtils.clone(shader.uniforms);

	// this line will load a shader that has an id of "vertex" from the .html file
	var vs = loadShader("vertex");
	// this line will load a shader that has an id of "fragment" from the .html file
	var fs = loadShader("fragment");

	var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;

	material.uniforms.uAmbientLightColor.value = ambientLight.color;

	return material;

}

function setupGui() {

	effectController = {

		shininess: 100.0,
		dropoff: 0.5,
		ka: 0.2,
		kd: 0.4,
		ks: 0.35,
		metallic: false,

		hue: 0.09,
		saturation: 0.46,
		lightness: 0.7,

		lhue: 0.04,
		lsaturation: 0.0,
		llightness: 0.7,

		// bizarrely, if you initialize these with negative numbers, the sliders
		// will not show any decimal places.
		lx: 0.65,
		ly: 0.43,
		lz: 0.35,
		newTess: 10
	};

	var h;

	var gui = new GUI();

	h = gui.addFolder("Material control");

	h.add(effectController, "shininess", 1.0, 1000.0, 1.0).name("shininess");
	h.add(effectController, "dropoff", 0.0, 2.0, 0.025).name("dropoff");
	h.add(effectController, "ka", 0.0, 1.0, 0.025).name("Ka");
	h.add(effectController, "kd", 0.0, 1.0, 0.025).name("Kd");
	h.add(effectController, "ks", 0.0, 1.0, 0.025).name("Ks");
	h.add(effectController, "metallic");
	h.add(effectController, "newTess", [2,3,4,5,6,8,10,12,16,24,32] ).name("Tessellation Level");

	// material (color)

	h = gui.addFolder("Material color");

	h.add(effectController, "hue", 0.0, 1.0, 0.025).name("m_hue");
	h.add(effectController, "saturation", 0.0, 1.0, 0.025).name("m_saturation");
	h.add(effectController, "lightness", 0.0, 1.0, 0.025).name("m_lightness");

	// light (point)

	h = gui.addFolder("Light color");

	h.add(effectController, "lhue", 0.0, 1.0, 0.025).name("hue");
	h.add(effectController, "lsaturation", 0.0, 1.0, 0.025).name("saturation");
	h.add(effectController, "llightness", 0.0, 1.0, 0.025).name("lightness");

	// light (directional)

	h = gui.addFolder("Light direction");

	h.add(effectController, "lx", -1.0, 1.0, 0.025).name("x");
	h.add(effectController, "ly", -1.0, 1.0, 0.025).name("y");
	h.add(effectController, "lz", -1.0, 1.0, 0.025).name("z");

}

//

function animate() {

	requestAnimationFrame(animate);
	render();

}

function render() {

	var delta = clock.getDelta();

	cameraControls.update(delta);

	if (effectController.newTess !== tess ) {
		tess = effectController.newTess;

		fillScene();
	}

	phongBalancedMaterial.uniforms.shininess.value = effectController.shininess;
	phongBalancedMaterial.uniforms.uDropoff.value = effectController.dropoff;
	phongBalancedMaterial.uniforms.uKd.value = effectController.kd;
	phongBalancedMaterial.uniforms.uKs.value = effectController.ks;

	var materialColor = new THREE.Color();
	materialColor.setHSL(effectController.hue, effectController.saturation, effectController.lightness);
	phongBalancedMaterial.uniforms.uMaterialColor.value.copy(materialColor);

	if (!effectController.metallic) {
		materialColor.setRGB(1, 1, 1);
	}
	phongBalancedMaterial.uniforms.uSpecularColor.value.copy(materialColor);

	// Ambient's actually controlled by the light for this demo - TODO fix
	ambientLight.color.setHSL(effectController.hue, effectController.saturation, effectController.lightness * effectController.ka);

	light.position.copy(camera.position);

	light.color.setHSL(effectController.lhue, effectController.lsaturation, effectController.llightness);

	renderer.render(scene, camera);

}

function addToDOM() {
    var container = document.getElementById('container');
    var canvas = container.getElementsByTagName('canvas');
    if (canvas.length>0) {
        container.removeChild(canvas[0]);
    }
    container.appendChild( renderer.domElement );
}

try {
  console.log('try init');
  init();
  console.log('try fill scene');
  fillScene();
  console.log('try setup gui');
  setupGui();
  console.log('try add to dom');
  addToDOM();
  console.log('try animate');
  animate();
} catch(e) {
  var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
  console.error(errorReport+e);
}

console.log('start');
