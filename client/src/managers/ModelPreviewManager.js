import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ========================================
// MODEL PREVIEW MANAGER
// ========================================

// Base path for assets (matches vite.config.js base)
const BASE_PATH = import.meta.env.BASE_URL || '/';

// Available models (GLTFLoader supports both .glb and .gltf formats)
// Note: .gltf files with external .bin dependencies need those files present
const AVAILABLE_MODELS = [
  { name: 'Player', file: 'player.glb' },
  { name: 'Cookie', file: 'cookie.glb' },
  { name: 'Tanjiro', file: 'Tanjiro Kamado.glb' },
  { name: 'Llama', file: 'llama.gltf' },
];

let currentModelIndex = 0;
let previewScene = null;
let previewCamera = null;
let previewRenderer = null;
let previewModel = null;
let animationId = null;
let isInitialized = false;

// Reusable loader instance
const gltfLoader = new GLTFLoader();

// UI elements
let modelNameEl = null;
let prevBtn = null;
let nextBtn = null;

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}

export function getCurrentModelIndex() {
  return currentModelIndex;
}

export function getSelectedModelPath() {
  return `${BASE_PATH}models/${AVAILABLE_MODELS[currentModelIndex].file}`;
}

export function getSelectedModelName() {
  return AVAILABLE_MODELS[currentModelIndex].name;
}

export function initModelPreview() {
  const canvas = document.getElementById('model-preview-canvas');
  modelNameEl = document.getElementById('model-name');
  prevBtn = document.getElementById('model-prev-btn');
  nextBtn = document.getElementById('model-next-btn');

  if (!canvas) {
    console.warn('Model preview canvas not found');
    return;
  }

  // Create preview scene
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x222222);

  // Create preview camera
  previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  previewCamera.position.set(0, 0.5, 3);
  previewCamera.lookAt(0, 0, 0);

  // Create preview renderer
  previewRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });
  previewRenderer.setSize(120, 120);
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  previewScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(2, 2, 2);
  previewScene.add(dirLight);

  // Set up button event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPreviousModel();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNextModel();
    });
  }

  isInitialized = true;

  // Load initial model
  loadPreviewModel(currentModelIndex);

  // Start animation loop
  animatePreview();
}

function loadPreviewModel(index) {
  if (!isInitialized) return;

  // Remove existing model
  if (previewModel) {
    previewScene.remove(previewModel);
    previewModel = null;
  }

  const modelData = AVAILABLE_MODELS[index];

  gltfLoader.load(
    `${BASE_PATH}models/${modelData.file}`,
    (gltf) => {
      previewModel = gltf.scene;

      // Get the bounding box to center and scale the model
      const bbox = new THREE.Box3().setFromObject(previewModel);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());

      // Center the model
      previewModel.position.sub(center);

      // Scale to fit in view
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;
      previewModel.scale.setScalar(scale);

      // Position slightly down so it's centered in view
      previewModel.position.y = -0.2;

      // Apply model-specific rotations
      if (modelData.file === 'llama.gltf') {
        previewModel.rotation.y = Math.PI; // Rotate 180 degrees on X axis
      }

      previewScene.add(previewModel);

      // Update model name display
      if (modelNameEl) {
        modelNameEl.textContent = modelData.name;
      }
    },
    undefined,
    (error) => {
      console.error('Error loading preview model:', error);
      if (modelNameEl) {
        modelNameEl.textContent = `${modelData.name} (Error)`;
      }
    }
  );
}

function animatePreview() {
  animationId = requestAnimationFrame(animatePreview);

  if (previewModel) {
    // Rotate the model slowly for preview effect
    previewModel.rotation.y += 0.02;
  }

  if (previewRenderer && previewScene && previewCamera) {
    previewRenderer.render(previewScene, previewCamera);
  }
}

export function selectNextModel() {
  currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length;
  loadPreviewModel(currentModelIndex);
  saveSelectedModel();
}

export function selectPreviousModel() {
  currentModelIndex = (currentModelIndex - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length;
  loadPreviewModel(currentModelIndex);
  saveSelectedModel();
}

export function selectModel(index) {
  if (index >= 0 && index < AVAILABLE_MODELS.length) {
    currentModelIndex = index;
    loadPreviewModel(currentModelIndex);
    saveSelectedModel();
  }
}

function saveSelectedModel() {
  localStorage.setItem('blocky-selected-model', currentModelIndex.toString());
}

export function loadSelectedModel() {
  const saved = localStorage.getItem('blocky-selected-model');
  if (saved !== null) {
    const index = parseInt(saved, 10);
    if (!isNaN(index) && index >= 0 && index < AVAILABLE_MODELS.length) {
      currentModelIndex = index;
    }
  }
}

export function stopPreview() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function resumePreview() {
  if (!animationId && isInitialized) {
    animatePreview();
  }
}

