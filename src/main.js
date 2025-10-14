import * as THREE from 'three';
// TODO: Add walls
// TODO: Add double jump
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
const groundHeight = 0.4;
const groundPositionY = -sceneHeight / 2;

// player dimensions
const playerWidth = 0.8;
const playerHeight = 0.8;
const playerDepth = 0.2;

// Physics
const gravity = -25; // Units per second squared
const jumpStrength = 8; // Units per second
const fastFall = -15; // Units per second
const moveSpeed = 7; // Units per second
const groundLevel = groundPositionY; // Top of the bar

// Colors
const bgColor = 0x343434;
const playerColor = 0x00ff88;
const groundColor = 0x555555;
const platformColor = 0x4488ff;

const playerStartPositionX = - groundWidth / 2 + playerWidth / 2 + 0.5;
const playerStartPositionY = groundLevel + playerHeight / 2 + 1;

let canMove = true;

// ========================================
// SCENE SETUP
// ========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(bgColor);

const camera = new THREE.OrthographicCamera(
  -sceneWidth / 2, sceneWidth / 2,
  sceneHeight / 2, -sceneHeight / 2,
  0.1, 100
);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ========================================
// GAME OBJECTS
// ========================================

// player
const playerGeo = new THREE.BoxGeometry(playerWidth, playerHeight, playerDepth);
const playerMat = new THREE.MeshBasicMaterial({ color: playerColor });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(playerStartPositionX, playerStartPositionY, 0);
scene.add(player);

// Ground bar
const groundGeo = new THREE.PlaneGeometry(groundWidth, groundHeight);
const groundMat = new THREE.MeshBasicMaterial({ color: groundColor });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = groundPositionY;
scene.add(ground);

// ========================================
// PLATFORMS
// ========================================

const platforms = [];

// Platform creation function
function createPlatform(x, y, width, height) {
  const y_pos = y + groundPositionY;
  const platformGeo = new THREE.PlaneGeometry(width, height);
  const platformMat = new THREE.MeshBasicMaterial({ color: platformColor });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.set(x, y_pos, 0);
  
  // Store dimensions for collision detection
  platform.userData = { width, height };
  
  scene.add(platform);
  platforms.push(platform);
  return platform;
}

// Create some example platforms
// createPlatform(0, 0, groundWidth, 0.5);
createPlatform(-5, 8, 3, 0.3);
createPlatform(-1, 1, 2.5, 0.3);
createPlatform(3, 1.5, 3, 0.3);
createPlatform(7, 2, 2, 0.3);
createPlatform(0, 3, 4, 0.3);

// ========================================
// COLLISION DETECTION
// ========================================

function checkPlatformCollision(platform, prevX, prevY) {
  const playerBottom = player.position.y - playerHeight / 2;
  const playerTop = player.position.y + playerHeight / 2;
  const playerLeft = player.position.x - playerWidth / 2;
  const playerRight = player.position.x + playerWidth / 2;
  
  const prevplayerLeft = prevX - playerWidth / 2;
  const prevplayerRight = prevX + playerWidth / 2;
  const prevplayerBottom = prevY - playerHeight / 2;
  const prevplayerTop = prevY + playerHeight / 2;
  
  const platformTop = platform.position.y + platform.userData.height / 2;
  const platformBottom = platform.position.y - platform.userData.height / 2;
  const platformLeft = platform.position.x - platform.userData.width / 2;
  const platformRight = platform.position.x + platform.userData.width / 2;
  
  // Check if there's any overlap at all
  const isOverlapping = 
    playerRight > platformLeft &&
    playerLeft < platformRight &&
    playerBottom < platformTop &&
    playerTop > platformBottom;
  
  if (!isOverlapping) return null;
  
  // Determine which side was hit based on previous position
  const wasAbove = prevplayerBottom >= platformTop;
  const wasBelow = prevplayerTop <= platformBottom;
  const wasLeft = prevplayerRight <= platformLeft;
  const wasRight = prevplayerLeft >= platformRight;
  
  // Return collision info based on where the player came from
  if (wasAbove && velocityY <= 0) {
    return { side: 'top', position: platformTop };
  } else if (wasBelow && velocityY > 0) {
    return { side: 'bottom', position: platformBottom };
  } else if (wasLeft) {
    return { side: 'left', position: platformLeft };
  } else if (wasRight) {
    return { side: 'right', position: platformRight };
  }
  
  return null;
}

