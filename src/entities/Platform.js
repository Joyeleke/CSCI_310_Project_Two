import * as THREE from "three";

class Platform extends THREE.Mesh {
    constructor(width, height, color = "blue") {
        const platformGeo = new THREE.PlaneGeometry(width, height);
        const platformMat = new THREE.MeshBasicMaterial({ color: color });
        super(platformGeo, platformMat);
        this.width = width;
        this.height = height;
        this.color = color;
    }

    add(scene, x_pos = 0, y_pos = 0) {
        this.position.set(x_pos, y_pos, 0);
        this.userData = { width: this.width, height: this.height };
        scene.add(this);
    }
}

export default Platform;
