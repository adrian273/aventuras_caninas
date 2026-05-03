import { HUD } from '../ui/HUD.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Mushroom } from '../entities/Mushroom.js';
import { generateLevel, WORLD_END } from '../utils/LevelGenerator.js';

export const BACKGROUNDS = [
    'assets/backgrounds/1.png',
    'assets/backgrounds/2.png',
    'assets/backgrounds/3.png',
    'assets/backgrounds/4.png',
    'assets/backgrounds/5.png',
    'assets/backgrounds/6.png',
    'assets/backgrounds/7.png',
    'assets/backgrounds/8.png',
    'assets/backgrounds/9.png',
    'assets/backgrounds/10.png',
    'assets/backgrounds/11.png',
    'assets/backgrounds/12.png',
    'assets/backgrounds/13.png',
    'assets/backgrounds/14.png'
];

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    init(data) {
        this.levelIndex = data.level ?? 0;
        this.carryScore = data.score ?? 0;
        this.carryTime = data.time ?? 0;
        this.carryHp = data.hp ?? 5;
        this.carryAmmo = data.ammo ?? 0;
        const save = JSON.parse(localStorage.getItem('gameSave') || '{}');
        this.playerName = data.name ?? save.name ?? 'Jugador';
        this._levelDone = false;
    }

    preload() {
        const bg = this.add.rectangle(640, 360, 1280, 720, 0x1a0533).setDepth(50).setScrollFactor(0);
        const name = this.add.text(640, 260, this.playerName ?? '', {
            fontSize: '26px', color: '#aaddff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const lvl = this.add.text(640, 310, `Nivel ${this.levelIndex + 1}`, {
            fontSize: '52px', color: '#ffd700', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const lbl = this.add.text(640, 390, 'Cargando...', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        const track = this.add.rectangle(640, 440, 420, 18, 0x333344).setDepth(50).setScrollFactor(0);
        const bar = this.add.rectangle(432, 440, 0, 18, 0x7b3fa0).setOrigin(0, 0.5).setDepth(50).setScrollFactor(0);

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

        Mushroom.preload(this);
        Boss.preload(this);

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
        this._createFireballTexture();

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
        Boss.stripWhiteFrames(this);

        const worldWidth = 10000;
        this.physics.world.setBounds(-worldWidth / 2, 0, worldWidth, 720);

        const ground = this._buildGround();

        const { platforms, coins, enemies } = generateLevel(this.levelIndex);

        this._buildPlatforms(platforms);
        this._buildHazardPlatforms();

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

        Boss.createProjectileTextures(this);
        Boss.createAnims(this);
        const bossType = Boss.getBossTypeForLevel(this.levelIndex);
        this.boss = new Boss(this, WORLD_END - 650, 500, bossType, this.levelIndex);
        this.boss.play(`boss_${bossType}_attack`);

        Mushroom.createAnims(this);
        this.mushrooms = this.physics.add.group();
        const mushCount = 3 + this.levelIndex;
        for (let i = 0; i < mushCount; i++) {
            const mx = Phaser.Math.Between(-4200, 4400);
            const m = new Mushroom(this, mx, 400);
            this.mushrooms.add(m);
            m.play('mush_idle');
        }

        this.physics.add.collider(this.player, ground);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, ground);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.mushrooms, ground);
        this.physics.add.collider(this.mushrooms, this.platforms);
        this.physics.add.collider(this.boss, ground);

        this.physics.add.overlap(this.enemies, this.hazardGroup, (enemy) => {
            if (enemy.active) enemy.destroy();
        });
        this.physics.add.overlap(this.mushrooms, this.hazardGroup, (mush) => {
            if (mush.active) mush.destroy();
        });
        this.physics.add.overlap(this.player, this.lavaGroup, () => this._hitEnemy());

        this.fireballs = this.physics.add.group();
        this.physics.add.collider(this.fireballs, ground, (fb) => fb.destroy());
        this.physics.add.collider(this.fireballs, this.platforms, (fb) => fb.destroy());

        this.physics.add.overlap(this.fireballs, this.enemies, (fb, enemy) => {
            fb.destroy();
            if (enemy.active) {
                enemy.destroy();
                this.sound.play('explosion', { volume: 0.5 });
            }
        });

        this.physics.add.overlap(this.fireballs, this.mushrooms, (fb, mush) => {
            fb.destroy();
            if (mush.active) {
                mush.destroy();
                this.sound.play('explosion', { volume: 0.5 });
            }
        });

        this.physics.add.overlap(this.boss, this.fireballs, (boss, fb) => {
            fb.destroy();
            if (boss.active) {
                const dead = boss.takeHit();
                this.sound.play('explosion', { volume: 0.5 });
                if (dead) this._killBoss(boss);
            }
        });

        this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
            coin.destroy();
            this.hud.addCoin();
            this.sound.play('coin', { volume: 0.6 });
        });

        this._buildFlagpole();
        this._buildBarrier();

        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            const stomped = player.body.velocity.y > 0 && player.body.bottom <= enemy.body.top + 16;
            if (stomped) {
                enemy.destroy();
                player.setVelocityY(-350);
                this.sound.play('jump', { volume: 0.5 });
            } else {
                this._hitEnemy();
            }
        }, null, this);
        this.physics.add.collider(this.player, this.boss, this._hitBoss, null, this);
        this.physics.add.overlap(this.player, this.boss.stars, this._hitByStar, null, this);
        this.physics.add.overlap(this.player, this.boss.comets, this._hitByComet, null, this);
        this.physics.add.overlap(this.player, this.mushrooms, (player, mush) => {
            const stomped = player.body.velocity.y > 0 &&
                player.body.bottom <= mush.body.top + 16;
            if (stomped) {
                mush.destroy();
                player.setVelocityY(-350);
            } else {
                this._hitEnemy();
            }
        }, null, this);

        this.fireballPickups = this.physics.add.group();
        const pickupCount = Phaser.Math.Between(3, 5);
        for (let i = 0; i < pickupCount; i++) {
            const px = Phaser.Math.Between(-4000, WORLD_END - 1000);
            const pickup = this.add.text(px, 300, '🔥', { fontSize: '48px' });
            this.physics.add.existing(pickup);
            pickup.body.setBounce(0.5);
            pickup.body.setCollideWorldBounds(true);
            this.fireballPickups.add(pickup);
        }
        this.physics.add.collider(this.fireballPickups, ground);
        this.physics.add.collider(this.fireballPickups, this.platforms);
        this.physics.add.overlap(this.player, this.fireballPickups, (player, pickup) => {
            pickup.destroy();
            this.hud.addAmmo(10);
            this.sound.play('power_up', { volume: 0.6 });

            const burst = this.add.particles(pickup.x, pickup.y, 'fx_particle', {
                speed: { min: 50, max: 150 },
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 600,
                tint: [0xffaa00, 0xff5500, 0xffff00],
                emitting: false,
                blendMode: 'ADD',
            });
            burst.explode(15, pickup.x, pickup.y);
            this.time.delayedCall(700, () => burst.destroy());

            const playerAura = this.add.particles(0, 0, 'fx_particle', {
                speed: { min: 20, max: 100 },
                scale: { start: 1.5, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 800,
                tint: [0xffaa00, 0xff2200, 0xffff00],
                blendMode: 'ADD',
                frequency: 20,
                emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 40) }
            });
            playerAura.startFollow(player);
            this.time.delayedCall(1500, () => {
                playerAura.stop();
                this.time.delayedCall(1000, () => playerAura.destroy());
            });
        });

        this.hud = new HUD(this, this.levelIndex, this.carryHp, this.carryAmmo);
        this.hud.score = this.carryScore;
        this.hud.elapsed = this.carryTime;
        this.hud._nextLifeAt = (Math.floor(this.carryScore / 50) + 1) * 50;
        this.hud.scoreText.setText(`Monedas: ${this.carryScore}`);

        this.invincible = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.lastFired = 0;

        this.mobileInput = { left: false, right: false, up: false, fire: false };
        this._createMobileButtons();

        this.player.play('idle_blink');

        this.bgMusic = this.sound.add('bgm', { loop: true, volume: 0.5 });
        this.bgMusic.play();
    }

    _generateTerrainSegments() {
        const level = this.levelIndex;
        const lastLevel = BACKGROUNDS.length - 1;
        const lavaLevel = level % 3 === 0 || level === lastLevel;
        const NO_LAVA = ['grass', 'dirt', 'water'];
        const ALL = ['grass', 'dirt', 'water', 'lava'];
        const BOSS_X = WORLD_END - 650;

        const segments = [];
        let x = -5000;

        const firstW = Phaser.Math.Between(900, 1500);
        segments.push({ x1: x, x2: x + firstW, type: Phaser.Math.RND.pick(['grass', 'dirt']) });
        x += firstW;

        while (x < 5000) {
            let w, type;
            if (lavaLevel) {
                w = Phaser.Math.Between(500, 1800);
                type = Phaser.Math.RND.pick(ALL);
            } else if (Math.random() < 0.15) {
                w = Phaser.Math.Between(180, 340);
                type = 'lava';
            } else {
                w = Phaser.Math.Between(500, 1800);
                type = Phaser.Math.RND.pick(NO_LAVA);
            }
            const end = Math.min(x + w, 5050);
            segments.push({ x1: x, x2: end, type });
            x = end;
        }

        segments.forEach(s => {
            if (s.type === 'lava' && s.x1 <= BOSS_X && s.x2 >= BOSS_X) s.type = 'dirt';
        });

        return segments.map(s => ({ x: (s.x1 + s.x2) / 2, w: s.x2 - s.x1, type: s.type }));
    }

    _buildGround() {
        const COLORS = {
            grass: { base: 0x3a7d1e, top: 0x5cb82e },
            dirt: { base: 0x7a4a1e, top: 0x9b6235 },
            water: { base: 0x1a5ea8, top: 0x3a8fd4 },
            lava: { base: 0xcc2200, top: 0xff6600 },
        };
        const HAZARD = new Set(['water', 'lava']);

        const segments = this._generateTerrainSegments();
        this.terrainSegments = segments;
        const group = this.physics.add.staticGroup();
        this.hazardGroup = this.physics.add.staticGroup();
        this.lavaGroup = this.physics.add.staticGroup();

        if (!this.textures.exists('fx_particle')) {
            const g = this.make.graphics({ add: false });
            g.fillStyle(0xffffff);
            g.fillCircle(8, 8, 8);
            g.generateTexture('fx_particle', 16, 16);
            g.destroy();
        }

        segments.forEach(({ x, w, type }) => {
            const { base, top } = COLORS[type];
            const rect = this.add.rectangle(x, 714, w, 48, base);
            this.physics.add.existing(rect, true);
            group.add(rect);
            this.add.rectangle(x, 691, w, 6, top);

            if (HAZARD.has(type)) {
                const zone = this.add.rectangle(x, 700, w, 30);
                this.physics.add.existing(zone, true);
                this.hazardGroup.add(zone);
            }
            if (type === 'lava') {
                const lzone = this.add.rectangle(x, 700, w, 30);
                this.physics.add.existing(lzone, true);
                this.lavaGroup.add(lzone);
            }

            this._buildTerrainEffect(type, x, w);
        });

        return group;
    }

    _buildTerrainEffect(type, cx, w) {
        const surface = new Phaser.Geom.Rectangle(cx - w / 2, 691, w, 1);

        if (type === 'lava') {
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -180, max: -80 }, speedX: { min: -18, max: 18 },
                scale: { start: 0.55, end: 0 }, alpha: { start: 0.85, end: 0 },
                lifespan: { min: 500, max: 950 },
                tint: [0xff2200, 0xff5500, 0xff8800, 0xffbb00],
                frequency: 30, quantity: 2, blendMode: 'ADD', depth: 0,
            });
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -280, max: -140 }, speedX: { min: -10, max: 10 },
                scale: { start: 0.3, end: 0 }, alpha: { start: 1, end: 0 },
                lifespan: { min: 350, max: 650 },
                tint: [0xffffff, 0xffee88, 0xffcc00],
                frequency: 50, quantity: 1, blendMode: 'ADD', depth: 0,
            });
        } else if (type === 'grass') {
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -55, max: -18 }, speedX: { min: -14, max: 14 },
                scale: { start: 0.18, end: 0 }, alpha: { start: 0.55, end: 0 },
                lifespan: { min: 900, max: 1700 },
                tint: [0x88ff44, 0xaaffaa, 0x55cc22, 0xccff88],
                frequency: 95, quantity: 1, depth: 0,
            });
        } else if (type === 'water') {
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -75, max: -28 }, speedX: { min: -6, max: 6 },
                scale: { start: 0.16, end: 0 }, alpha: { start: 0.75, end: 0 },
                lifespan: { min: 700, max: 1200 },
                tint: [0x44aaff, 0x88ddff, 0xaaeeff, 0xffffff],
                frequency: 75, quantity: 1, blendMode: 'ADD', depth: 0,
            });
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -30, max: -10 }, speedX: { min: -25, max: 25 },
                scale: { start: 0.1, end: 0 }, alpha: { start: 0.5, end: 0 },
                lifespan: { min: 300, max: 600 },
                tint: [0xffffff, 0xcceeff],
                frequency: 110, quantity: 1, blendMode: 'ADD', depth: 0,
            });
        } else if (type === 'dirt') {
            this.add.particles(0, 0, 'fx_particle', {
                emitZone: { type: 'random', source: surface },
                speedY: { min: -22, max: -6 }, speedX: { min: -18, max: 18 },
                scale: { start: 0.14, end: 0 }, alpha: { start: 0.4, end: 0 },
                lifespan: { min: 600, max: 1100 },
                tint: [0xc8a05a, 0xe0c080, 0xaa7040],
                frequency: 130, quantity: 1, depth: 0,
            });
        }
    }

    _buildHazardPlatforms() {
        const HAZARD_TYPES = new Set(['water', 'lava']);
        const BOSS_CLEAR = WORLD_END - 1000;
        this.terrainSegments
            .filter(s => HAZARD_TYPES.has(s.type) && s.x < BOSS_CLEAR)
            .forEach(({ x, w }) => {
                const left = x - w / 2;
                const count = w < 900 ? 2 : 3;
                const step = w / (count + 1);
                for (let i = 1; i <= count; i++) {
                    const px = left + step * i + Phaser.Math.Between(-50, 50);
                    const pw = Phaser.Math.Between(90, 150);
                    const py = Phaser.Math.Between(510, 580);
                    this._addPlatform(px, py, pw);
                }
            });
    }

    _addPlatform(x, y, w) {
        const key = `plat_frame_${String(Phaser.Math.Between(1, 4)).padStart(3, '0')}`;
        const plat = this.add.tileSprite(x, y, w, 16, key);
        this.physics.add.existing(plat, true);
        this.platforms.add(plat);
    }

    _buildPlatforms(data) {
        const BOSS_CLEAR = WORLD_END - 1000;
        this.platforms = this.physics.add.staticGroup();
        data.filter(({ x }) => x < BOSS_CLEAR).forEach(({ x, y, w }) => {
            const key = `plat_frame_${String(Phaser.Math.Between(1, 4)).padStart(3, '0')}`;
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

    _buildBarrier() {
        const bx = WORLD_END - 280;
        const top = -50;
        const height = 820;

        const wall = this.add.rectangle(bx, top + height / 2, 24, height);
        this.physics.add.existing(wall, true);
        this.barrierWall = wall;
        this.physics.add.collider(this.player, wall);

        const zone = new Phaser.Geom.Rectangle(bx - 18, top, 36, height);

        this.barrierEmitter = this.add.particles(0, 0, 'fx_particle', {
            emitZone: { type: 'random', source: zone },
            speedX: { min: -22, max: 22 },
            speedY: { min: -10, max: 10 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 400, max: 750 },
            tint: [0xaa00ff, 0xdd44ff, 0xff88ff, 0x7700cc, 0xffffff],
            frequency: 8,
            quantity: 3,
            blendMode: 'ADD',
            depth: 3,
        });

        this.barrierGlow = this.add.particles(0, 0, 'fx_particle', {
            emitZone: { type: 'random', source: zone },
            speedX: 0, speedY: 0,
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.25, end: 0 },
            lifespan: { min: 200, max: 450 },
            tint: [0xcc44ff],
            frequency: 18,
            quantity: 2,
            blendMode: 'ADD',
            depth: 2,
        });

        this.tweens.add({
            targets: [this.barrierEmitter, this.barrierGlow],
            alpha: { from: 0.7, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1,
        });
    }

    _buildFlagpole() {
        const x = WORLD_END - 100;
        const poleTop = 160;
        const poleBottom = 710;
        const poleH = poleBottom - poleTop;

        const g = this.add.graphics();

        g.fillStyle(0xaaaaaa);
        g.fillRect(x - 8, poleTop, 16, poleH);

        g.fillStyle(0xdddddd);
        g.fillRect(x - 14, poleBottom - 28, 28, 28);

        g.fillStyle(0xffdd00);
        g.fillCircle(x, poleTop, 14);

        g.fillStyle(0xff3300);
        g.fillTriangle(x + 8, poleTop + 10, x + 8, poleTop + 100, x + 88, poleTop + 55);

        g.fillStyle(0xffffff, 0.18);
        g.fillTriangle(x + 8, poleTop + 10, x + 8, poleTop + 100, x + 88, poleTop + 55);

        const zone = this.add.zone(x, poleTop + poleH / 2, 50, poleH);
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
                    this.scene.start('Start', { level: this.levelIndex + 1, score: this.hud.score, time: this.hud.elapsed, name: this.playerName, hp: this.hud.hp, ammo: this.hud.ammo });
                });

                menu.on('pointerover', () => menu.setStyle({ color: '#ffffff' }));
                menu.on('pointerout', () => menu.setStyle({ color: '#aaddff' }));
                menu.on('pointerdown', () => { this.bgMusic.stop(); this.scene.start('Menu'); });
            }
        });
    }

    _hitBoss(player, boss) {
        if (boss._stompCooldown) return;
        const stomped = player.body.blocked.down && player.body.center.y < boss.body.center.y;
        if (stomped) {
            boss._stompCooldown = true;
            this.time.delayedCall(350, () => { if (boss.active) boss._stompCooldown = false; });
            player.setVelocityY(-420);
            this.sound.play('jump', { volume: 0.6 });
            const dead = boss.takeHit();
            if (dead) this._killBoss(boss);
        } else {
            this._hitEnemy();
        }
    }

    _killBoss(boss) {
        this.boss = null;
        boss.stars.getChildren().slice().forEach(s => {
            if (s._emitter && !s._emitter.destroyed) s._emitter.destroy();
            if (s.active) s.destroy();
        });
        const bx = boss.x, by = boss.body.top + 40;
        boss.destroy();
        this.sound.play('explosion', { volume: 0.6 });
        const burst = this.add.particles(bx, by, 'green_star', {
            speed: { min: 120, max: 320 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 900,
            emitting: false,
            depth: 5,
        });
        burst.explode(22, bx, by);
        this.time.delayedCall(1100, () => burst.destroy());

        if (this.barrierWall) {
            this.barrierWall.destroy();
            this.barrierWall = null;
        }
        [this.barrierEmitter, this.barrierGlow].forEach(e => {
            if (!e) return;
            this.tweens.killTweensOf(e);
            e.stop();
            this.tweens.add({
                targets: e, alpha: 0, duration: 400,
                onComplete: () => e.destroy(),
            });
        });
        this.barrierEmitter = null;
        this.barrierGlow = null;
    }

    _hitByStar(_player, star) {
        const emitter = star._emitter;
        star.destroy();
        if (emitter && !emitter.destroyed) emitter.destroy();

        const burst = this.add.particles(this.player.x, this.player.y, 'green_star', {
            speed: { min: 90, max: 200 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            emitting: false,
        });
        burst.explode(10, this.player.x, this.player.y);
        this.time.delayedCall(700, () => burst.destroy());

        this._hitEnemy();
    }

    _hitByComet(_player, comet) {
        const trail = comet._trail;
        comet.destroy();
        if (trail && !trail.destroyed) trail.destroy();

        const burst = this.add.particles(this.player.x, this.player.y, 'comet', {
            speed: { min: 120, max: 280 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            emitting: false,
            blendMode: 'ADD',
        });
        burst.explode(14, this.player.x, this.player.y);
        this.time.delayedCall(800, () => burst.destroy());

        if (this.invincible) return;
        this.sound.play('hurt', { volume: 0.9 });
        let remaining = this.hud.loseHeart();
        if (remaining > 0) remaining = this.hud.loseHeart();
        if (remaining <= 0) { this._gameOver(); return; }
        this.invincible = true;
        this.tweens.add({
            targets: this.player, alpha: 0, duration: 100, repeat: 8, yoyo: true,
            onComplete: () => { this.player.setAlpha(1); this.invincible = false; },
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
                this.scene.start('Start', { level: this.levelIndex, score: this.hud.score, time: this.hud.elapsed, name: this.playerName, hp: 5, ammo: 0 });
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
            ammo: this.hud.ammo,
        }));
    }

    _createMobileButtons() {
        const S = 75;
        const zones = [
            { x: 100, y: 625, key: 'left', label: '←' },
            { x: 265, y: 625, key: 'right', label: '→' },
            { x: 1000, y: 625, key: 'fire', label: '🔥' },
            { x: 1170, y: 625, key: 'up', label: '↑' },
        ];
        const bgMap = {};

        zones.forEach(({ x, y, label, key }) => {
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 0.15);
            bg.fillRoundedRect(-S, -S, S * 2, S * 2, 24);
            bg.lineStyle(3, 0xffffff, 0.5);
            bg.strokeRoundedRect(-S, -S, S * 2, S * 2, 24);

            const content = this.add.text(0, 0, label, { fontSize: '58px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
            const container = this.add.container(x, y, [bg, content]).setScrollFactor(0).setDepth(10);
            bgMap[key] = bg;
            if (key === 'fire') this.fireBtnContainer = container;
        });

        const hitTest = (px, py) => zones.filter(z => Math.abs(px - z.x) <= S && Math.abs(py - z.y) <= S).map(z => z.key);

        const activePointers = new Map();

        const sync = () => {
            this.mobileInput.left = false;
            this.mobileInput.right = false;
            this.mobileInput.up = false;
            this.mobileInput.fire = false;
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

    update(time, delta) {
        if (this.hud && this.hud.isPaused) return;

        this.background.tilePositionX = this.cameras.main.scrollX * 0.3;
        this.hud.update(delta);
        this.mushrooms?.getChildren().forEach(m => m.update(this.player.x));
        this.boss?.update(this.player.x, this.player.y);

        if (this.fireBtnContainer && this.hud) {
            this.fireBtnContainer.setVisible(this.hud.ammo > 0);
        }

        const { left, right, up } = this.cursors;
        const isShift = this.shiftKey.isDown;
        const onGround = this.player.body.blocked.down;
        const goLeft = left.isDown || this.mobileInput.left;
        const goRight = right.isDown || this.mobileInput.right;
        const goUp = up.isDown || this.spaceKey.isDown || this.mobileInput.up;
        const fireDown = this.xKey.isDown || this.mobileInput.fire;

        if (fireDown && time > this.lastFired + 300) {
            if (this.hud.useAmmo()) {
                this.lastFired = time;
                this._shootFireball();
            }
        }

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

    _createFireballTexture() {
        if (this.textures.exists('fireball')) return;
        const g = this.make.graphics({ add: false });
        g.fillStyle(0xff2200, 0.3);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xff6600, 0.6);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0xffaa00, 0.9);
        g.fillCircle(16, 16, 8);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(16, 16, 4);
        g.generateTexture('fireball', 32, 32);
        g.destroy();
    }

    _shootFireball() {
        if (!this.player || !this.player.active) return;

        const fb = this.fireballs.create(this.player.x, this.player.y + 10, 'fireball');
        if (!fb) return;

        fb.setDepth(2);
        fb.body.setAllowGravity(false);

        const dir = this.player.flipX ? -1 : 1;
        fb.setVelocityX(dir * 550);

        this.tweens.add({ targets: fb, angle: 360, duration: 400, repeat: -1 });

        const emitter = this.add.particles(fb.x, fb.y, 'fx_particle', {
            scale: { start: 1.8, end: 0 },
            alpha: { start: 1, end: 0 },
            speedX: { min: -30, max: 30 },
            speedY: { min: -40, max: 10 },
            lifespan: { min: 250, max: 450 },
            tint: [0xffff00, 0xff8800, 0xff2200, 0xaa0000],
            frequency: 12,
            quantity: 3,
            blendMode: 'ADD',
            depth: 2,
        });
        emitter.startFollow(fb);

        this.time.delayedCall(1200, () => {
            if (emitter && !emitter.destroyed) emitter.destroy();
            if (fb.active) fb.destroy();
        });

        // Also destroy emitter when fireball is destroyed manually on hit
        fb.on('destroy', () => {
            if (emitter && !emitter.destroyed) {
                emitter.stop();
                this.time.delayedCall(500, () => {
                    if (!emitter.destroyed) emitter.destroy();
                });
            }
        });

        const playerAura = this.add.particles(0, 0, 'fx_particle', {
            speed: { min: 20, max: 100 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 600,
            tint: [0xffaa00, 0xff2200, 0xffff00],
            blendMode: 'ADD',
            frequency: 15,
            emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 40) }
        });
        playerAura.startFollow(this.player);
        this.time.delayedCall(300, () => {
            playerAura.stop();
            this.time.delayedCall(1000, () => playerAura.destroy());
        });
    }
}
