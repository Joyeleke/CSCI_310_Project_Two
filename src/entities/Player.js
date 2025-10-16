import * as THREE from "three";

class Player extends THREE.Mesh {
    constructor(width, height, depth, color) {
        const playerGeo = new THREE.BoxGeometry(width, height, depth);
        const playerMat = new THREE.MeshBasicMaterial({ color: color });
        super(playerGeo, playerMat);
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.color = color;
    }

    add(scene, x_pos = 0, y_pos = 0) {
        this.position.set(x_pos, y_pos, 0);
        scene.add(this);
    }
}

export default Player;
