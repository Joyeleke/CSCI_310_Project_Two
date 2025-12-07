/**
 * ParticleEffectsManager.js - Player Particle Effects System
 *
 * Handles visual particle effects triggered by player actions:
 * - Glide trail particles (cyan-blue, follow player while gliding)
 * - Double jump burst particles (orange-yellow, burst on double jump)
 *
 * @module managers/ParticleEffectsManager
 *
 * ## Optimization:
 * - Object pooling: Particles are recycled instead of created/destroyed
 * - Shared geometry: All particles share geometry instances
 * - Pre-created materials: Color variations created once at startup
 *
 * ## Performance:
 * - Max 50 glide particles
 * - Max 30 jump particles per burst
 * - Particles returned to pool when expired
 */

import * as THREE from "three";

// ========================================
// SHARED RESOURCES (created once)
// ========================================

/** Shared geometry for glide trail particles */
const GLIDE_GEOMETRY = new THREE.SphereGeometry(0.1, 6, 6);

/** Shared geometry for double jump burst particles */
const JUMP_GEOMETRY = new THREE.SphereGeometry(0.12, 6, 6);

/** Pre-created materials for glide particles (cyan-blue variations) */
const GLIDE_MATERIALS = [];

/** Pre-created materials for jump particles (orange-yellow variations) */
const JUMP_MATERIALS = [];

// Initialize shared materials with color variations
for (let i = 0; i < 5; i++) {
  GLIDE_MATERIALS.push(new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(0.55 + i * 0.02, 0.8, 0.6),
    transparent: true,
    opacity: 0.7
  }));
  JUMP_MATERIALS.push(new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(0.1 + i * 0.02, 1, 0.6),
    transparent: true,
    opacity: 0.9
  }));
}

// ========================================
// PARTICLE EFFECTS MANAGER CLASS
// ========================================

/**
 * ParticleEffectsManager - Manages player-triggered particle effects
 * @class
 */
class ParticleEffectsManager {
  /**
   * Creates a new ParticleEffectsManager.
   * Use the exported singleton instead of creating new instances.
   */
  constructor() {
    /** @type {THREE.Scene|null} Reference to the game scene */
    this.scene = null;

    /** @type {THREE.Mesh[]} Active glide particles */
    this.glideParticles = [];

    /** @type {THREE.Mesh[]} Active jump particles */
    this.jumpParticles = [];

    /** @type {THREE.Mesh[]} Object pool for recycled glide particles */
    this.glidePool = [];

    /** @type {THREE.Mesh[]} Object pool for recycled jump particles */
    this.jumpPool = [];

    /** @type {number} Maximum active glide particles */
    this.maxGlideParticles = 50;

    /** @type {number} Maximum active jump particles */
    this.maxJumpParticles = 30;
  }

  /**
   * Initializes the manager with a scene reference.
   * @param {THREE.Scene} scene - The game scene
   */
  init(scene) {
    this.scene = scene;
  }

  /**
   * Gets a glide particle from pool or creates a new one.
   * @private
   * @returns {THREE.Mesh} A glide particle mesh
   */
  getGlideParticle() {
    if (this.glidePool.length > 0) {
      return this.glidePool.pop();
    }
    const material = GLIDE_MATERIALS[Math.floor(Math.random() * GLIDE_MATERIALS.length)].clone();
    return new THREE.Mesh(GLIDE_GEOMETRY, material);
  }

  /**
   * Gets a jump particle from pool or creates a new one.
   * @private
   * @returns {THREE.Mesh} A jump particle mesh
   */
  getJumpParticle() {
    if (this.jumpPool.length > 0) {
      return this.jumpPool.pop();
    }
    const material = JUMP_MATERIALS[Math.floor(Math.random() * JUMP_MATERIALS.length)].clone();
    return new THREE.Mesh(JUMP_GEOMETRY, material);
  }

  /**
   * Returns a glide particle to the pool for reuse.
   * @private
   * @param {THREE.Mesh} particle - The particle to return
   */
  returnGlideParticle(particle) {
    this.scene.remove(particle);
    particle.scale.set(1, 1, 1);
    particle.material.opacity = 0.7;
    this.glidePool.push(particle);
  }

