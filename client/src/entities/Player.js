import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Base path for assets (matches vite.config.js base)
const BASE_PATH = import.meta.env.BASE_URL || '/';

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
    this.baseRotationY = 0; // Store base rotation for model-specific adjustments
    this.createAttackIndicator();
    this.loadModel();
  }

  createAttackIndicator() {
    // Create a visual indicator for the attack (a simple punch/swipe effect)
    const attackGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
    const attackMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.7
    });
    this.attackIndicator = new THREE.Mesh(attackGeometry, attackMaterial);
    this.attackIndicator.visible = false;
    this.attackIndicator.position.set(0.8, 0, 0); // Position to the right of player
    this.group.add(this.attackIndicator);
  }

  showAttack(direction) {
    if (this.attackIndicator && direction) {
      this.attackIndicator.visible = true;
      // Position attack indicator based on direction
      if (direction.x !== 0) {
        // Horizontal attack (left/right) - taller hitbox
        this.attackIndicator.position.set(direction.x * 0.8, 0, 0);
        this.attackIndicator.scale.set(1, 3, 1); // Scale Y to make it taller

        // Rotate the model 90 degrees to face the attack direction
        if (this.model) {
          if (direction.x > 0) {
            this.model.rotation.y = this.baseRotationY - Math.PI / 2; // Rotate 90 degrees right
          } else {
            this.model.rotation.y = this.baseRotationY + Math.PI / 2; // Rotate 90 degrees left
          }
        }
      } else {
        // Vertical attack (up/down) - taller hitbox
        this.attackIndicator.position.set(0, direction.y * 0.8, 0);
        this.attackIndicator.scale.set(1, 3, 1); // Scale Y to make it taller
      }
    }
  }

  hideAttack() {
    if (this.attackIndicator) {
      this.attackIndicator.visible = false;
      this.attackIndicator.scale.set(1, 1, 1); // Reset scale
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
      // Horizontal attack - taller height for side attacks
      centerX += direction.x * 0.8;
      return {
        left: centerX - 0.4,
        right: centerX + 0.4,
        bottom: centerY - 0.6,
        top: centerY + 0.6
      };
    } else {
      // Vertical attack - taller height for up/down attacks
      centerY += direction.y * 0.8;
      return {
        left: centerX - 0.4,
        right: centerX + 0.4,
        bottom: centerY - 0.6,
        top: centerY + 0.6
      };
    }
  }

  loadModel() {
    const loader = new GLTFLoader();

    loader.load(
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
