import * as THREE from "three";
import Player from "./entities/Player.js";
import Platform from "./entities/Platform.js";
import { LEVELS, LEVEL_HEIGHT } from "./data/levelData.js";

// TODO: Add walls
// TODO: Add glider
// TODO: Add ability to stay on walls
// TODO: Add collision margin of 0.01
// TODO: Change geometry of player
// TODO: Add settings button
// TODO: Design more obstacles going up
// TODO: Auto scroll when the user reaches certain height
// TODO: Change background to be more appealing

// ========================================
// CONSTANTS
// ========================================

// Scene dimensions
const targetAspect = 16 / 9;
const sceneHeight = 15;
const sceneWidth = sceneHeight * targetAspect; // ~17.78

// Ground bar
const groundWidth = sceneWidth * 0.9;
const groundHeight = 0.3;
const groundPositionY = -sceneHeight / 2 - 0.6;
const groundTopY = groundPositionY + groundHeight / 2; 

// player dimensions
const playerWidth = 0.8;
const playerHeight = 0.8;
const playerDepth = 0.8;

// Physics
const gravity = -25; // Units per second squared
let jumpStrength = 15; // Units per second
const fastFall = -15; // Units per second
const moveSpeed = 7; // Units per second

// Colors
const bgColor = 0x343434;
const playerColor = 0x00ff88;
const groundColor = 0x8a9b68;

// Start the player at the horizontal center of the ground.
const playerStartPositionX = 0;
const playerStartPositionY = groundTopY + playerHeight / 2 + 0.05;

let canMove = true;

const platforms = [];
const players = [];

// Level tracking
let currentLevel = 1;
const loadedLevels = new Set();
let selectedDifficultyLabel = "Medium";
let hasWon = false;

// Abilities
let jumpCount = 0;
let canDoubleJump = false;
let jumpKeyReleased = true;

// ========================================
// SCENE SETUP
// ========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(bgColor);

// Perspective camera
const fov = 60;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(playerStartPositionX, playerStartPositionY + 4, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
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

// ========================================
// GAME OBJECTS
// ========================================

// PLAYER
const player1 = new Player(playerWidth, playerHeight, playerDepth, playerColor);
player1.add(scene, playerStartPositionX, playerStartPositionY);
players.push(player1);

// GROUND BAR
const ground = new Platform(groundWidth, groundHeight, groundColor, 7);
ground.add(scene, 0, groundPositionY);
platforms.push(ground);

// ========================================
// STORY/START/END OVERLAY
// ========================================

const overlayEl = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayMsg = document.getElementById("overlay-msg");

let isPaused = true; 

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = "none";
}

function showOverlay() {
  if (overlayEl) overlayEl.style.display = "flex";
}

function startGame() {
  const select = document.getElementById("difficulty");
  if (select) {
    const v = select.value;
    jumpStrength = v === "easy" ? 20 : v === "hard" ? 8.5 : 15;
    selectedDifficultyLabel = v === "easy" ? "Easy" : v === "hard" ? "Hard" : "Medium";
  }
  hideOverlay();
  isPaused = false;
  canMove = true;
  hasWon = false;

  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;
  velocityY = 0;
  isOnGround = false;

  if (levelDiv) levelDiv.textContent = `Level 1/${LEVELS.length} • ${selectedDifficultyLabel}`;
}

if (overlayEl) {
  showOverlay();
  canMove = false;
}

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}

window.addEventListener("keydown", (e) => {
  if (isPaused && (e.code === "Space")) {
    startGame();
  }
});

// ========================================
// LEVEL MANAGEMENT
// ========================================

function spawnLevel(levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) return;
  if (loadedLevels.has(levelNumber)) return;

  const level = LEVELS[levelNumber - 1];

  for (let platformData of level.platforms) {
    const [x, yRelative, width, height] = platformData;
    const new_platform = new Platform(width, height, level.color);

    new_platform.add(scene, x, yRelative + level.startY + groundPositionY);
    platforms.push(new_platform);
  }

  loadedLevels.add(levelNumber);
}

// Load initial level
spawnLevel(1);

// ========================================
// COLLISION DETECTION
// ========================================

function checkCollision(platform, prevX, prevY) {
  const pBottom = player1.position.y - playerHeight / 2;
  const pTop = player1.position.y + playerHeight / 2;
  const pLeft = player1.position.x - playerWidth / 2;
  const pRight = player1.position.x + playerWidth / 2;

  const prevBottom = prevY - playerHeight / 2;
  const prevTop = prevY + playerHeight / 2;
  const prevLeft = prevX - playerWidth / 2;
  const prevRight = prevX + playerWidth / 2;

  const platTop = platform.position.y + platform.userData.height / 2;
  const platBottom = platform.position.y - platform.userData.height / 2;
  const platLeft = platform.position.x - platform.userData.width / 2;
  const platRight = platform.position.x + platform.userData.width / 2;

  const isOverlapping =
    pRight > platLeft &&
    pLeft < platRight &&
    pBottom < platTop &&
    pTop > platBottom;

  if (!isOverlapping) return null;

  const wasAbove = prevBottom >= platTop;
  const wasBelow = prevTop <= platBottom;
  const wasLeft = prevRight <= platLeft;
  const wasRight = prevLeft >= platRight;

  if (wasAbove && velocityY <= 0) {
    return { side: "top", position: platTop };
  } else if (wasBelow && velocityY > 0) {
    return { side: "bottom", position: platBottom };
  } else if (wasLeft) {
    return { side: "left", position: platLeft };
  } else if (wasRight) {
    return { side: "right", position: platRight };
  }

  return null;
}

// ========================================
// GAME STATE
// ========================================

