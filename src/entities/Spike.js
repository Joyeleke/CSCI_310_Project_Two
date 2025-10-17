import * as THREE from "three";

class Wall {
    constructor(x, y, width, height, color = "blue") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    add(scene, x_rel = 0, y_rel = 0) {
        const x_pos = x_rel + this.x;
        const y_pos = y_rel + this.y;
        const platformGeo = new THREE.PlaneGeometry(this.width, this.height);
        const platformMat = new THREE.MeshBasicMaterial({ color: this.color });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(x_pos, y_pos, 0);
        platform.userData = { width: this.width, height: this.height };
        scene.add(platform);
        return platform;
    }
}

export default Wall;
