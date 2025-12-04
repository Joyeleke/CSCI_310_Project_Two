import * as THREE from "three";
import Player from "./entities/Player.js";
import Platform from "./entities/Platform.js";
import Wall from "./entities/Wall.js";
import Spike from "./entities/Spike.js";
import { LEVELS, LEVEL_HEIGHT } from "./data/levelData.js";

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

// player dimensions - Updated to match the actual 3D model scaling
const playerWidth = 0.8;  // Matches model scaling
const playerHeight = 1.4; // Matches model scaling (was 0.8)
const playerDepth = 0.8;  // Matches model scaling

// Physics
const gravity = -25; // Units per second squared
let jumpStrength = 15; // Units per second
const fastFall = -15; // Units per second
const moveSpeed = 7; // Units per second

// Colors
const bgColor = 0x343434;
const playerColor = 0x00ff88;
const groundColor = 0x8a9b68;
const spikeHitColor = 0xff6666; // Light red color for spike hit

// Start the player at the horizontal center of the ground.
const playerStartPositionX = 0;
const playerStartPositionY = groundTopY + playerHeight / 2;

let canMove = true;

const platforms = [];
const players = [];

// Level tracking
let currentLevel = 1;
const loadedLevels = new Set();
let selectedDifficultyLabel = "Medium";
let hasWon = false;
let isPauseMenuOpen = false; // New pause menu state

// Timer tracking
let gameStartTime = 0;
let pausedTime = 0;
let totalPausedTime = 0;

// Personal Best tracking
const personalBests = {
  easy: null,
  medium: null,
  hard: null
};

// Spike hit visual feedback
let spikeHitTime = 0;
let isShowingSpikeHit = false;

// Load personal bests from localStorage
function loadPersonalBests() {
  const saved = localStorage.getItem('blocky-personal-bests');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(personalBests, parsed);
    } catch {
      console.warn('Failed to load personal bests from localStorage');
    }
  }
  updatePBDisplay();
}

// Save personal bests to localStorage
function savePersonalBests() {
  localStorage.setItem('blocky-personal-bests', JSON.stringify(personalBests));
}

// Update the PB display in the overlay
function updatePBDisplay() {
  const pbEasy = document.getElementById('pb-easy');
  const pbMedium = document.getElementById('pb-medium');
  const pbHard = document.getElementById('pb-hard');

  if (pbEasy) pbEasy.textContent = formatTime(personalBests.easy) || '-';
  if (pbMedium) pbMedium.textContent = formatTime(personalBests.medium) || '-';
  if (pbHard) pbHard.textContent = formatTime(personalBests.hard) || '-';
}

// Format time in MM:SS.MS format
function formatTime(timeMs) {
  if (!timeMs) return null;

  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// Check and save new personal best
function checkAndSavePersonalBest(completionTime, difficulty) {
  const difficultyKey = difficulty.toLowerCase();
  const currentBest = personalBests[difficultyKey];

  if (!currentBest || completionTime < currentBest) {
    personalBests[difficultyKey] = completionTime;
    savePersonalBests();
    updatePBDisplay();
    return true; // New record!
  }
  return false; // No new record
}

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
const restartGameBtn = document.getElementById("restart-game-btn");
const difficultySection = document.getElementById("difficulty-section");
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
    jumpStrength = v === "easy" ? 15 : v === "hard" ? 10 : 13.5;
    selectedDifficultyLabel = v === "easy" ? "Easy" : v === "hard" ? "Hard" : "Medium";
  }

  // Initialize timer when starting the game
  gameStartTime = performance.now();
  totalPausedTime = 0;

  hideOverlay();
  isPaused = false;
  isPauseMenuOpen = false;
  canMove = true;
  hasWon = false;

  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;
  velocityY = 0;
  isOnGround = false;

  if (levelDiv) levelDiv.textContent = `Level 1/${LEVELS.length} • ${selectedDifficultyLabel}`;
}

