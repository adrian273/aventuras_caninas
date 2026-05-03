export class HUD {
    constructor(scene, levelIndex, initialHp = 5, initialAmmo = 0) {
        this.scene = scene;
        this.hp = initialHp;
        this.ammo = initialAmmo;
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

        this.ammoIcon = scene.add.text(230, 16, '🔥', { fontSize: '30px' })
            .setScrollFactor(0).setDepth(10);
        
        this.ammoText = scene.add.text(260, 20, `x${this.ammo}`, {
            fontSize: '24px', color: '#ffaa00', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);

        this.levelText = scene.add.text(1130, 26, `Nivel ${levelIndex + 1}`, {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

        this.isPaused = false;
        
        this.menuBtn = scene.add.text(1260, 20, 'MENÚ', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4,
            backgroundColor: '#3b1278', padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

        this.menuBtn.on('pointerdown', () => this._showMenu());
        this.menuBtn.on('pointerover', () => this.menuBtn.setStyle({ color: '#ffd700' }));
        this.menuBtn.on('pointerout', () => this.menuBtn.setStyle({ color: '#ffffff' }));

        this.timerText = scene.add.text(640, 20, '0:00', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    }

    _showMenu() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.scene.physics.pause();
        
        if (this.scene.player) this.scene.player.anims.pause();
        if (this.scene.boss) this.scene.boss.anims.pause();

        const cx = 640;
        const cy = 360;

        const bg = this.scene.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(100);

        const title = this.scene.add.text(cx, cy - 140, 'PAUSA', {
            fontSize: '64px', color: '#ffd700', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        const fsText = this.scene.scale.isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa';
        const fsBtn = this.scene.add.text(cx, cy - 10, fsText, {
            fontSize: '36px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

        const resumeBtn = this.scene.add.text(cx, cy + 100, 'Reanudar Juego', {
            fontSize: '36px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

        const elements = [bg, title, fsBtn, resumeBtn];

        fsBtn.on('pointerover', () => fsBtn.setStyle({ color: '#ffd700' }));
        fsBtn.on('pointerout', () => fsBtn.setStyle({ color: '#ffffff' }));
        fsBtn.on('pointerdown', () => {
            if (this.scene.scale.isFullscreen) {
                this.scene.scale.stopFullscreen();
                fsBtn.setText('Pantalla Completa');
            } else {
                this.scene.scale.startFullscreen();
                fsBtn.setText('Salir de Pantalla Completa');
            }
        });

        resumeBtn.on('pointerover', () => resumeBtn.setStyle({ color: '#ffd700' }));
        resumeBtn.on('pointerout', () => resumeBtn.setStyle({ color: '#ffffff' }));
        resumeBtn.on('pointerdown', () => {
            elements.forEach(e => e.destroy());
            this.isPaused = false;
            this.scene.physics.resume();
            if (this.scene.player) this.scene.player.anims.resume();
            if (this.scene.boss) this.scene.boss.anims.resume();
        });
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

    useAmmo() {
        if (this.ammo > 0) {
            this.ammo--;
            this.ammoText.setText(`x${this.ammo}`);
            return true;
        }
        return false;
    }

    addAmmo(amount) {
        this.ammo += amount;
        this.ammoText.setText(`x${this.ammo}`);
    }

    update(delta) {
        if (this.isPaused) return;
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
