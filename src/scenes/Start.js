import { HUD } from '../ui/HUD.js';
import { Enemy } from '../entities/Enemy.js';
import { generateLevel, WORLD_END } from '../utils/LevelGenerator.js';

export const BACKGROUNDS = [
    'assets/backgrounds/1.png',
    // 'assets/backgrounds/2.png',
    // 'assets/backgrounds/3.png',
    // 'assets/backgrounds/4.png',
    // 'assets/backgrounds/5.png',
    // 'assets/backgrounds/6.png',
    // 'assets/backgrounds/7.png',
    // 'assets/backgrounds/8.png',
    // 'assets/backgrounds/9.png',
    // 'assets/backgrounds/10.png',
    // 'assets/backgrounds/11.png',
    // 'assets/backgrounds/12.png',
    // 'assets/backgrounds/13.png',
    // 'assets/backgrounds/14.png'
];

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    init(data) {
        this.levelIndex = data.level ?? 0;
        this.carryScore = data.score ?? 0;
        this.carryTime = data.time ?? 0;
        this.playerName = data.name ?? JSON.parse(localStorage.getItem('gameSave') || '{}').name ?? 'Jugador';
        this._levelDone = false;
    }

    preload() {
        const bg   = this.add.rectangle(640, 360, 1280, 720, 0x1a0533).setDepth(50).setScrollFactor(0);
        const name = this.add.text(640, 260, this.playerName ?? '', {
            fontSize: '26px', color: '#aaddff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const lvl  = this.add.text(640, 310, `Nivel ${this.levelIndex + 1}`, {
            fontSize: '52px', color: '#ffd700', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const lbl  = this.add.text(640, 390, 'Cargando...', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const track = this.add.rectangle(640, 440, 420, 18, 0x333344).setDepth(50).setScrollFactor(0);
        const bar   = this.add.rectangle(432, 440, 0, 18, 0x7b3fa0).setOrigin(0, 0.5).setDepth(50).setScrollFactor(0);

        this._loadingObjs = [bg, name, lvl, lbl, track, bar];

        this.load.on('progress', v => { bar.width = 420 * v; });

        const bgKey = `bg_${this.levelIndex}`;
        const bgPath = BACKGROUNDS[this.levelIndex % BACKGROUNDS.length];
        if (!this.textures.exists(bgKey)) {
            this.load.image(bgKey, bgPath);
        }

        const frameNums = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 23, 24, 25, 26];
        frameNums.forEach(n => {
            const key = `frame_${String(n).padStart(3, '0')}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, `assets/sprites_white/frames/${key}.png`);
            }
        });

        ['coin', 'jump', 'hurt', 'power_up', 'explosion'].forEach(s => {
            if (!this.cache.audio.exists(s)) {
                this.load.audio(s, `assets/sounds/${s}.wav`);
            }
        });
        if (!this.cache.audio.exists('bgm')) {
            this.load.audio('bgm', 'assets/sounds/time_for_adventure.mp3');
        }

        for (let i = 1; i <= 8; i++) {
            const key = `coin_frame_${String(i).padStart(3, '0')}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, `assets/sprites/coin_sprites/frames/frame_${String(i).padStart(3, '0')}.png`);
            }
        }

        for (let i = 1; i <= 4; i++) {
            const key = `plat_frame_${String(i).padStart(3, '0')}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, `assets/sprites/platform/frames/frame_${String(i).padStart(3, '0')}.png`);
            }
        }

    }

    stripWhite(key) {
        const src = this.textures.get(key).source[0].image;
        const canvas = document.createElement('canvas');
        canvas.width = src.width;
        canvas.height = src.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(src, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const w = canvas.width, h = canvas.height;
        const visited = new Uint8Array(w * h);
        const isWhite = i => d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200;
        const stack = [];
        const seed = (x, y) => {
            const idx = y * w + x;
            if (!visited[idx] && isWhite(idx * 4)) stack.push(idx);
        };
        for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
        for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
        while (stack.length) {
            const idx = stack.pop();
            if (visited[idx]) continue;
            visited[idx] = 1;
            d[idx * 4 + 3] = 0;
            const x = idx % w, y = (idx / w) | 0;
            if (x > 0) seed(x - 1, y);
            if (x < w - 1) seed(x + 1, y);
            if (y > 0) seed(x, y - 1);
            if (y < h - 1) seed(x, y + 1);
        }
        ctx.putImageData(imgData, 0, 0);
        this.textures.remove(key);
        this.textures.addCanvas(key, canvas);
    }

    create() {
        this._loadingObjs?.forEach(o => o.destroy());
        this._loadingObjs = null;

        const bgKey = `bg_${this.levelIndex}`;
        this.background = this.add.tileSprite(640, 360, 1280, 720, bgKey).setScrollFactor(0);

        const frameNums = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 23, 24, 25, 26];
        frameNums.forEach(n => {
            const key = `frame_${String(n).padStart(3, '0')}`;
            const src = this.textures.get(key).source[0].image;
            if (src instanceof HTMLImageElement) this.stripWhite(key);
        });

        const worldWidth = 10000;
        this.physics.world.setBounds(-worldWidth / 2, 0, worldWidth, 720);

        const ground = this.add.rectangle(0, 710, worldWidth, 40, 0x4a3728);
        this.physics.add.existing(ground, true);

        const { platforms, coins, enemies } = generateLevel(this.levelIndex);

        this._buildPlatforms(platforms);

        this.player = this.physics.add.sprite(-4600, 580, 'frame_023');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(60, 80);
        this.player.body.setOffset(this.player.width / 2 - 30, 115);

        this.cameras.main.setBounds(-worldWidth / 2, 0, worldWidth, 720);
        this.cameras.main.startFollow(this.player, true, 1, 1);

        this._buildAnimations();
        if (!this.anims.exists('coin_spin')) {
            const pad = n => String(n).padStart(3, '0');
            this.anims.create({
                key: 'coin_spin',
                frames: Array.from({ length: 8 }, (_, i) => ({ key: `coin_frame_${pad(i + 1)}` })),
                frameRate: 10,
                repeat: -1
            });
        }

        this._buildCoins(coins);

        Enemy.createTextures(this);
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        enemies.forEach(({ x, y, range, type }) => this.enemies.add(new Enemy(this, x, y, { type, range })));

        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, ground);
        this.physics.add.collider(this.enemies, this.platforms);

        this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
            coin.destroy();
            this.hud.addCoin();
            this.sound.play('coin', { volume: 0.6 });
        });

        this._buildFlagpole();

        this.physics.add.overlap(this.player, this.enemies, this._hitEnemy, null, this);

        this.hud = new HUD(this, this.levelIndex);
        this.hud.score = this.carryScore;
        this.hud.elapsed = this.carryTime;
        this.hud.scoreText.setText(`Monedas: ${this.carryScore}`);

        this.invincible = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.mobileInput = { left: false, right: false, up: false };
        this._createMobileButtons();

        this.player.play('idle_blink');

        this.bgMusic = this.sound.add('bgm', { loop: true, volume: 0.5 });
        this.bgMusic.play();
    }

    _buildPlatforms(data) {
        this.platforms = this.physics.add.staticGroup();
        data.forEach(({ x, y, w }) => {
            const variant = Phaser.Math.Between(1, 4);
            const key = `plat_frame_${String(variant).padStart(3, '0')}`;
            const plat = this.add.tileSprite(x, y, w, 16, key);
            this.physics.add.existing(plat, true);
            this.platforms.add(plat);
        });
    }

    _buildCoins(data) {
        this.coins = this.physics.add.staticGroup();
        data.forEach(({ x, y }) => {
            const c = this.coins.create(x, y, 'coin_frame_001');
            c.setScale(3);
            c.refreshBody();
            this.sys.updateList.add(c);
            c.play('coin_spin');
        });
    }

    _buildFlagpole() {
        const x = WORLD_END - 100;
        const poleTop = 480;
        const poleBottom = 710;
        const poleH = poleBottom - poleTop;

        const g = this.add.graphics();

        g.fillStyle(0x888888);
        g.fillRect(x - 6, poleTop, 12, poleH);

        g.fillStyle(0xcccccc);
        g.fillRect(x - 10, poleBottom - 20, 20, 20);

        g.fillStyle(0xff3300);
        g.fillTriangle(x + 6, poleTop, x + 6, poleTop + 60, x + 56, poleTop + 30);

        g.fillStyle(0xffffff, 0.15);
        g.fillTriangle(x + 6, poleTop, x + 6, poleTop + 60, x + 56, poleTop + 30);

        const zone = this.add.zone(x, poleTop + poleH / 2, 40, poleH);
        this.physics.add.existing(zone, true);
        this.physics.add.overlap(this.player, zone, () => {
            if (!this._levelDone) {
                this._levelDone = true;
                this._levelComplete();
            }
        });
    }

    _buildAnimations() {
        if (this.anims.exists('idle')) return;
        const pad = n => String(n).padStart(3, '0');
        this.anims.create({ key: 'idle', frames: [2, 3, 4, 5, 6].map(n => ({ key: `frame_${pad(n)}` })), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'idle_blink', frames: [23, 24, 25, 26].map(n => ({ key: `frame_${pad(n)}` })), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk', frames: [8, 9, 10, 11, 12].map(n => ({ key: `frame_${pad(n)}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'run', frames: [13, 14, 15, 17].map(n => ({ key: `frame_${pad(n)}` })), frameRate: 14, repeat: -1 });
        this.anims.create({ key: 'jump', frames: [19, 20, 21].map(n => ({ key: `frame_${pad(n)}` })), frameRate: 10, repeat: 0 });
    }

    _showOverlay(callback) {
        const cx = this.cameras.main.scrollX;
        const cy = this.cameras.main.scrollY;
        callback(cx, cy);
    }

    _levelComplete() {
        this.physics.pause();
        this._saveScores();
        this.sound.play('power_up', { volume: 0.8 });

        const isLast = this.levelIndex >= BACKGROUNDS.length - 1;

        this._showOverlay((cx, cy) => {
            this.add.rectangle(cx + 640, cy + 360, 1280, 720, 0x000000, 0.55).setDepth(20);

            const title = isLast
                ? `¡Completaste todos los niveles, ${this.playerName}!`
                : `¡Nivel ${this.levelIndex + 1} completado!`;

            this.add.text(cx + 640, cy + 230, title, {
                fontSize: isLast ? '46px' : '58px', color: '#ffd700', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 8
            }).setOrigin(0.5).setDepth(21);

            this.add.text(cx + 640, cy + 320, `Monedas: ${this.hud.score}   Tiempo: ${this.hud.formatTime(this.hud.elapsed)}`, {
                fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(21);

            if (isLast) {
                this._writeSave(0);
                const prizeBtn = this.add.text(cx + 640, cy + 430, '  🎁 ¡Girar la rueda!  ', {
                    fontSize: '40px', color: '#ffffff', fontFamily: 'Arial',
                    stroke: '#3b1278', strokeThickness: 6,
                    backgroundColor: '#3b1278', padding: { x: 30, y: 12 }
                }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
                prizeBtn.on('pointerover', () => prizeBtn.setStyle({ color: '#ffd700' }));
                prizeBtn.on('pointerout', () => prizeBtn.setStyle({ color: '#ffffff' }));
                prizeBtn.on('pointerdown', () => { this.bgMusic.stop(); this.scene.start('Prize'); });
            } else {
                const next = this.add.text(cx + 640, cy + 420, '  Siguiente nivel  ▶  ', {
                    fontSize: '40px', color: '#ffffff', fontFamily: 'Arial',
                    stroke: '#3b1278', strokeThickness: 6,
                    backgroundColor: '#3b1278', padding: { x: 30, y: 12 }
                }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

                const menu = this.add.text(cx + 640, cy + 510, 'Menú principal', {
                    fontSize: '26px', color: '#aaddff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

                next.on('pointerover', () => next.setStyle({ color: '#ffd700' }));
                next.on('pointerout', () => next.setStyle({ color: '#ffffff' }));
                next.on('pointerdown', () => {
                    this._writeSave(this.levelIndex + 1);
                    this.bgMusic.stop();
                    this.scene.start('Start', { level: this.levelIndex + 1, score: this.hud.score, time: this.hud.elapsed, name: this.playerName });
                });

                menu.on('pointerover', () => menu.setStyle({ color: '#ffffff' }));
                menu.on('pointerout', () => menu.setStyle({ color: '#aaddff' }));
                menu.on('pointerdown', () => { this.bgMusic.stop(); this.scene.start('Menu'); });
            }
        });
    }

    _hitEnemy() {
        if (this.invincible) return;
        this.sound.play('hurt', { volume: 0.8 });
        const remaining = this.hud.loseHeart();
        if (remaining <= 0) {
            this._gameOver();
            return;
        }
        this.invincible = true;
        this.tweens.add({
            targets: this.player, alpha: 0, duration: 100, repeat: 8, yoyo: true,
            onComplete: () => { this.player.setAlpha(1); this.invincible = false; }
        });
    }

    _gameOver() {
        this.physics.pause();
        this._saveScores();
        this._writeSave(this.levelIndex);
        this.sound.play('explosion', { volume: 0.7 });

        this._showOverlay((cx, cy) => {
            this.add.rectangle(cx + 640, cy + 360, 1280, 720, 0x000000, 0.6).setDepth(20);

            this.add.text(cx + 640, cy + 230, 'FIN DEL JUEGO', {
                fontSize: '72px', color: '#ff2244', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 8
            }).setOrigin(0.5).setDepth(21);

            this.add.text(cx + 640, cy + 320, `${this.playerName} · Nivel ${this.levelIndex + 1}`, {
                fontSize: '30px', color: '#ffd700', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(21);

            this.add.text(cx + 640, cy + 370, `Monedas: ${this.hud.score}   Tiempo: ${this.hud.formatTime(this.hud.elapsed)}`, {
                fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(21);

            const cont = this.add.text(cx + 640, cy + 450, `  ▶  Continuar — Nivel ${this.levelIndex + 1}  `, {
                fontSize: '38px', color: '#ffffff', fontFamily: 'Arial',
                stroke: '#3b1278', strokeThickness: 6,
                backgroundColor: '#3b1278', padding: { x: 30, y: 12 }
            }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

            const menu = this.add.text(cx + 640, cy + 535, 'Menú principal', {
                fontSize: '26px', color: '#aaddff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

            cont.on('pointerover', () => cont.setStyle({ color: '#ffd700' }));
            cont.on('pointerout', () => cont.setStyle({ color: '#ffffff' }));
            cont.on('pointerdown', () => {
                this.bgMusic.stop();
                this.scene.start('Start', { level: this.levelIndex, score: this.hud.score, time: this.hud.elapsed, name: this.playerName });
            });

            menu.on('pointerover', () => menu.setStyle({ color: '#ffffff' }));
            menu.on('pointerout', () => menu.setStyle({ color: '#aaddff' }));
            menu.on('pointerdown', () => { this.bgMusic.stop(); this.scene.start('Menu'); });
        });
    }

    _saveScores() {
        const prevCoins = Number(localStorage.getItem('bestCoins') ?? 0);
        const prevTime = Number(localStorage.getItem('bestTime') ?? 0);
        if (this.hud.score > prevCoins) localStorage.setItem('bestCoins', this.hud.score);
        if (this.hud.elapsed > prevTime) localStorage.setItem('bestTime', Math.floor(this.hud.elapsed));
    }

    _writeSave(level) {
        localStorage.setItem('gameSave', JSON.stringify({
            name: this.playerName,
            level,
            score: this.hud.score,
            time: this.hud.elapsed,
        }));
    }

    _createMobileButtons() {
        const S = 75;
        const zones = [
            { x: 100, y: 625, key: 'left', label: '←' },
            { x: 265, y: 625, key: 'right', label: '→' },
            { x: 1170, y: 625, key: 'up', label: '↑' },
        ];
        const bgMap = {};

        zones.forEach(({ x, y, label, key }) => {
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 0.15);
            bg.fillRoundedRect(-S, -S, S * 2, S * 2, 24);
            bg.lineStyle(3, 0xffffff, 0.5);
            bg.strokeRoundedRect(-S, -S, S * 2, S * 2, 24);
            const text = this.add.text(0, 0, label, { fontSize: '58px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
            this.add.container(x, y, [bg, text]).setScrollFactor(0).setDepth(10);
            bgMap[key] = bg;
        });

        const hitTest = (px, py) => zones.filter(z => Math.abs(px - z.x) <= S && Math.abs(py - z.y) <= S).map(z => z.key);

        const activePointers = new Map();

        const sync = () => {
            this.mobileInput.left = false;
            this.mobileInput.right = false;
            this.mobileInput.up = false;
            activePointers.forEach(keys => keys.forEach(k => { this.mobileInput[k] = true; }));
            zones.forEach(({ key }) => {
                const bg = bgMap[key];
                bg.clear();
                if (this.mobileInput[key]) {
                    bg.fillStyle(0xffffff, 0.35);
                    bg.fillRoundedRect(-S, -S, S * 2, S * 2, 20);
                } else {
                    bg.fillStyle(0xffffff, 0.15);
                    bg.fillRoundedRect(-S, -S, S * 2, S * 2, 20);
                    bg.lineStyle(3, 0xffffff, 0.5);
                    bg.strokeRoundedRect(-S, -S, S * 2, S * 2, 20);
                }
            });
        };

        this.input.on('pointerdown', pointer => {
            const keys = hitTest(pointer.x, pointer.y);
            if (keys.length) { activePointers.set(pointer.id, keys); sync(); }
        });

        this.input.on('pointermove', pointer => {
            if (!pointer.isDown) return;
            const keys = hitTest(pointer.x, pointer.y);
            if (keys.length) activePointers.set(pointer.id, keys);
            else activePointers.delete(pointer.id);
            sync();
        });

        this.input.on('pointerup', pointer => { activePointers.delete(pointer.id); sync(); });
        this.input.on('pointerupoutside', pointer => { activePointers.delete(pointer.id); sync(); });
    }

    update(_, delta) {
        this.background.tilePositionX = this.cameras.main.scrollX * 0.3;
        this.hud.update(delta);

        const { left, right, up } = this.cursors;
        const isShift = this.shiftKey.isDown;
        const onGround = this.player.body.blocked.down;
        const goLeft = left.isDown || this.mobileInput.left;
        const goRight = right.isDown || this.mobileInput.right;
        const goUp = up.isDown || this.spaceKey.isDown || this.mobileInput.up;

        if (goLeft) {
            this.player.setVelocityX(isShift ? -300 : -160);
            this.player.setFlipX(true);
            if (onGround) this.player.play(isShift ? 'run' : 'walk', true);
        } else if (goRight) {
            this.player.setVelocityX(isShift ? 300 : 160);
            this.player.setFlipX(false);
            if (onGround) this.player.play(isShift ? 'run' : 'walk', true);
        } else {
            this.player.setVelocityX(0);
            if (onGround) this.player.play('idle_blink', true);
        }

        if (goUp && onGround) {
            this.player.setVelocityY(-550);
            this.player.play('jump', true);
            this.sound.play('jump', { volume: 0.7 });
        }

        if (!onGround && this.player.anims.currentAnim?.key !== 'jump') {
            this.player.play('jump', true);
        }
    }
}