function showPauseMenu() {
  // Record when we paused
  pausedTime = performance.now();

  isPauseMenuOpen = true;
  isPaused = true;
  if (overlayTitle) overlayTitle.textContent = "Game Paused";
  if (overlayText) overlayText.textContent = "Take a break! You can resume or restart the entire game.";
  if (overlayMsg) overlayMsg.textContent = "Press ESC to Resume";
  if (startBtn) startBtn.textContent = "Resume";
  if (restartGameBtn) restartGameBtn.style.display = "inline-block"; // Show restart game button in pause menu
  if (difficultySection) difficultySection.style.display = "none"; // Hide difficulty selector in pause menu

  // Show personal best table in pause menu
  const pbTableSection = document.getElementById("pb-table-section");
  if (pbTableSection) pbTableSection.style.display = "block";
  updatePBDisplay();

  showOverlay();
}

function resumeGame() {
  // Add the paused duration to total paused time
  if (pausedTime > 0) {
    totalPausedTime += performance.now() - pausedTime;
    pausedTime = 0;
  }

  isPauseMenuOpen = false;
  isPaused = false;
  if (restartGameBtn) restartGameBtn.style.display = "none"; // Hide restart game button when not paused

  // Hide personal best table when resuming
  const pbTableSection = document.getElementById("pb-table-section");
  if (pbTableSection) pbTableSection.style.display = "none";

  hideOverlay();
}

function restartGame() {
  // Reset all game state
  currentLevel = 1;
  loadedLevels.clear();
  hasWon = false;
  isPauseMenuOpen = false;
  isPaused = true;

  // Clear all platforms and walls from scene and array
  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];
    // Don't remove the ground platform
    if (platform !== ground) {
      scene.remove(platform);
      platforms.splice(i, 1);
    }
  }

  // Reset player state
  player1.position.x = playerStartPositionX;
  player1.position.y = playerStartPositionY;
  velocityY = 0;
  isOnGround = false;
  jumpCount = 0;
  canDoubleJump = false;
  jumpKeyReleased = true;
  isGliding = false;
  isOnWall = false;
  canWallJump = false;
  wallSide = null; // Reset wall side

  // Reset background color
  scene.background.setHex(bgColor);

  // Show game restart screen with difficulty selector
  if (overlayTitle) overlayTitle.textContent = "Blocky's Big Adventure";
  if (overlayText) overlayText.textContent = "Blocky, a small adventurous block, is swept away into a mysterious world of floating platforms and deadly spikes. With courage and precision, you must guide Blocky through each perilous level to find the way back home.";
  if (overlayMsg) overlayMsg.textContent = "Press Space or Click Start";
  if (startBtn) startBtn.textContent = "Start";
  if (restartGameBtn) restartGameBtn.style.display = "none"; // Hide restart game button when restarting
  if (difficultySection) difficultySection.style.display = "block"; // Show difficulty selector when restarting

  // Hide personal best table when restarting (not a pause menu)
  const pbTableSection = document.getElementById("pb-table-section");
  if (pbTableSection) pbTableSection.style.display = "none";

  showOverlay();

  // Reload the first level
  spawnLevel(1);
}

if (overlayEl) {
  showOverlay();
  canMove = false;
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (isPauseMenuOpen) {
      resumeGame();
    } else {
      startGame();
    }
  });
}

if (restartGameBtn) {
  restartGameBtn.addEventListener("click", restartGame);
}


// ========================================
// LEVEL MANAGEMENT
// ========================================

