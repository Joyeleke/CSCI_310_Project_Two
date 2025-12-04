import * as THREE from "three";

class Wall extends THREE.Mesh {
    constructor(width, height, color = "blue", depth = 2) {
        const wallGeo = new THREE.BoxGeometry(width, height, depth);
        const wallMat = new THREE.MeshStandardMaterial({ color });
        super(wallGeo, wallMat);
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

export default Wall;
