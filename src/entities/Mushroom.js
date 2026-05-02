const DETECT_RANGE = 320;
const RUN_SPEED    = 100;

export class Mushroom extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'mush_idle_001');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setScale(3);
    }

    static preload(scene) {
        for (let i = 1; i <= 7; i++) {
            const key = `mush_idle_${String(i).padStart(3, '0')}`;
            if (!scene.textures.exists(key))
                scene.load.image(key, `assets/sprites/mushroom/idle/frame_${String(i).padStart(3, '0')}.png`);
        }
        for (let i = 1; i <= 8; i++) {
            const key = `mush_run_${String(i).padStart(3, '0')}`;
            if (!scene.textures.exists(key))
                scene.load.image(key, `assets/sprites/mushroom/run/frame_${String(i).padStart(3, '0')}.png`);
        }
    }

    static createAnims(scene) {
        if (!scene.anims.exists('mush_idle')) {
            scene.anims.create({
                key: 'mush_idle',
                frames: Array.from({ length: 7 }, (_, i) => ({ key: `mush_idle_${String(i + 1).padStart(3, '0')}` })),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!scene.anims.exists('mush_run')) {
            scene.anims.create({
                key: 'mush_run',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `mush_run_${String(i + 1).padStart(3, '0')}` })),
                frameRate: 12,
                repeat: -1
            });
        }
    }

    update(playerX) {
        const dist = playerX - this.x;
        const near = Math.abs(dist) < DETECT_RANGE;

        if (near) {
            const dir = dist > 0 ? 1 : -1;
            this.setVelocityX(RUN_SPEED * dir);
            this.setFlipX(dir < 0);
            this.play('mush_run', true);
        } else {
            this.setVelocityX(0);
            this.play('mush_idle', true);
        }
    }
}
