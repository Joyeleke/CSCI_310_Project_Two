import * as THREE from "three";
import Platform from "./Platform.js";

class Spike extends Platform {
  constructor(width, height, depth = 2) {
    // Make spikes gray colored
    const spikeColor = 0x666666;
    super(width, height, spikeColor, depth);
    this.isSpike = true; // Flag to identify spike platforms
  }

  add(scene, x_pos = 0, y_pos = 0, z_pos = 0) {
    super.add(scene, x_pos, y_pos, z_pos);
    // Add spike visual indicator - fill the entire platform surface
    this.addSpikeVisuals(scene);
  }

  addSpikeVisuals(scene) {
    const spikeSpacing = 0.4; // Space between spikes
    const spikeCountX = Math.floor(this.width / spikeSpacing); // Spikes along X axis
    const spikeCountZ = Math.floor(this.depth / spikeSpacing); // Spikes along Z axis

    const spikeGeometry = new THREE.ConeGeometry(0.08, 0.25, 4);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    // Generate spikes in a grid pattern across the entire platform
    for (let i = 0; i < spikeCountX; i++) {
      for (let j = 0; j < spikeCountZ; j++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

        // Calculate position offsets for grid placement
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
