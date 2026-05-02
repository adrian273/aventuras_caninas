const SPEEDS = { cat1: 70, cat2: 38, cat3: 115, bird: 130 };

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config = {}) {
        const type = config.type || 'cat1';
        super(scene, x, y, `enemy_${type}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.startX      = x;
        this.patrolRange = config.range || 150;
        this.speed       = SPEEDS[type] || 70;
        this.isBird      = type === 'bird';

        if (this.isBird) {
            this.body.setAllowGravity(false);
            this.flyY = y;
        }
    }

    static createTextures(scene) {
        Enemy._cat1(scene);
        Enemy._cat2(scene);
        Enemy._cat3(scene);
        Enemy._bird(scene);
    }

    static _bird(scene) {
        const g = scene.make.graphics({ add: false });

        g.fillStyle(0x44aaff);
        g.fillEllipse(22, 20, 28, 14);

        g.fillStyle(0x2288dd);
        g.fillTriangle(4, 16, 18, 12, 4, 8);
        g.fillTriangle(40, 16, 26, 12, 40, 8);

        g.fillStyle(0xffffff);
        g.fillCircle(28, 16, 5);
        g.fillStyle(0x000000);
        g.fillCircle(29, 16, 2.5);

        g.fillStyle(0xffaa00);
        g.fillTriangle(34, 17, 42, 16, 34, 14);

        g.fillStyle(0x1166bb);
        g.fillTriangle(14, 24, 22, 27, 30, 24);

        g.generateTexture('enemy_bird', 46, 32);
        g.destroy();
    }

    static _cat1(scene) {
        const g = scene.make.graphics({ add: false });

        g.fillStyle(0xff6600);
        g.fillEllipse(20, 24, 30, 20);
        g.fillCircle(20, 11, 10);
        g.fillTriangle(9, 6,  14, 16, 5,  16);
        g.fillTriangle(31, 6, 35, 16, 26, 16);

        g.fillStyle(0xffcc00);
        g.fillCircle(15, 10, 4);
        g.fillCircle(25, 10, 4);

        g.fillStyle(0x000000);
        g.fillCircle(15, 10, 2);
        g.fillCircle(25, 10, 2);

        g.fillStyle(0xff9999);
        g.fillCircle(20, 15, 2);

        g.lineStyle(1, 0x000000, 0.8);
        g.lineBetween(5, 14, 14, 16);
        g.lineBetween(35, 14, 26, 16);

        g.fillStyle(0xff6600);
        g.fillEllipse(36, 28, 8, 16);

        g.generateTexture('enemy_cat1', 44, 38);
        g.destroy();
    }

    static _cat2(scene) {
        const g = scene.make.graphics({ add: false });

        g.fillStyle(0x8855cc);
        g.fillEllipse(24, 26, 40, 26);
        g.fillCircle(24, 11, 13);
        g.fillTriangle(12, 3, 16, 16, 6,  16);
        g.fillTriangle(36, 3, 46, 16, 32, 16);

        g.fillStyle(0xddaaff);
        g.fillEllipse(24, 26, 28, 18);

        g.fillStyle(0xff9900);
        g.fillCircle(18, 10, 5);
        g.fillCircle(30, 10, 5);

        g.fillStyle(0x000000);
        g.fillEllipse(18, 11, 4, 5);
        g.fillEllipse(30, 11, 4, 5);

        g.lineStyle(2, 0x000000, 0.6);
        g.lineBetween(13, 9,  18, 12);
        g.lineBetween(35, 9,  30, 12);

        g.fillStyle(0xff66aa);
        g.fillCircle(24, 16, 3);

        g.generateTexture('enemy_cat2', 50, 40);
        g.destroy();
    }

    static _cat3(scene) {
        const g = scene.make.graphics({ add: false });

        g.fillStyle(0x111111);
        g.fillEllipse(16, 26, 22, 26);
        g.fillCircle(16, 10, 10);
        g.fillTriangle(7,  2, 11, 13, 3,  13);
        g.fillTriangle(25, 2, 29, 13, 21, 13);

        g.fillStyle(0x222222);
        g.fillEllipse(16, 26, 14, 18);

        g.fillStyle(0xff2200);
        g.fillCircle(11, 9, 4);
        g.fillCircle(21, 9, 4);

        g.fillStyle(0xffff00);
        g.fillCircle(11, 9, 2);
        g.fillCircle(21, 9, 2);

        g.fillStyle(0xff44aa);
        g.fillCircle(16, 14, 2);

        g.lineStyle(1, 0x444444, 1);
        g.lineBetween(4,  13, 11, 15);
        g.lineBetween(28, 13, 21, 15);

        g.lineStyle(3, 0x111111, 1);
        g.lineBetween(27, 30, 38, 20);
        g.lineBetween(38, 20, 40, 10);

        g.generateTexture('enemy_cat3', 44, 42);
        g.destroy();
    }

    update() {
        if (this.body.velocity.x === 0) this.setVelocityX(this.speed);
        const dir = this.x > this.startX ? -1 : 1;
        if (Math.abs(this.x - this.startX) > this.patrolRange) {
            this.setVelocityX(this.speed * dir);
        }
        this.setFlipX(this.body.velocity.x < 0);

        if (this.isBird) {
            this.setVelocityY(0);
            this.y = this.flyY;
        }
    }
}
