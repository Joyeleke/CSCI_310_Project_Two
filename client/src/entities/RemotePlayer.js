/**
 * RemotePlayer.js - Networked Player Entity
 *
 * Represents another player in multiplayer mode, controlled via network updates.
 * Uses interpolation for smooth movement between position updates.
 *
 * @module entities/RemotePlayer
 *
 * ## Features:
 * - Smooth position interpolation (lerp)
 * - 3D model with color tint
 * - State tracking (jumping, gliding, etc.)
 * - Collision bounds for attack detection
 *
 * ## Network Updates:
 * Position updates are received ~25 times per second.
 * The update() method interpolates between updates for smooth visuals.
 *
 * ## Visual Distinction:
 * Remote players have a different color tint to distinguish
 * them from the local player.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Base path for assets (matches vite.config.js base) */
const BASE_PATH = import.meta.env.BASE_URL || '/';

/** Shared GLTFLoader instance for efficiency */
const gltfLoader = new GLTFLoader();

/**
 * RemotePlayer class - Represents a networked opponent
 * @class
 */
export default class RemotePlayer {
  /**
   * Creates a new RemotePlayer instance.
   * @param {number} width - Collision box width
   * @param {number} height - Collision box height
   * @param {number} depth - Collision box depth
   * @param {string} [skinId="player"] - Skin/model ID to load
   */
  constructor(width, height, depth, skinId = "player") {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.skinId = skinId;

    // Invisible hitbox for collision detection only (not rendered)
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      visible: false, // Hitbox is invisible - only show the model
    });
    this.hitbox = new THREE.Mesh(geometry, material);

    /** @type {THREE.Group} Container for hitbox and model */
    this.group = new THREE.Group();
    this.group.add(this.hitbox);

    // Interpolation state

    /** Target position from latest network update */
    this.targetX = 0;
    this.targetY = 0;

    /** How fast to interpolate (0-1, higher = snappier) */
    this.lerpFactor = 0.2;

    /** Player state from network (isJumping, isGliding, etc.) */
    this.state = {};

    /** Velocity from network (used for prediction if needed) */
    this.velocityY = 0;

    // Load the 3D model based on skinId
    this.model = null;
    this.loadModel();
  }

  /**
   * Load the player 3D model based on skinId
   */
  loadModel() {
    // Map skinId to model file
    const skinToFile = {
      'player': 'player.glb',
      'cookie': 'cookie.glb',
      'tanjiro': 'Tanjiro Kamado.glb',
      'llama': 'llama.gltf',
    };

    const modelFile = skinToFile[this.skinId.toLowerCase()] || 'player.glb';

    gltfLoader.load(
      `${BASE_PATH}models/${modelFile}`,
      (gltf) => {
        this.model = gltf.scene;

        const bbox = new THREE.Box3().setFromObject(this.model);
        const modelSize = bbox.getSize(new THREE.Vector3());

        // Scale to match the desired width and height
        const scaleX = 0.8 / modelSize.x;
        const scaleY = 1.4 / modelSize.y;
        const scaleZ = scaleX;

        this.model.scale.set(scaleX, scaleY, scaleZ);
        this.model.position.y = 0;

        // Apply model-specific rotations (e.g., llama needs 180 degree rotation)
        if (this.skinId.toLowerCase() === 'llama') {
          this.model.rotation.y = Math.PI;
        }

        // Enable shadows on the model
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
          }
        });

        this.group.add(this.model);
      },
      undefined,
      (error) => console.error("Error loading remote player model:", error)
    );
  }

  /**
   * Add the remote player to the scene
   */
  add(scene, x, y) {
    this.group.position.set(x, y, 0);
    this.targetX = x;
    this.targetY = y;
    scene.add(this.group);
    this.position = this.group.position;
  }

  /**
   * Remove the remote player from the scene
   */
  remove(scene) {
    scene.remove(this.group);
  }

  /**
   * Set the target position from a network update
   * The player will smoothly interpolate towards this position
   */
  setTargetPosition(x, y, velocityY = 0, state = {}) {
    this.targetX = x;
    this.targetY = y;
    this.velocityY = velocityY;
    this.state = state;
  }

  /**
   * Update the remote player's position using interpolation
   */
  update() {
    // Lerp (Linear Interpolation) towards target position.  This creates smooth movement even with infrequent network updates

    const currentX = this.group.position.x;
    const currentY = this.group.position.y;

    const dx = this.targetX - currentX;
    const dy = this.targetY - currentY;

    // Only interpolate if not already at target
    if (Math.abs(dx) > 0.001) {
      this.group.position.x += dx * this.lerpFactor;
    } else {
      this.group.position.x = this.targetX;
    }

    if (Math.abs(dy) > 0.001) {
      this.group.position.y += dy * this.lerpFactor;
    } else {
      this.group.position.y = this.targetY;
    }
  }

  /**
   * Get the current height (for opponent height display)
   */
  getHeight() {
    return this.group.position.y;
  }

  /**
   * Update the skin/model of this remote player
   * @param {string} skinId - The new skin ID to load
   */
  setSkin(skinId) {
    if (this.skinId === skinId) return; // No change needed

    this.skinId = skinId;

    // Remove old model if exists
    if (this.model) {
      this.group.remove(this.model);
      this.model = null;
    }

    // Load new model
    this.loadModel();
  }

  /**
   * Check if this remote player's hitbox overlaps with a position
   * Used for player-to-player collision detection
   * @param {Object} otherPos - { x, y } position to check
   * @param {number} otherWidth - Width of other hitbox
   * @param {number} otherHeight - Height of other hitbox
   * @returns {Object|null} Overlap info { overlapX, overlapY } or null
   */
  checkCollision(otherPos, otherWidth, otherHeight) {
    const myPos = this.group.position;

    const dx = otherPos.x - myPos.x;
    const dy = otherPos.y - myPos.y;

    const combinedHalfWidth = (this.width + otherWidth) / 2;
    const combinedHalfHeight = (this.height + otherHeight) / 2;

    const overlapX = combinedHalfWidth - Math.abs(dx);
    const overlapY = combinedHalfHeight - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      return {
        overlapX: dx > 0 ? overlapX : -overlapX,
        overlapY: dy > 0 ? overlapY : -overlapY,
      };
    }

    return null;
  }
}
