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
let backgroundMesh = null;
let backgroundUniforms = null;

// Particle systems
let waterfallParticles = null;
let starParticles = null;
const WATERFALL_PARTICLE_COUNT = 1500;
const STAR_PARTICLE_COUNT = 400;

// Generate random color blobs for background
function generateRandomColorBlobs(count) {
  const colors = [];
  const positions = [];

  const colorPalette = [
    new THREE.Color(0xff6b6b), // Red
    new THREE.Color(0x4ecdc4), // Teal
    new THREE.Color(0x45b7d1), // Blue
    new THREE.Color(0x96ceb4), // Green
    new THREE.Color(0xffeaa7), // Yellow
    new THREE.Color(0xdfe6e9), // Light gray
    new THREE.Color(0xa29bfe), // Purple
    new THREE.Color(0xfd79a8), // Pink
    new THREE.Color(0x00b894), // Emerald
    new THREE.Color(0xe17055), // Orange
  ];

  for (let i = 0; i < count; i++) {
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors.push(color.r, color.g, color.b);
    positions.push(
      (Math.random() - 0.5) * 2, // x: -1 to 1
      (Math.random() - 0.5) * 2, // y: -1 to 1
      0.3 + Math.random() * 0.5  // radius: 0.3 to 0.8
    );
  }

  return { colors, positions };
}

function createGradientBackground() {
  const blobCount = 8;
  const { colors, positions } = generateRandomColorBlobs(blobCount);

  // Custom shader for gradient background with color blobs
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uColors[8];
    uniform vec3 uPositions[8];
    uniform float uTime;
    uniform vec2 uOffset;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv + uOffset;
      vec3 color = uBaseColor;
      
      for (int i = 0; i < 8; i++) {
        vec2 blobPos = uPositions[i].xy;
        float radius = uPositions[i].z;
        
        // Add subtle movement
        blobPos.x += sin(uTime * 0.5 + float(i)) * 0.05;
        blobPos.y += cos(uTime * 0.3 + float(i) * 1.5) * 0.05;
        
        float dist = distance(uv, blobPos * 0.5 + 0.5);
        float strength = smoothstep(radius, 0.0, dist);
        
        // High transparency blend (0.15 opacity)
        color = mix(color, uColors[i], strength * 0.15);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  backgroundUniforms = {
    uBaseColor: { value: new THREE.Color(bgColor) },
    uColors: { value: colors },
    uPositions: { value: positions },
    uTime: { value: 0 },
    uOffset: { value: new THREE.Vector2(0, 0) }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: backgroundUniforms,
    depthWrite: false
  });

  // Create a large plane for the background
  const geometry = new THREE.PlaneGeometry(100, 200);
  backgroundMesh = new THREE.Mesh(geometry, material);
  backgroundMesh.position.z = -20; // Behind everything

  return backgroundMesh;
}

