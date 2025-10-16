import * as THREE from "three";

class Player {
    constructor(width, height, depth, color) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.color = color;
    }

    add(scene, x_pos = 0, y_pos = 0) {
        const playerGeo = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const playerMat = new THREE.MeshBasicMaterial({ color: this.color });
        const player = new THREE.Mesh(playerGeo, playerMat);
        player.position.set(x_pos, y_pos, 0);
        scene.add(player);
        return player;
    }
}

export default Player;
