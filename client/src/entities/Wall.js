/**
 * Wall.js
 *
 * Represents a wall in the game that players can wall-jump from.
 * Uses the same texture system as platforms for visual consistency.
 *
 * @module entities/Wall
 */

import * as THREE from "three";
import { generatePlatformTexture } from './platformTextures.js';

/**
 * Wall class - A vertical surface players can wall-jump from
 *
 * @extends THREE.Mesh
 */
class Wall extends THREE.Mesh {
  /**
   * Creates a new wall with optional texture
   * @param {number} width - Width of the wall
   * @param {number} height - Height of the wall
   * @param {number|string} color - Color of the wall (hex or color name)
   * @param {number} depth - Depth of the wall (z-axis)
   * @param {number} level - Level number for texture assignment
   */
  constructor(width, height, color = "blue", depth = 2, level = 1) {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);

    // Convert color to hex if string
    const colorValue = typeof color === 'string'
      ? new THREE.Color(color).getHex()
      : color;

    // Get texture for the wall based on level
    const texture = generatePlatformTexture(colorValue, level);

    const wallMat = new THREE.MeshStandardMaterial({
      color: colorValue,
      map: texture,
      roughness: 0.85,
      metalness: 0.05
    });

    super(wallGeo, wallMat);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.color = color;
    this.level = level;
    this.castShadow = false;
    this.receiveShadow = true;
  }

  /**
   * Adds the wall to the scene at the specified position
   * @param {THREE.Scene} scene - The scene to add to
   * @param {number} x_pos - X position
   * @param {number} y_pos - Y position
   * @param {number} z_pos - Z position
   */
  add(scene, x_pos = 0, y_pos = 0, z_pos = 0) {
    this.position.set(x_pos, y_pos, z_pos);
    this.userData = {
      width: this.width,
      height: this.height,
      depth: this.depth,
    };
    scene.add(this);
  }
}

export default Wall;