  /**
   * Returns a jump particle to the pool for reuse.
   * @private
   * @param {THREE.Mesh} particle - The particle to return
   */
  returnJumpParticle(particle) {
    this.scene.remove(particle);
    particle.scale.set(1, 1, 1);
    particle.material.opacity = 0.9;
    this.jumpPool.push(particle);
  }

  /**
   * Spawns glide trail particles at the player's position.
   * Called each frame while the player is gliding.
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   * @param {number} direction - Glide direction (-1 left, 1 right)
   */
  spawnGlideParticles(x, y, direction) {
    if (!this.scene) return;

    // Spawn 2 particles per frame while gliding
    for (let i = 0; i < 2; i++) {
      if (this.glideParticles.length >= this.maxGlideParticles) break;

      const particle = this.getGlideParticle();
      const randomScale = 0.8 + Math.random() * 0.4;
      particle.scale.set(randomScale, randomScale, randomScale);

      particle.position.set(
        x + (Math.random() - 0.5) * 0.5 - direction * 0.3,
        y + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.3
      );

      particle.userData.velocityX = -direction * (1 + Math.random() * 2);
      particle.userData.velocityY = -0.5 + Math.random() * 0.5;
      particle.userData.lifetime = 0.5 + Math.random() * 0.3;
      particle.userData.age = 0;
      particle.userData.initialScale = randomScale;

      this.scene.add(particle);
      this.glideParticles.push(particle);
    }
  }

  /**
   * Spawns a burst of particles when the player double jumps.
   * Creates a ring of particles expanding from the player's feet.
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   */
  spawnDoubleJumpParticles(x, y) {
    if (!this.scene) return;

    const particleCount = 15; // Reduced from 20 for performance

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getJumpParticle();
      const randomScale = 0.8 + Math.random() * 0.4;
      particle.scale.set(randomScale, randomScale, randomScale);

      particle.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y - 0.5 + (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.4
      );

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 3;

      particle.userData.velocityX = Math.cos(angle) * speed;
      particle.userData.velocityY = Math.sin(angle) * speed * 0.5 + 2;
      particle.userData.lifetime = 0.4 + Math.random() * 0.2;
      particle.userData.age = 0;
      particle.userData.initialScale = randomScale;

      this.scene.add(particle);
      this.jumpParticles.push(particle);
    }
  }

  /**
   * Updates all active particles. Called every frame.
   * Handles particle movement, fading, scaling, and cleanup.
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update glide particles (iterate backwards for safe removal)
    for (let i = this.glideParticles.length - 1; i >= 0; i--) {
      const particle = this.glideParticles[i];
      const data = particle.userData;

      data.age += deltaTime;

      if (data.age >= data.lifetime) {
        this.glideParticles.splice(i, 1);
        this.returnGlideParticle(particle);
      } else {
        particle.position.x += data.velocityX * deltaTime;
        particle.position.y += data.velocityY * deltaTime;

        const lifeRatio = 1 - (data.age / data.lifetime);
        particle.material.opacity = lifeRatio * 0.7;
        const scale = lifeRatio * data.initialScale;
        particle.scale.set(scale, scale, scale);
      }
    }

    // Update jump particles
    for (let i = this.jumpParticles.length - 1; i >= 0; i--) {
      const particle = this.jumpParticles[i];
      const data = particle.userData;

      data.age += deltaTime;

      if (data.age >= data.lifetime) {
        this.jumpParticles.splice(i, 1);
        this.returnJumpParticle(particle);
      } else {
        data.velocityY -= 15 * deltaTime;
        particle.position.x += data.velocityX * deltaTime;
        particle.position.y += data.velocityY * deltaTime;

        const lifeRatio = 1 - (data.age / data.lifetime);
        particle.material.opacity = lifeRatio * 0.9;
        const scale = lifeRatio * data.initialScale;
        particle.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Clears all active particles and returns them to their pools.
   * Called when resetting the game or changing scenes.
   */
  clear() {
    for (const particle of this.glideParticles) {
      this.returnGlideParticle(particle);
    }
    this.glideParticles = [];

    for (const particle of this.jumpParticles) {
      this.returnJumpParticle(particle);
    }
    this.jumpParticles = [];
  }
}

/** @type {ParticleEffectsManager} Singleton instance */
export const particleEffects = new ParticleEffectsManager();

