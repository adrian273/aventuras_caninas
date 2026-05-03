export class HUD {
    constructor(scene, levelIndex, initialHp = 5) {
        this.scene = scene;
        this.hp = initialHp;
        this.score = 0;
        this.elapsed = 0;
        this._nextLifeAt = 50;

        this._createHeartTexture();

        const totalSlots = Math.max(initialHp, 5);
        this.hearts = [];
        for (let i = 0; i < totalSlots; i++) {
            const img = scene.add.image(30 + i * 30, 60, 'heart')
                .setScrollFactor(0).setDepth(10).setScale(1.4);
            if (i >= initialHp) img.setAlpha(0.2);
            this.hearts.push(img);
        }

        this.scoreText = scene.add.text(20, 20, 'Monedas: 0', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);

        this.levelText = scene.add.text(1220, 20, `Nivel ${levelIndex + 1}`, {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

        this._createFullscreenTexture();
        this.fullscreenBtn = scene.add.image(1240, 32, 'fs_icon')
            .setScrollFactor(0).setDepth(10).setScale(1.2)
            .setInteractive({ useHandCursor: true });

        this.fullscreenBtn.on('pointerdown', () => {
            if (scene.scale.isFullscreen) {
                scene.scale.stopFullscreen();
            } else {
                scene.scale.startFullscreen();
            }
        });

        this.fullscreenBtn.on('pointerover', () => this.fullscreenBtn.setAlpha(0.75));
        this.fullscreenBtn.on('pointerout', () => this.fullscreenBtn.setAlpha(1));

        this.timerText = scene.add.text(640, 20, '0:00', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    }

    _createFullscreenTexture() {
        const g = this.scene.make.graphics({ add: false });
        g.fillStyle(0x000000, 0);
        g.fillRect(0, 0, 20, 20);
        g.lineStyle(2, 0xffffff, 1);
        g.strokeRect(1, 1, 18, 18);
        const a = 4;
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(1, 1, 1 + a, 1, 1, 1 + a);
        g.fillTriangle(19, 1, 19 - a, 1, 19, 1 + a);
        g.fillTriangle(1, 19, 1 + a, 19, 1, 19 - a);
        g.fillTriangle(19, 19, 19 - a, 19, 19, 19 - a);
        g.generateTexture('fs_icon', 20, 20);
        g.destroy();
    }

    _createHeartTexture() {
        const g = this.scene.make.graphics({ add: false });
        g.fillStyle(0xff2244);
        g.fillCircle(5, 5, 5);
        g.fillCircle(13, 5, 5);
        g.fillTriangle(0, 7, 18, 7, 9, 18);
        g.generateTexture('heart', 18, 18);
        g.destroy();
    }

    addCoin() {
        this.score++;
        this.scoreText.setText(`Monedas: ${this.score}`);
        if (this.score >= this._nextLifeAt) {
            this._nextLifeAt += 50;
            this.addLife();
        }
    }

    addLife() {
        if (this.hp >= this.hearts.length) {
            const img = this.scene.add.image(30 + this.hearts.length * 30, 60, 'heart')
                .setScrollFactor(0).setDepth(10).setScale(1.4);
            this.hearts.push(img);
        } else {
            this.hearts[this.hp].setAlpha(1);
        }
        this.hp++;
    }

    loseHeart() {
        this.hp--;
        if (this.hp >= 0) this.hearts[this.hp].setAlpha(0.2);
        return this.hp;
    }

    update(delta) {
        this.elapsed += delta;
        const secs = Math.floor(this.elapsed / 1000);
        const mins = Math.floor(secs / 60);
        this.timerText.setText(`${mins}:${String(secs % 60).padStart(2, '0')}`);
    }

    formatTime(ms) {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        return `${mins}:${String(secs % 60).padStart(2, '0')}`;
    }
}
