/**
 * platformTextures.js
 *
 * Shared texture generation for platforms and walls.
 * Creates subtle procedural textures that complement the game's visual style.
 * Uses caching to avoid regenerating textures for the same color/pattern combinations.
 *
 * @module entities/platformTextures
 */

import * as THREE from "three";

// ========================================
// TEXTURE CACHE
// ========================================

/** Cache for generated textures to avoid recreating them */
const textureCache = new Map();

// ========================================
// TEXTURE PATTERNS
// ========================================

/**
 * Available texture pattern types for platforms
 * Each creates a subtle, non-invasive pattern
 */
const TEXTURE_PATTERNS = ['noise', 'grid', 'dots', 'lines', 'clean'];

/**
 * Level to texture pattern mapping
 * Each level uses a specific pattern for consistency
 */
const LEVEL_PATTERNS = {
  1: 'clean',
  2: 'lines',
  3: 'grid',
  4: 'dots',
  5: 'noise',
  6: 'clean',
  7: 'lines',
  8: 'grid',
  9: 'dots',
  10: 'noise',
};

// ========================================
// PATTERN GENERATION FUNCTIONS
// ========================================

/**
 * Adds visible noise pattern to the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 */
function addNoisePattern(ctx, size, r, g, b) {
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Strong noise variation (±25%)
    const variation = (Math.random() - 0.5) * 0.5;
    data[i] = Math.min(255, Math.max(0, r + r * variation));
    data[i + 1] = Math.min(255, Math.max(0, g + g * variation));
    data[i + 2] = Math.min(255, Math.max(0, b + b * variation));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add speckles for extra texture
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255, 255, 255, 0.3)`
      : `rgba(0, 0, 0, 0.3)`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Adds bold grid pattern to the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 */
function addGridPattern(ctx, size) {
  const gridSize = size / 4;

  // Dark grid lines - very visible
  ctx.strokeStyle = `rgba(0, 0, 0, 0.35)`;
  ctx.lineWidth = 3;

  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Bright highlight on top and left edge of each cell
  ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
  ctx.lineWidth = 2;
  for (let x = 2; x < size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 2; y < size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
}

/**
 * Adds bold dots pattern to the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 */
function addDotsPattern(ctx, size) {
  const spacing = size / 4;

  // Large bright dots
  ctx.fillStyle = `rgba(255, 255, 255, 0.45)`;
  for (let x = spacing / 2; x < size; x += spacing) {
    for (let y = spacing / 2; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Smaller dark dots offset
  ctx.fillStyle = `rgba(0, 0, 0, 0.35)`;
  for (let x = spacing; x < size; x += spacing) {
    for (let y = spacing; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Adds bold horizontal lines pattern to the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 */
function addLinesPattern(ctx, size) {
  const lineSpacing = size / 5;

  // Dark lines
  ctx.strokeStyle = `rgba(0, 0, 0, 0.4)`;
  ctx.lineWidth = 4;
  for (let y = lineSpacing; y < size; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Bright highlight lines just above
  ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
  ctx.lineWidth = 2;
  for (let y = lineSpacing - 4; y < size; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
}

/**
 * Adds bold edge shading for depth effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 */
function addEdgeShading(ctx, size) {
  // Strong top edge highlight, bottom edge shadow
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, `rgba(255, 255, 255, 0.5)`);
  gradient.addColorStop(0.15, `rgba(255, 255, 255, 0.2)`);
  gradient.addColorStop(0.5, `rgba(0, 0, 0, 0)`);
  gradient.addColorStop(0.85, `rgba(0, 0, 0, 0.2)`);
  gradient.addColorStop(1, `rgba(0, 0, 0, 0.45)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Strong corner highlight
  const cornerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.6);
  cornerGradient.addColorStop(0, `rgba(255, 255, 255, 0.35)`);
  cornerGradient.addColorStop(0.5, `rgba(255, 255, 255, 0.1)`);
  cornerGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  ctx.fillStyle = cornerGradient;
  ctx.fillRect(0, 0, size, size);

  // Bottom-right shadow
  const shadowGradient = ctx.createRadialGradient(size, size, 0, size, size, size * 0.6);
  shadowGradient.addColorStop(0, `rgba(0, 0, 0, 0.3)`);
  shadowGradient.addColorStop(0.5, `rgba(0, 0, 0, 0.1)`);
  shadowGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Adds minimal ground texture - very subtle for the base platform
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 */
function addGroundTexture(ctx, size) {
  // Very subtle top highlight only
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, `rgba(255, 255, 255, 0.15)`);
  gradient.addColorStop(0.3, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

// ========================================
// MAIN TEXTURE GENERATION
// ========================================

/**
 * Generates a subtle procedural texture on a canvas
 * @param {number} baseColor - The base color as hex number
 * @param {number} [level=1] - The level number to determine pattern (0 for ground)
 * @returns {THREE.CanvasTexture} The generated texture
 */
export function generatePlatformTexture(baseColor, level = 1) {
  // Level 0 is ground - use minimal texture
  // Other levels use their assigned pattern
  let selectedPattern;
  if (level === 0) {
    selectedPattern = 'ground';
  } else {
    // Use level-based pattern, cycling through if level > 10
    const patternLevel = ((level - 1) % 10) + 1;
    selectedPattern = LEVEL_PATTERNS[patternLevel] || 'clean';
  }

  const cacheKey = `${selectedPattern}-${baseColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const size = 128; // Larger texture for better detail
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Convert hex color to RGB
  const color = new THREE.Color(baseColor);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  // Fill with base color
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, size, size);

  // Add pattern overlay based on level
  switch (selectedPattern) {
    case 'ground':
      addGroundTexture(ctx, size);
      break;
    case 'noise':
      addNoisePattern(ctx, size, r, g, b);
      break;
    case 'grid':
      addGridPattern(ctx, size);
      break;
    case 'dots':
      addDotsPattern(ctx, size);
      break;
    case 'lines':
      addLinesPattern(ctx, size);
      break;
    case 'clean':
    default:
      addEdgeShading(ctx, size);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1); // Single repeat for clearer patterns

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Returns the list of available texture patterns
 * @returns {string[]} Array of pattern names
 */
export function getAvailablePatterns() {
  return [...TEXTURE_PATTERNS];
}

/**
 * Clears the texture cache (useful for memory management)
 */
export function clearTextureCache() {
  textureCache.clear();
}