function spawnLevel(levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) return;
  if (loadedLevels.has(levelNumber)) return;

  const level = LEVELS[levelNumber - 1];

  // Spawn platforms
  for (let platformData of level.platforms) {
    const [x, yRelative, width, height, isSpike] = platformData;
    let new_platform;

    if (isSpike) {
      // Create a spike platform
      new_platform = new Spike(width, height);
    } else {
      // Create a normal platform
      new_platform = new Platform(width, height, level.color);
    }

    new_platform.add(scene, x, yRelative + level.startY + groundPositionY + 1);
    platforms.push(new_platform);
  }

  // Spawn walls
  if (level.walls) {
    for (let wallData of level.walls) {
      const [x, yRelative, width, height] = wallData;
      const new_wall = new Wall(width, height, level.color);

      new_wall.add(scene, x, yRelative + level.startY + groundPositionY + 1);
      platforms.push(new_wall); // Add walls to platforms array for collision detection
    }
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

  // Use a small tolerance for edge cases
  const tolerance = 0.01;

  const wasAbove = prevBottom >= platTop - tolerance;
  const wasBelow = prevTop <= platBottom + tolerance;
  const wasLeft = prevRight <= platLeft + tolerance;
  const wasRight = prevLeft >= platRight - tolerance;

  // If none of the directional checks pass, determine collision side based on overlap amounts
  if (!wasAbove && !wasBelow && !wasLeft && !wasRight) {
    // Calculate overlap amounts for each side
    const overlapTop = pTop - platTop;
    const overlapBottom = platBottom - pBottom;
    const overlapLeft = pLeft - platLeft;
    const overlapRight = platRight - pRight;

    // Find the smallest overlap (closest to the surface)
    const minOverlap = Math.min(
      Math.abs(overlapTop),
      Math.abs(overlapBottom),
      Math.abs(overlapLeft),
      Math.abs(overlapRight)
    );

    // Determine collision side based on smallest overlap and velocity
    if (Math.abs(overlapTop) === minOverlap && velocityY <= 0) {
      return { side: "top", position: platTop };
    } else if (Math.abs(overlapBottom) === minOverlap && velocityY >= 0) {
      return { side: "bottom", position: platBottom };
    } else if (Math.abs(overlapLeft) === minOverlap) {
      return { side: "left", position: platLeft };
    } else if (Math.abs(overlapRight) === minOverlap) {
      return { side: "right", position: platRight };
    }
  }

  // Original logic with velocity checks
  if (wasAbove && velocityY <= 0) {
    return { side: "top", position: platTop };
  } else if (wasBelow && velocityY >= 0) {
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
let jumpCount = 0;
let canDoubleJump = false;
let jumpKeyReleased = true;
let isGliding = false;
let glideDirection = 0;
let isOnWall = false;
let canWallJump = false;
let wallSide = null;

// Gliding constants
const glideGravity = -8;
const glideMaxSpeed = -3;
const glideRotationAngle = - Math.PI / 2;

const keys = {};

// ========================================
// INPUT HANDLERS
// ========================================

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" || e.code === "ArrowDown") {
    e.preventDefault();
  }

  keys[e.code] = true;

  // Handle ESC key for pause menu
  if (e.code === "Escape") {
    if (!isPaused && !hasWon) {
      // Game is running, show pause menu
      showPauseMenu();
    } else if (isPauseMenuOpen) {
      // Pause menu is open, resume game
      resumeGame();
    }
  }

  // Handle Space key for starting game when paused
  if (isPaused && (e.code === "Space")) {
    if (isPauseMenuOpen) {
      resumeGame();
    } else {
      startGame();
    }
  }
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
const timerDiv = document.getElementById("timer");
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

  // Horizontal movement (normal speed, not affected by gliding)
  if ((keys["KeyA"] || keys["ArrowLeft"]) && canMove)
    player1.position.x -= moveSpeed * deltaTime;
  if ((keys["KeyD"] || keys["ArrowRight"]) && canMove)
    player1.position.x += moveSpeed * deltaTime;

  // Check horizontal collisions
  isOnWall = false;
  wallSide = null;
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

      // Check if player should stick to wall (only when falling or moving slowly)
      if (!isOnGround && velocityY <= 0) {
        isOnWall = true;
        canWallJump = true;
        wallSide = collision.side; // Store which side of the wall player is on
        velocityY = 0; // Stop vertical movement when sticking to wall
      }
    }
  }

  // Jump
  if ((keys["KeyW"] || keys["ArrowUp"]) && canMove && jumpKeyReleased) {
    // Wall jump (when on wall)
    if (isOnWall && canWallJump) {
      velocityY = jumpStrength;
      isOnWall = false;
      canWallJump = false;
      wallSide = null; // Reset wall side
      jumpKeyReleased = false;
      jumpCount = 1;
      canDoubleJump = true;
    }
    // First jump (on ground)
    else if (isOnGround) {
      velocityY = jumpStrength;
      isOnGround = false;
      jumpCount = 1;
      canDoubleJump = true;
      jumpKeyReleased = false;
    }
    // Second jump (after releasing the key)
    else if (canDoubleJump && jumpCount === 1) {
      velocityY = jumpStrength * 0.7; // optional: slightly weaker
      jumpCount = 2;
      canDoubleJump = false; // prevent third jump
      jumpKeyReleased = false;
    }
  }

  // Gliding mechanics - allow gliding when falling (not on wall, not on ground)
  if ((keys["KeyW"] || keys["ArrowUp"]) && !isOnGround && !isOnWall && velocityY <= 0 && canMove) {
    isGliding = true;

    // Track glide direction based on horizontal movement
    if ((keys["KeyA"] || keys["ArrowLeft"]) && (keys["KeyD"] || keys["ArrowRight"])) {
      glideDirection = 0; // Both keys pressed, neutral
    } else if (keys["KeyA"] || keys["ArrowLeft"]) {
      glideDirection = -1; // Moving left
    } else if (keys["KeyD"] || keys["ArrowRight"]) {
      glideDirection = 1; // Moving right
    } else {
      glideDirection = 0; // No horizontal movement
    }

    // Apply reduced gravity while gliding
    velocityY += glideGravity * deltaTime;
    // Limit maximum falling speed while gliding
    if (velocityY < glideMaxSpeed) {
      velocityY = glideMaxSpeed;
    }
  } else {
    isGliding = false;
    glideDirection = 0;
    // Apply normal gravity when not gliding and not on wall
    if (!isOnWall) {
      velocityY += gravity * deltaTime;
    }
  }

  // Player rotation based on gliding and wall sticking
  if (player1.group) {
    let targetRotationZ = 0;
    let targetRotationY = 0;

    if (isOnWall && wallSide) {
      // Rotate player to face the wall when sticking
      if (wallSide === "left") {
        targetRotationY = Math.PI / 2; // 90 degrees to face right (towards the wall)
      } else if (wallSide === "right") {
        targetRotationY = -Math.PI / 2; // -90 degrees to face left (towards the wall)
      }
    } else if (isGliding && glideDirection !== 0) {
      // Rotate player when gliding in a direction
      targetRotationZ = glideDirection * glideRotationAngle;
    }

    // Smoothly interpolate to target rotations
    const rotationSpeed = 15; // Adjust for faster/slower rotation
    player1.group.rotation.z += (targetRotationZ - player1.group.rotation.z) * rotationSpeed * deltaTime;
    player1.group.rotation.y += (targetRotationY - player1.group.rotation.y) * rotationSpeed * deltaTime;
  }

  // Fast fall and wall drop
  if ((keys["KeyS"] || keys["ArrowDown"]) && canMove) {
    if (isOnWall) {
      // Drop from wall when pressing down
      isOnWall = false;
      canWallJump = false;
      wallSide = null; // Reset wall side
      velocityY = fastFall;
    } else if (!isOnGround && !isGliding) {
      // Normal fast fall when not on wall and not gliding
      velocityY = fastFall;
    }
  }

  // Apply vertical movement
  player1.position.y += velocityY * deltaTime;

  // Check vertical collisions
  isOnGround = false;
  for (const platform of platforms) {
    const collision = checkCollision(platform, prevX, prevY);
    if (collision) {
      // Check if this is a spike platform and player is landing on top
      if (platform.isSpike && collision.side === "top") {
        // Show spike hit visual feedback
        showSpikeHitFeedback();

        // Reset player to starting position when touching spike
        canMove = false;
        velocityY = 0;

        setTimeout(() => {
          player1.position.x = playerStartPositionX;
          player1.position.y = playerStartPositionY;
          canMove = true;
          isOnGround = false;
          jumpCount = 0;
          canDoubleJump = false;
          jumpKeyReleased = true;
          isGliding = false;
          isOnWall = false;
          canWallJump = false;
          wallSide = null; // Reset wall side
        }, 500);
        return; // Exit early to prevent normal platform collision handling
      }

      if (collision.side === "top") {
        player1.position.y = collision.position + playerHeight / 2;
        velocityY = 0;
        isOnGround = true;
        jumpCount = 0;
        canDoubleJump = false;
        jumpKeyReleased = true;
        isGliding = false;
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
      jumpCount = 0;
      canDoubleJump = false;
      jumpKeyReleased = true;
      isGliding = false;
      isOnWall = false;
      canWallJump = false;
      wallSide = null; // Reset wall side
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

  // Update timer
  if (timerDiv && gameStartTime > 0) {
    const currentGameTime = currentTime - gameStartTime - totalPausedTime;
    const seconds = Math.floor(currentGameTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    const milliseconds = Math.floor((currentGameTime % 1000) / 10);

    timerDiv.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }

  // Handle spike hit visual feedback timing
  if (isShowingSpikeHit && currentTime - spikeHitTime > 500) {
    // Reset visual feedback after 500ms
    isShowingSpikeHit = false;

    // Reset background to current level color or default
    const level = LEVELS[currentLevel - 1];
    if (level && level.backgroundColor) {
      scene.background.setHex(level.backgroundColor);
    } else {
      scene.background.setHex(bgColor);
    }
  }

  renderer.render(scene, camera);
}

animate();

// ========================================
// WIN OVERLAY (minimal)
// ========================================

function showWinOverlay() {
  // Calculate completion time and check for new personal best
  if (gameStartTime > 0) {
    const completionTime = performance.now() - gameStartTime - totalPausedTime;
    const isNewRecord = checkAndSavePersonalBest(completionTime, selectedDifficultyLabel);

    if (isNewRecord) {
      if (overlayTitle) overlayTitle.textContent = "New Personal Best!";
      if (overlayText) overlayText.textContent = `Congratulations! You completed ${selectedDifficultyLabel} difficulty in ${formatTime(completionTime)}. Want to try again or attempt a different difficulty?`;
    } else {
      if (overlayTitle) overlayTitle.textContent = "You Win!";
      if (overlayText) overlayText.textContent = `Great climb! You completed ${selectedDifficultyLabel} difficulty in ${formatTime(completionTime)}. Want to run it again or try a different difficulty?`;
    }
  } else {
    if (overlayTitle) overlayTitle.textContent = "You Win!";
    if (overlayText) overlayText.textContent = "Great climb. Want to run it again or try a different difficulty?";
  }

  if (overlayMsg) overlayMsg.textContent = "Press Space or Click Restart";
  if (startBtn) startBtn.textContent = "Restart";
  if (restartGameBtn) restartGameBtn.style.display = "none"; // Hide restart game button when won
  if (difficultySection) difficultySection.style.display = "block"; // Show difficulty selector when won

  // Hide personal best table when won (not a pause menu)
  const pbTableSection = document.getElementById("pb-table-section");
  if (pbTableSection) pbTableSection.style.display = "none";
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

// Load personal bests on initial load
loadPersonalBests();

// Function to show spike hit feedback
function showSpikeHitFeedback() {
  isShowingSpikeHit = true;
  spikeHitTime = performance.now();

  // Change background to light red
  scene.background.setHex(spikeHitColor);
}
