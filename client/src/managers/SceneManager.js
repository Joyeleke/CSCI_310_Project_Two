import * as THREE from "three";
import {
  groundWidth,
  groundHeight,
  groundPositionY,
  bgColor,
  groundColor,
  playerWidth,
  playerHeight,
  playerDepth,
  playerStartPositionX,
  playerStartPositionY,
  spikeHitColor
} from '../config/constants.js';
import Player from '../entities/Player.js';
import Platform from '../entities/Platform.js';
import { setGroundPlatform, getPlatforms } from './LevelManager.js';
import { gameState } from '../state/gameState.js';
import { LEVELS } from '../data/levelData.js';
import { getSelectedModelPath } from './ModelPreviewManager.js';

// ========================================
// SCENE MANAGER
// ========================================

let scene, camera, renderer;
let player1 = null;
let ground = null;

export function initScene() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);

  // Perspective camera
  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(playerStartPositionX, playerStartPositionY + 4, 15);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  scene.add(dirLight);

  // Create player with selected model
  const modelPath = getSelectedModelPath();
  player1 = new Player(playerWidth, playerHeight, playerDepth, modelPath);
  player1.add(scene, playerStartPositionX, playerStartPositionY);

  // Create ground
  ground = new Platform(groundWidth, groundHeight, groundColor, 7);
  ground.add(scene, 0, groundPositionY);
  setGroundPlatform(ground);
  getPlatforms().push(ground);

  // Window resize handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, player1, ground };
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}

export function getPlayer() {
  return player1;
}

export function getGround() {
  return ground;
}

export function updateCamera(targetX, targetY) {
  const targetCameraY = targetY + 4;
  camera.position.y += (targetCameraY - camera.position.y) * 0.08;
  camera.position.x += (targetX - camera.position.x) * 0.08;
  camera.lookAt(targetX, targetY, 0);
}

export function setBackgroundColor(hexColor) {
  scene.background.setHex(hexColor);
}

export function updateBackgroundForLevel(levelNumber) {
  const level = LEVELS[levelNumber - 1];
  if (level && level.backgroundColor) {
    scene.background.setHex(level.backgroundColor);
  } else {
    scene.background.setHex(bgColor);
  }
}

export function showSpikeHitFeedback() {
  gameState.isShowingSpikeHit = true;
  gameState.spikeHitTime = performance.now();
  scene.background.setHex(spikeHitColor);
}

export function resetSpikeHitFeedback(currentTime) {
  if (gameState.isShowingSpikeHit && currentTime - gameState.spikeHitTime > 500) {
    gameState.isShowingSpikeHit = false;
    updateBackgroundForLevel(gameState.currentLevel);
  }
}

export function render() {
  renderer.render(scene, camera);
}

export function changePlayerModel(modelPath) {
  if (player1) {
    player1.changeModel(modelPath);
  }
}

