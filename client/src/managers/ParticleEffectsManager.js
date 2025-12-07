import * as THREE from "three";

// ========================================
// PARTICLE EFFECTS MANAGER
// ========================================

class ParticleEffectsManager {
  constructor() {
    this.scene = null;
    this.glideParticles = [];
    this.jumpParticles = [];
    this.maxGlideParticles = 50;
    this.maxJumpParticles = 30;
  }

  /**
   * Initialize with the scene reference
   * @param {THREE.Scene} scene
   */
  init(scene) {
    this.scene = scene;
  }

  /**
   * Spawn glide trail particles at player position
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   * @param {number} direction - Glide direction (-1 left, 1 right)
   */
  spawnGlideParticles(x, y, direction) {
    if (!this.scene) return;

    // Spawn a few particles per frame while gliding
    const particleCount = 2;

    for (let i = 0; i < particleCount; i++) {
      // Create particle geometry
      const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6), // Cyan-blue
        transparent: true,
        opacity: 0.7
      });

      const particle = new THREE.Mesh(geometry, material);

      // Position slightly behind and around the player
      particle.position.set(
        x + (Math.random() - 0.5) * 0.5 - direction * 0.3,
        y + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.3
      );

      // Store velocity and lifetime
      particle.userData = {
        velocityX: -direction * (1 + Math.random() * 2),
        velocityY: -0.5 + Math.random() * 0.5,
        lifetime: 0.5 + Math.random() * 0.3,
        age: 0
      };

      this.scene.add(particle);
      this.glideParticles.push(particle);
    }

    // Remove old particles if too many
    while (this.glideParticles.length > this.maxGlideParticles) {
      const old = this.glideParticles.shift();
      this.scene.remove(old);
      old.geometry.dispose();
      old.material.dispose();
    }
  }

  /**
   * Spawn double jump burst particles at player position
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   */
  spawnDoubleJumpParticles(x, y) {
    if (!this.scene) return;

    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      // Create particle geometry
      const size = 0.1 + Math.random() * 0.1;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.6), // Orange-yellow
        transparent: true,
        opacity: 0.9
      });

      const particle = new THREE.Mesh(geometry, material);

      // Position at player's feet
      particle.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y - 0.5 + (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.4
      );

      // Burst outward in a ring pattern
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 3;

      particle.userData = {
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed * 0.5 + 2, // Bias upward
        lifetime: 0.4 + Math.random() * 0.2,
        age: 0
      };

      this.scene.add(particle);
      this.jumpParticles.push(particle);
    }

    // Remove old particles if too many
    while (this.jumpParticles.length > this.maxJumpParticles * 2) {
      const old = this.jumpParticles.shift();
      this.scene.remove(old);
      old.geometry.dispose();
      old.material.dispose();
    }
  }

  /**
   * Update all particles - call this every frame
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update glide particles
    for (let i = this.glideParticles.length - 1; i >= 0; i--) {
      const particle = this.glideParticles[i];
      const data = particle.userData;

      data.age += deltaTime;

      if (data.age >= data.lifetime) {
        // Remove expired particle
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        this.glideParticles.splice(i, 1);
      } else {
        // Update position
        particle.position.x += data.velocityX * deltaTime;
        particle.position.y += data.velocityY * deltaTime;

        // Fade out
        const lifeRatio = 1 - (data.age / data.lifetime);
        particle.material.opacity = lifeRatio * 0.7;

        // Shrink
        const scale = lifeRatio;
        particle.scale.set(scale, scale, scale);
      }
    }

    // Update jump particles
    for (let i = this.jumpParticles.length - 1; i >= 0; i--) {
      const particle = this.jumpParticles[i];
      const data = particle.userData;

      data.age += deltaTime;

      if (data.age >= data.lifetime) {
        // Remove expired particle
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        this.jumpParticles.splice(i, 1);
      } else {
        // Update position with gravity
        data.velocityY -= 15 * deltaTime; // Gravity
        particle.position.x += data.velocityX * deltaTime;
        particle.position.y += data.velocityY * deltaTime;

        // Fade out
        const lifeRatio = 1 - (data.age / data.lifetime);
        particle.material.opacity = lifeRatio * 0.9;

        // Shrink
        const scale = lifeRatio;
        particle.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const particle of this.glideParticles) {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    }
    this.glideParticles = [];

    for (const particle of this.jumpParticles) {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    }
    this.jumpParticles = [];
  }
}

// Export singleton instance
export const particleEffects = new ParticleEffectsManager();

