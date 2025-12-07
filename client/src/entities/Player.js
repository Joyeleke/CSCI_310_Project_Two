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
    this.loadModel();
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
          this.model.rotation.y = Math.PI; // Rotate 180 degrees on X axis
        }

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
