/**
 * Platform.js
 *
 * Represents a platform in the game world that players can stand on.
 * Features subtle procedural textures that complement the game's visual style.
 *
 * @module entities/Platform
 */

import * as THREE from "three";
import { generatePlatformTexture } from './platformTextures.js';

/**
 * Platform class - A solid surface that players can stand on
 *
 * @extends THREE.Mesh
 */
class Platform extends THREE.Mesh {
  /**
   * Creates a new platform with optional texture
   * @param {number} width - Width of the platform
   * @param {number} height - Height of the platform
   * @param {number|string} color - Color of the platform (hex or color name)
   * @param {number} depth - Depth of the platform (z-axis)
   * @param {number} level - Level number for texture assignment (0 for ground)
   */
  constructor(width, height, color = "blue", depth = 2, level = 1) {
    const platformGeo = new THREE.BoxGeometry(width, height, depth);

    // Convert color to hex if string
    const colorValue = typeof color === 'string'
      ? new THREE.Color(color).getHex()
      : color;

    // Generate texture based on level
    const texture = generatePlatformTexture(colorValue, level);

    const platformMat = new THREE.MeshStandardMaterial({
      color: colorValue,
      map: texture,
      roughness: 0.8,
      metalness: 0.1
    });

    super(platformGeo, platformMat);

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.color = color;
    this.level = level;
    this.castShadow = false;
    this.receiveShadow = true;
  }

  /**
   * Adds the platform to the scene at the specified position
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

export default Platform;
