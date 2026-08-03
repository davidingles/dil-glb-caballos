import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Referencias al DOM ----------
const container = document.getElementById('scene-container');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');
const btnRotate = document.getElementById('btn-rotate');
const btnReset = document.getElementById('btn-reset');
const btnFullscreen = document.getElementById('btn-fullscreen');
const iconRotate = document.getElementById('icon-rotate');

const MODEL_URL = 'CABALLOS.glb';
const TARGET_SIZE = 2.6; // tamaño aproximado del modelo en la escena

// ---------- Escena, cámara y renderer ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ---------- Iluminación: entorno suave + luces ----------
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.55);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(3, 6, 4);
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x6ea8fe, 0.35);
rimLight.position.set(-4, 2, -3);
scene.add(rimLight);

// ---------- Controles de órbita (girar y zoom) ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true; // rotación lenta sobre sí mismo
controls.autoRotateSpeed = 1.2;
controls.minDistance = 0.5;
controls.maxDistance = 40;

// ---------- Cargar el modelo GLB ----------
const loader = new GLTFLoader();
let modelGroup = null;

function placeAndFrame(model) {
  // Escalar para que la dimensión mayor mida ~TARGET_SIZE unidades
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = TARGET_SIZE / maxDim;
  model.scale.setScalar(scale);

  // Centrar en el origen
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -center.y, -center.z);

  scene.add(model);
  modelGroup = model;

  // Posicionar la cámara a una distancia cómoda
  const radius = TARGET_SIZE * 1.6;
  camera.position.set(radius * 0.85, radius * 0.55, radius);
  controls.target.set(0, 0, 0);
  controls.update();

  // Ocultar la pantalla de carga
  loadingScreen.classList.add('hidden');
}

loader.load(
  MODEL_URL,
  (gltf) => placeAndFrame(gltf.scene),
  (xhr) => {
    if (xhr.total > 0) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      loadingBar.style.width = pct + '%';
      loadingText.textContent = `Cargando modelo… ${pct}%`;
    }
  },
  (err) => {
    loadingText.textContent = 'Error al cargar el modelo';
    loadingBar.style.background = '#ff6b6b';
    console.error('Error cargando el GLB:', err);
  }
);

// ---------- Bucle de renderizado ----------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ---------- Barra de herramientas ----------
function toggleAutoRotate() {
  controls.autoRotate = !controls.autoRotate;
  const active = controls.autoRotate;
  btnRotate.classList.toggle('active', active);
  btnRotate.setAttribute('aria-pressed', String(active));
  iconRotate.textContent = active ? '⏸' : '▶';
}

btnRotate.addEventListener('click', toggleAutoRotate);

btnReset.addEventListener('click', () => {
  const radius = TARGET_SIZE * 1.6;
  camera.position.set(radius * 0.85, radius * 0.55, radius);
  controls.target.set(0, 0, 0);
  controls.update();
});

btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

// ---------- Redimensionado ----------
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
