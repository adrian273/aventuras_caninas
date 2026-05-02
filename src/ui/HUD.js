export class HUD {
    constructor(scene, levelIndex) {
        this.scene = scene;
        this.hp = 3;
        this.score = 0;
        this.elapsed = 0;

        this._createHeartTexture();

        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            this.hearts.push(
                scene.add.image(30 + i * 30, 60, 'heart')
                    .setScrollFactor(0).setDepth(10).setScale(1.4)
            );
        }

        this.scoreText = scene.add.text(20, 20, 'Monedas: 0', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);

        this.levelText = scene.add.text(1260, 20, `Nivel ${levelIndex + 1}`, {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

        this.timerText = scene.add.text(640, 20, '0:00', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
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
