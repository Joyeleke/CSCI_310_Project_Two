/**
 * Spike.js - Hazard Platform Entity
 *
 * Represents a spike platform that kills the player on contact.
 * Extends Platform class with spike visual indicators.
 *
 * @module entities/Spike
 *
 * ## Behavior:
 * - Contact triggers player respawn (not win loss)
 * - Visual feedback (background flash red)
 * - Timer resets on death
 *
 * ## Visuals:
 * - Gray platform base
 * - Grid of cone-shaped spikes on top surface
 * - Spikes automatically fill the platform area
 */

import * as THREE from "three";
import Platform from "./Platform.js";

/**
 * Spike class - Hazard platform that kills the player
 * @extends Platform
 */
class Spike extends Platform {
  /**
   * Creates a new Spike platform.
   * @param {number} width - Width of the platform
   * @param {number} height - Height of the platform
   * @param {number} [depth=2] - Depth of the platform
   */
  constructor(width, height, depth = 2) {
    const spikeColor = 0x666666; // Gray base
    super(width, height, spikeColor, depth);

    /** @type {boolean} Flag to identify spike platforms in collision detection */
    this.isSpike = true;
  }

  /**
   * Adds the spike platform to the scene with visual spike cones.
   * @param {THREE.Scene} scene - The scene to add to
   * @param {number} [x_pos=0] - X position
   * @param {number} [y_pos=0] - Y position
   * @param {number} [z_pos=0] - Z position
   */
  add(scene, x_pos = 0, y_pos = 0, z_pos = 0) {
    super.add(scene, x_pos, y_pos, z_pos);
    this.addSpikeVisuals(scene);
  }

  /**
   * Adds cone-shaped spike visuals across the platform surface.
   * @private
   * @param {THREE.Scene} scene - The scene to add spikes to
   */
  addSpikeVisuals(scene) {
    const spikeSpacing = 0.4;
    const spikeCountX = Math.floor(this.width / spikeSpacing);
    const spikeCountZ = Math.floor(this.depth / spikeSpacing);

    const spikeGeometry = new THREE.ConeGeometry(0.08, 0.25, 4);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    // Generate spikes in a grid pattern
    for (let i = 0; i < spikeCountX; i++) {
      for (let j = 0; j < spikeCountZ; j++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

        const offsetX = (i - (spikeCountX - 1) / 2) * spikeSpacing;
        const offsetZ = (j - (spikeCountZ - 1) / 2) * spikeSpacing;

        spike.position.set(
          this.position.x + offsetX,
          this.position.y + this.height / 2 + 0.125,
          this.position.z + offsetZ
        );
        spike.castShadow = true;
        scene.add(spike);
      }
    }
  }
}

export default Spike;