let velocityY = 0;
let isOnGround = false;
const keys = {};

// ========================================
// INPUT HANDLERS
// ========================================

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" || e.code === "ArrowDown") {
    e.preventDefault();
  }
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "KeyW" || e.code === "ArrowUp") {
    jumpKeyReleased = true;
  }
});

// ========================================
// GAME LOOP
// ========================================

const counterDiv = document.getElementById("counter");
const levelDiv = document.getElementById("level");

if (levelDiv) levelDiv.textContent = `Level 1/${LEVELS.length} • ${selectedDifficultyLabel}`;


let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Pause all gameplay updates until the user starts the game
  if (isPaused) {
    renderer.render(scene, camera);
    return;
  }

  const prevX = player1.position.x;
  const prevY = player1.position.y;

  // Horizontal movement
  if ((keys["KeyA"] || keys["ArrowLeft"]) && canMove)
    player1.position.x -= moveSpeed * deltaTime;
  if ((keys["KeyD"] || keys["ArrowRight"]) && canMove)
    player1.position.x += moveSpeed * deltaTime;

  // Check horizontal collisions
  for (const platform of platforms) {
    const collision = checkCollision(platform, prevX, prevY);
    if (
      collision &&
      (collision.side === "left" || collision.side === "right")
    ) {
      player1.position.x =
        collision.side === "left"
          ? collision.position - playerWidth / 2
          : collision.position + playerWidth / 2;
    }
  }

  // Jump
  if ((keys["KeyW"] || keys["ArrowUp"]) && canMove && jumpKeyReleased) {
    // First jump
    if (isOnGround) {
      velocityY = jumpStrength;
      isOnGround = false;
      jumpCount = 1;
      canDoubleJump = true;
      jumpKeyReleased = false;
    }
    // Second jump (after releasing the key)
    else if (canDoubleJump && jumpCount === 1) {
      velocityY = jumpStrength * 0.85; // optional: slightly weaker
      jumpCount = 2;
      canDoubleJump = false; // prevent third jump
      jumpKeyReleased = false;
    }
  }

  // Fast fall
  if ((keys["KeyS"] || keys["ArrowDown"]) && !isOnGround && canMove)
    velocityY = fastFall;

  // Apply gravity and vertical movement
  velocityY += gravity * deltaTime;
  player1.position.y += velocityY * deltaTime;

  // Check vertical collisions
  isOnGround = false;
  for (const platform of platforms) {
    const collision = checkCollision(platform, prevX, prevY);
    if (collision) {
      if (collision.side === "top") {
        player1.position.y = collision.position + playerHeight / 2;
        velocityY = 0;
        isOnGround = true;
        jumpCount = 0;
        canDoubleJump = false;
        jumpKeyReleased = true;
      } else if (collision.side === "bottom") {
        player1.position.y = collision.position - playerHeight / 2;
        velocityY = 0;
      }
    }
  }

  // Death condition (fall below screen)
  if (player1.position.y - playerHeight / 2 < groundPositionY) {
    player1.position.y = groundPositionY + playerHeight / 2;
    canMove = false;
    velocityY = 0;
    isOnGround = true;

    setTimeout(() => {
      player1.position.x = playerStartPositionX;
      player1.position.y = playerStartPositionY;
      canMove = true;
      isOnGround = false;
    }, 500);
  }

  // Camera following Player 1
  const targetCameraY = player1.position.y + 4;

  camera.position.y += (targetCameraY - camera.position.y) * 0.08;
  camera.position.x += (player1.position.x - camera.position.x) * 0.08;
  
  camera.lookAt(player1.position.x, player1.position.y, 0);

  // Detect which level the player is currently in
  const playerY = player1.position.y - groundPositionY;
  const detectedLevel = Math.floor(playerY / LEVEL_HEIGHT) + 1;
  const levelInBounds = Math.max(1, Math.min(LEVELS.length, detectedLevel));

  // Update current level if player moved to a new level
  if (levelInBounds !== currentLevel) {
    currentLevel = levelInBounds;
    if (levelDiv) levelDiv.textContent = `Level ${currentLevel}/${LEVELS.length} • ${selectedDifficultyLabel}`;
    
    // Update background color for new level
    const level = LEVELS[currentLevel - 1];
    if (level && level.backgroundColor) {
      scene.background.setHex(level.backgroundColor);
    }
  }

  // Load current level and next 2 levels ahead
  const maxLevelToLoad = Math.min(currentLevel + 2, LEVELS.length);
  for (let level = currentLevel; level <= maxLevelToLoad; level++) {
    if (!loadedLevels.has(level)) {
      spawnLevel(level);
    }
  }

  // Win detection: if player crosses above the final level top
  if (!hasWon && player1.position.y - groundPositionY >= LEVEL_HEIGHT * LEVELS.length) {
    hasWon = true;
    showWinOverlay(); 
    isPaused = true; 
  }

  // Update counter
  if (counterDiv) {
    const playerCurrentY = player1.position.y + 6.9;
    const displayY = playerCurrentY > 0 ? playerCurrentY : 0;
    counterDiv.textContent = `${displayY.toFixed(2)} m`;
  }

  renderer.render(scene, camera);
}

animate();

// ========================================
// WIN OVERLAY (minimal)
// ========================================

function showWinOverlay() {
  if (overlayTitle) overlayTitle.textContent = "You Win!";
  if (overlayText) overlayText.textContent = "Great climb. Want to run it again or try a different difficulty?";
  if (overlayMsg) overlayMsg.textContent = "Press Space or Click Restart";
  if (startBtn) startBtn.textContent = "Restart";
  showOverlay();
}

// ========================================
// WINDOW RESIZE HANDLER
// ========================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
