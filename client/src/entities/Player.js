import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Base path for assets (matches vite.config.js base)
const BASE_PATH = import.meta.env.BASE_URL || '/';

// Shared loader instance
const gltfLoader = new GLTFLoader();

export default class Player {
  constructor(width, height, depth, modelPath = `${BASE_PATH}models/player.glb`) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.modelPath = modelPath;

    // Invisible bounding box for collisions
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ visible: false }); // invisible hitbox
    this.hitbox = new THREE.Mesh(geometry, material);

    this.group = new THREE.Group(); // Parent that holds both model and hitbox
    this.group.add(this.hitbox);

    this.model = null;
    this.attackIndicator = null;
    this.attackParticles = [];
    this.baseRotationY = 0; // Store base rotation for model-specific adjustments
    this.createAttackIndicator();
    this.loadModel();
  }

  createAttackIndicator() {
    // Create a container for attack particles
    this.attackIndicator = new THREE.Group();
    this.attackIndicator.visible = false;
    this.group.add(this.attackIndicator);

    // Pre-create particle meshes for the attack effect - more and larger particles
    const particleCount = 18;
    const particleGeometry = new THREE.SphereGeometry(0.15, 6, 6); // Larger particles

    for (let i = 0; i < particleCount; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0, 0.9, 0.5 + Math.random() * 0.2), // Red with slight variation
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        baseX: 0,
        baseY: 0,
        offsetX: (Math.random() - 0.5) * 1.2, // Wider spread
        offsetY: (Math.random() - 0.5) * 2.0, // Taller spread
        offsetZ: (Math.random() - 0.5) * 0.6,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      };
      this.attackIndicator.add(particle);
      this.attackParticles.push(particle);
    }
  }

  showAttack(direction) {
    if (this.attackIndicator && direction) {
      this.attackIndicator.visible = true;

      // Position and animate attack particles based on direction
      const time = performance.now() * 0.01;

      if (direction.x !== 0) {
        // Horizontal attack (left/right) - larger area
        this.attackParticles.forEach((particle, i) => {
          const data = particle.userData;
          const spread = Math.sin(time * data.speed + data.phase) * 0.3;
          particle.position.set(
            direction.x * (1.0 + Math.abs(data.offsetX) * 0.6) + spread * direction.x,
            data.offsetY,
            data.offsetZ
          );
          particle.scale.setScalar(1.0 + Math.sin(time * data.speed + i) * 0.4);
          particle.material.opacity = 0.7 + Math.sin(time * data.speed) * 0.3;
        });

        // Rotate the model 90 degrees to face the attack direction
        if (this.model) {
          if (direction.x > 0) {
            this.model.rotation.y = this.baseRotationY - Math.PI / 2;
          } else {
            this.model.rotation.y = this.baseRotationY + Math.PI / 2;
          }
        }
      } else {
        // Vertical attack (up/down) - larger area
        this.attackParticles.forEach((particle, i) => {
          const data = particle.userData;
          const spread = Math.sin(time * data.speed + data.phase) * 0.3;
          particle.position.set(
            data.offsetX,
            direction.y * (1.0 + Math.abs(data.offsetY) * 0.4) + spread * direction.y,
            data.offsetZ
          );
          particle.scale.setScalar(1.0 + Math.sin(time * data.speed + i) * 0.4);
          particle.material.opacity = 0.7 + Math.sin(time * data.speed) * 0.3;
        });
      }
    }
  }

  hideAttack() {
    if (this.attackIndicator) {
      this.attackIndicator.visible = false;
    }
    // Reset model rotation to base rotation
    if (this.model) {
      this.model.rotation.y = this.baseRotationY;
    }
  }

  // Get the attack hitbox bounds in world coordinates
  getAttackBounds(direction) {
    if (!direction) return null;

    let centerX = this.group.position.x;
    let centerY = this.group.position.y;

    if (direction.x !== 0) {
      // Horizontal attack - larger hit area
      centerX += direction.x * 1.0;
      return {
        left: centerX - 0.8,
        right: centerX + 0.8,
        bottom: centerY - 1.0,
        top: centerY + 1.0
      };
    } else {
      // Vertical attack - larger hit area
      centerY += direction.y * 1.0;
      return {
        left: centerX - 0.8,
        right: centerX + 0.8,
        bottom: centerY - 1.0,
        top: centerY + 1.0
      };
    }
  }

  loadModel() {
    gltfLoader.load(
      this.modelPath,
      (gltf) => {
        this.model = gltf.scene;

        // Get the bounding box to understand the model's dimensions
        const bbox = new THREE.Box3().setFromObject(this.model);
        const modelSize = bbox.getSize(new THREE.Vector3());

        // Scale to match the desired width and height
        const scaleX = 0.8 / modelSize.x;
        const scaleY = 1.4 / modelSize.y;
        const scaleZ = scaleX; // Keep depth proportional to width

        this.model.scale.set(scaleX, scaleY, scaleZ);

        // Position the model so its bottom aligns with the bottom of the hitbox
        // The hitbox is centered at (0,0,0), so the bottom of the hitbox is at -height/2
        // We want the bottom of the model to align with the bottom of the hitbox
        this.model.position.y = 0; // Center the model with the hitbox center

        // Apply model-specific rotations
        if (this.modelPath.includes('llama.gltf')) {
          this.baseRotationY = Math.PI; // Llama needs 180 degree base rotation
        } else {
          this.baseRotationY = 0;
        }
        this.model.rotation.y = this.baseRotationY;

        this.group.add(this.model);
      },
      undefined,
      (error) => console.error("Error loading player model:", error)
    );
  }

  add(scene, x, y) {
    this.group.position.set(x, y, 0);
    scene.add(this.group);
    this.position = this.group.position;
  }

  changeModel(newModelPath) {
    // Remove existing model from group
    if (this.model) {
      this.group.remove(this.model);
      this.model = null;
    }

    // Load the new model
    this.modelPath = newModelPath;
    this.loadModel();
  }
}
