import * as THREE from "three";

class Platform extends THREE.Mesh {
  constructor(width, height, color = "blue", depth = 2) {
    const platformGeo = new THREE.BoxGeometry(width, height, depth);
    const platformMat = new THREE.MeshStandardMaterial({ color });
    super(platformGeo, platformMat);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.color = color;
    this.castShadow = false;
    this.receiveShadow = true;
  }

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