function checkGroundCollision() {
  const playerBottom = player.position.y - playerHeight / 2;
  const playerLeft = player.position.x - playerWidth / 2;
  const playerRight = player.position.x + playerWidth / 2;
  
  const groundTop = ground.position.y + groundHeight / 2;
  const groundLeft = ground.position.x - groundWidth / 2;
  const groundRight = ground.position.x + groundWidth / 2;
  
  // Check if player is horizontally overlapping with ground
  const isHorizontallyAligned = playerRight > groundLeft && playerLeft < groundRight;
  
  // Check if player is touching or below ground top
  const isTouchingGround = playerBottom <= groundTop;
  
  return isHorizontallyAligned && isTouchingGround;
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

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// ========================================
// GAME LOOP
// ========================================

const counterDiv = document.getElementById('counter');
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  // Store previous position
  const prevX = player.position.x;
  const prevY = player.position.y;
  
  // Movement (A/D)
  if (keys['KeyA'] && canMove) player.position.x -= moveSpeed * deltaTime;
  if (keys['KeyD'] && canMove) player.position.x += moveSpeed * deltaTime;
  
  // Check horizontal platform collisions after movement
  for (const platform of platforms) {
    const collision = checkPlatformCollision(platform, prevX, prevY);
    if (collision && (collision.side === 'left' || collision.side === 'right')) {
      if (collision.side === 'left') {
        player.position.x = collision.position - playerWidth / 2;
      } else if (collision.side === 'right') {
        player.position.x = collision.position + playerWidth / 2;
      }
    }
  }
  
  // Jump (W)
  if (keys['KeyW'] && isOnGround && canMove) {
    velocityY = jumpStrength;
    isOnGround = false;
  }
  
  // Fast fall (S)
  if (keys['KeyS'] && !isOnGround && canMove) velocityY = fastFall;
  
  // Apply gravity
  velocityY += gravity * deltaTime;
  player.position.y += velocityY * deltaTime;
  
  // Check platform collisions (all sides)
  isOnGround = false;
  for (const platform of platforms) {
    const collision = checkPlatformCollision(platform, prevX, prevY);
    if (collision) {
      if (collision.side === 'top') {
        // Landing on top of platform
        player.position.y = collision.position + playerHeight / 2;
        velocityY = 0;
        isOnGround = true;
      } else if (collision.side === 'bottom') {
        // Hit bottom of platform (head bonk)
        player.position.y = collision.position - playerHeight / 2;
        velocityY = 0;
      }
    }
  }
  
  // Ground collision
  if (checkGroundCollision()) {
    const groundTop = ground.position.y + groundHeight / 2;
    player.position.y = groundTop + playerHeight / 2;
    velocityY = 0;
    isOnGround = true;
  }
  
  // Death/reset condition
  if (player.position.y - playerHeight / 2 < groundPositionY) {
    player.position.y = groundPositionY + playerHeight / 2;
    canMove = false;
    velocityY = 0;
    isOnGround = true;

    setTimeout(() => {
        canMove = true;
        player.position.x = playerStartPositionX;
        player.position.y = playerStartPositionY;
    }, 500);
  }
  
  // Update Y counter
  if (counterDiv) {
    let playerPosition = Number(player.position.y) + 6.9;
    counterDiv.textContent = `Y: ${playerPosition.toFixed(2)}`;
  }
  
  renderer.render(scene, camera);
}

animate();

// ========================================
// WINDOW RESIZE HANDLER
// ========================================

window.addEventListener('resize', () => {
  const windowAspect = window.innerWidth / window.innerHeight;
  
  if (windowAspect > targetAspect) {
    // Window is wider than target - fit to height
    const width = sceneHeight * windowAspect;
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = sceneHeight / 2;
    camera.bottom = -sceneHeight / 2;
  } else {
    // Window is taller than target - fit to width
    const height = sceneWidth / windowAspect;
    camera.left = -sceneWidth / 2;
    camera.right = sceneWidth / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
  }
  
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
