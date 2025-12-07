import * as THREE from "three";

// ========================================
// PARTICLE EFFECTS MANAGER
// Optimized with object pooling and shared geometry
// ========================================

// Shared geometries (created once, reused for all particles)
const GLIDE_GEOMETRY = new THREE.SphereGeometry(0.1, 6, 6);
const JUMP_GEOMETRY = new THREE.SphereGeometry(0.12, 6, 6);

// Pre-created materials for color variations
const GLIDE_MATERIALS = [];
const JUMP_MATERIALS = [];

// Initialize shared materials
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

class ParticleEffectsManager {
  constructor() {
    this.scene = null;
    this.glideParticles = [];
    this.jumpParticles = [];
    this.glidePool = []; // Object pool for glide particles
    this.jumpPool = []; // Object pool for jump particles
    this.maxGlideParticles = 50;
    this.maxJumpParticles = 30;
  }

  init(scene) {
    this.scene = scene;
  }

  // Get a particle from pool or create new one
  getGlideParticle() {
    if (this.glidePool.length > 0) {
      return this.glidePool.pop();
    }
    const material = GLIDE_MATERIALS[Math.floor(Math.random() * GLIDE_MATERIALS.length)].clone();
    return new THREE.Mesh(GLIDE_GEOMETRY, material);
  }

  getJumpParticle() {
    if (this.jumpPool.length > 0) {
      return this.jumpPool.pop();
    }
    const material = JUMP_MATERIALS[Math.floor(Math.random() * JUMP_MATERIALS.length)].clone();
    return new THREE.Mesh(JUMP_GEOMETRY, material);
  }

  // Return particle to pool
  returnGlideParticle(particle) {
    this.scene.remove(particle);
    particle.scale.set(1, 1, 1);
    particle.material.opacity = 0.7;
    this.glidePool.push(particle);
  }

  returnJumpParticle(particle) {
    this.scene.remove(particle);
    particle.scale.set(1, 1, 1);
    particle.material.opacity = 0.9;
    this.jumpPool.push(particle);
  }

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

export const particleEffects = new ParticleEffectsManager();