// Create waterfall particle system
function createWaterfallParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(WATERFALL_PARTICLE_COUNT * 3);
  const velocities = new Float32Array(WATERFALL_PARTICLE_COUNT);
  const sizes = new Float32Array(WATERFALL_PARTICLE_COUNT);
  const opacities = new Float32Array(WATERFALL_PARTICLE_COUNT);

  // Initialize particles - as wide as ground platform, starting from ground level
  for (let i = 0; i < WATERFALL_PARTICLE_COUNT; i++) {
    // Spread particles across the full ground width
    positions[i * 3] = (Math.random() - 0.5) * groundWidth; // x: as wide as ground
    positions[i * 3 + 1] = groundPositionY + Math.random() * 350; // y: start from ground level up
    positions[i * 3 + 2] = -5; // z: behind platforms but in front of background

    velocities[i] = 8 + Math.random() * 15; // Faster fall speed
    sizes[i] = 0.25 + Math.random() * 0.35; // Larger water particles
    opacities[i] = 0.2 + Math.random() * 0.3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  // Custom shader for water particles
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x4fc3f7) }, // Light blue water color
      uCameraY: { value: 0 },
      uGroundY: { value: groundPositionY }
    },
    vertexShader: `
      attribute float velocity;
      attribute float size;
      attribute float opacity;
      varying float vOpacity;
      uniform float uTime;
      uniform float uCameraY;
      uniform float uGroundY;
      
      void main() {
        vOpacity = opacity;
        
        vec3 pos = position;
        
        // Make particles fall, looping from top back to start
        float fallDistance = mod(uTime * velocity, 350.0);
        pos.y = position.y - fallDistance;
        
        // If particle falls below ground, wrap to top
        if (pos.y < uGroundY - 10.0) {
          pos.y += 350.0;
        }
        
        // Add some horizontal wobble
        pos.x += sin(uTime * 2.0 + position.y * 0.1) * 0.3;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vOpacity;
      
      void main() {
        // Soft circular particle
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  waterfallParticles = new THREE.Points(geometry, material);
  return waterfallParticles;
}

// Create star particle system
function createStarParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_PARTICLE_COUNT * 3);
  const sizes = new Float32Array(STAR_PARTICLE_COUNT);
  const twinkleOffsets = new Float32Array(STAR_PARTICLE_COUNT);

  for (let i = 0; i < STAR_PARTICLE_COUNT; i++) {
    // Spread stars across the game area
    positions[i * 3] = (Math.random() - 0.5) * 50; // x: -25 to 25
    positions[i * 3 + 1] = Math.random() * 300 - 10; // y: -10 to 290
    positions[i * 3 + 2] = -15 + Math.random() * 5; // z: -15 to -10

    sizes[i] = 0.20 + Math.random() * 0.40; // Bigger star dots
    twinkleOffsets[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute float twinkleOffset;
      varying float vTwinkle;
      uniform float uTime;
      
      void main() {
        // Twinkle effect
        vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + twinkleOffset);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z) * (0.7 + vTwinkle * 0.3);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vTwinkle;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        // Simple white dot with soft edge
        float alpha = smoothstep(0.5, 0.1, dist) * vTwinkle * 0.9;
        
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  starParticles = new THREE.Points(geometry, material);
  return starParticles;
}

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

  // Add gradient background with random color blobs
  const background = createGradientBackground();
  scene.add(background);

  // Add star particles (behind waterfall)
  const stars = createStarParticles();
  scene.add(stars);

  // Add waterfall particles
  const waterfall = createWaterfallParticles();
  scene.add(waterfall);

  // Create player with selected model
  const modelPath = getSelectedModelPath();
  player1 = new Player(playerWidth, playerHeight, playerDepth, modelPath);
  player1.add(scene, playerStartPositionX, playerStartPositionY);

  // Create ground
  ground = new Platform(groundWidth, groundHeight, groundColor, 7, 0); // level 0 for minimal ground texture
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

  // Update background position to follow camera
  if (backgroundMesh) {
    backgroundMesh.position.x = camera.position.x;
    backgroundMesh.position.y = camera.position.y;
  }

  // Update background shader uniforms for parallax effect
  if (backgroundUniforms) {
    backgroundUniforms.uOffset.value.set(
      camera.position.x * 0.01,
      camera.position.y * 0.005
    );
  }
}

export function setBackgroundColor(hexColor) {
  scene.background.setHex(hexColor);
  // Also update the shader base color
  if (backgroundUniforms) {
    backgroundUniforms.uBaseColor.value.setHex(hexColor);
  }
}

export function updateBackgroundForLevel(levelNumber) {
  const level = LEVELS[levelNumber - 1];
  if (level && level.backgroundColor) {
    scene.background.setHex(level.backgroundColor);
    if (backgroundUniforms) {
      backgroundUniforms.uBaseColor.value.setHex(level.backgroundColor);
    }
  } else {
    scene.background.setHex(bgColor);
    if (backgroundUniforms) {
      backgroundUniforms.uBaseColor.value.setHex(bgColor);
    }
  }
}

export function showSpikeHitFeedback() {
  gameState.isShowingSpikeHit = true;
  gameState.spikeHitTime = performance.now();
  scene.background.setHex(spikeHitColor);
  if (backgroundUniforms) {
    backgroundUniforms.uBaseColor.value.setHex(spikeHitColor);
  }
}

export function resetSpikeHitFeedback(currentTime) {
  if (gameState.isShowingSpikeHit && currentTime - gameState.spikeHitTime > 500) {
    gameState.isShowingSpikeHit = false;
    updateBackgroundForLevel(gameState.currentLevel);
  }
}

export function render() {
  const time = performance.now() * 0.001;

  // Update background animation time
  if (backgroundUniforms) {
    backgroundUniforms.uTime.value = time;
  }

  // Update waterfall particles
  if (waterfallParticles && waterfallParticles.material.uniforms) {
    waterfallParticles.material.uniforms.uTime.value = time;
    waterfallParticles.material.uniforms.uCameraY.value = camera.position.y;
  }

  // Update star particles
  if (starParticles && starParticles.material.uniforms) {
    starParticles.material.uniforms.uTime.value = time;
  }

  renderer.render(scene, camera);
}

export function changePlayerModel(modelPath) {
  if (player1) {
    player1.changeModel(modelPath);
  }
}

