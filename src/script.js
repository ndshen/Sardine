import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

let canvas, camera, scene, renderer;
let font;
let textObjs = [];
let mode = "sec";

const START = new Date(2022, 8, 2);

function init() {
  canvas = document.querySelector("canvas.webgl");
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, -400, 600);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const loader = new FontLoader();
  loader.load("fonts/helvetiker_regular.typeface.json", function (f) {
    font = f;
  }); //end load function

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  controls.addEventListener("change", render);
  generateEventListner();
} // end init

function generateEventListner() {
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousedown", () => {
    if (mode == "sec") {
      mode = "day";
    } else {
      mode = "sec";
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}

function generateText(font, message) {
  if (font == undefined) {
    return;
  }
  const color = 0x006699;
  const matDark = new THREE.LineBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
  });

  const matLite = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });

  const shapes = font.generateShapes(message, 100);

  const geometry = new THREE.ShapeGeometry(shapes);

  geometry.computeBoundingBox();

  const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

  geometry.translate(xMid, 0, 0);

  // make shape ( N.B. edge view not visible )

  const text = new THREE.Mesh(geometry, matLite);
  text.position.z = -150;
  addTextToScene(text);

  // make line shape ( N.B. edge view remains visible )

  const holeShapes = [];

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];

    if (shape.holes && shape.holes.length > 0) {
      for (let j = 0; j < shape.holes.length; j++) {
        const hole = shape.holes[j];
        holeShapes.push(hole);
      }
    }
  }

  shapes.push.apply(shapes, holeShapes);

  const lineText = new THREE.Object3D();

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];

    const points = shape.getPoints();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    geometry.translate(xMid, 0, 0);

    const lineMesh = new THREE.Line(geometry, matDark);
    lineText.add(lineMesh);
  }

  addTextToScene(lineText);
}

// animate
const tick = () => {
  const currentTime = Date.now();
  removeTextFromScene();
  if (mode == "sec") {
    generateText(font, getAccumSeconds().toString());
  } else {
    generateText(font, getAccumDays().toString());
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

function getAccumSeconds() {
  const currentTime = Date.now();
  return Math.floor((currentTime - START) / 1000);
}

function getAccumDays() {
  const currentTime = Date.now();
  const diffTime = Math.abs(currentTime - START);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function addTextToScene(obj) {
  textObjs.push(obj.uuid);
  scene.add(obj);
}

function removeTextFromScene() {
  textObjs.map((uuid) => {
    const object = scene.getObjectByProperty("uuid", uuid);
    // object.geometry.dispose();
    // object.material.dispose();
    scene.remove(object);
  });
  textObjs = [];
}

init();
tick();
