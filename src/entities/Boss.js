const BOSS_VARIANTS = [
    { tint: null, starTints: [0x00ff44, 0x44ffaa, 0x00ee77], cometTints: [0xff4400, 0xff8800, 0xffcc00], speedMult: 1.0, healthBonus: 3 },
    { tint: 0xbb99ff, starTints: [0xcc44ff, 0xff88ff, 0xaa00ff], cometTints: [0x8800ff, 0xcc44ff, 0xff88ff], speedMult: 1.15, healthBonus: 4 },
    { tint: 0xff8888, starTints: [0xff2200, 0xff6644, 0xff9966], cometTints: [0xdd0000, 0xff4400, 0xff8800], speedMult: 1.2, healthBonus: 4 },
    { tint: 0x77ddff, starTints: [0x0088ff, 0x44bbff, 0x88ddff], cometTints: [0x0044cc, 0x0088ff, 0x44ccff], speedMult: 1.25, healthBonus: 5 },
    { tint: 0xffcc55, starTints: [0xffaa00, 0xffdd44, 0xffffff], cometTints: [0xff6600, 0xffaa00, 0xffee44], speedMult: 1.3, healthBonus: 5 },
    { tint: 0xff99cc, starTints: [0xff2288, 0xff66aa, 0xffaadd], cometTints: [0xcc0066, 0xff2288, 0xff88bb], speedMult: 1.35, healthBonus: 5 },
    { tint: 0x99ffcc, starTints: [0x00cc88, 0x44ffcc, 0xaaffee], cometTints: [0x00aa66, 0x00ffaa, 0x88ffdd], speedMult: 1.4, healthBonus: 6 },
    { tint: 0xffaa66, starTints: [0xff6600, 0xffaa44, 0xffdd88], cometTints: [0xff4400, 0xff8800, 0xffcc44], speedMult: 1.45, healthBonus: 6 },
    { tint: 0xaaaaff, starTints: [0x4444ff, 0x8888ff, 0xccccff], cometTints: [0x2200cc, 0x5544ff, 0xaaaaff], speedMult: 1.5, healthBonus: 6 },
    { tint: 0xffdd44, starTints: [0xffcc00, 0xffffff, 0xffee88], cometTints: [0xff8800, 0xffcc00, 0xffffff], speedMult: 1.55, healthBonus: 7 },
    { tint: 0xcc66ff, starTints: [0xaa00ff, 0xdd44ff, 0xff99ff], cometTints: [0x7700cc, 0xbb00ff, 0xee88ff], speedMult: 1.6, healthBonus: 7 },
    { tint: 0x66ffaa, starTints: [0x00ee66, 0x44ffaa, 0xccffee], cometTints: [0x00bb44, 0x44ff88, 0x99ffcc], speedMult: 1.65, healthBonus: 7 },
    { tint: 0xff6655, starTints: [0xff2200, 0xff8844, 0xffcc88], cometTints: [0xcc1100, 0xff4422, 0xff9966], speedMult: 1.75, healthBonus: 8 },
    { tint: 0xffffff, starTints: [0xffffff, 0xffeeaa, 0xffffcc], cometTints: [0xffcc00, 0xffffff, 0xffaa44], speedMult: 2.0, healthBonus: 9 },
];

const BOSS_TYPES = {
    greenhat: {
        frames: 32,
        frameDir: 'assets/sprites/cat_greenhat/frames',
        frameRate: 14,
        speed: 45,
        scale: 1,
        range: 300,
        shootFrame: 'boss_greenhat_024',
        minLevel: 0,
        health: 3,
        bodyW: 95,
        bodyH: 130,
        bodyOffX: 44,
        bodyOffY: 45,
    },
};

function getBossTypeForLevel(level) {
    const candidates = Object.entries(BOSS_TYPES)
        .filter(([, cfg]) => level >= cfg.minLevel)
        .sort((a, b) => b[1].minLevel - a[1].minLevel);
    return candidates.length ? candidates[0][0] : 'greenhat';
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, level = 0) {
        const cfg = BOSS_TYPES[type];
        super(scene, x, y, `boss_${type}_001`);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setScale(cfg.scale);
        this.setDepth(1);
        this.body.setSize(cfg.bodyW, cfg.bodyH);
        this.body.setOffset(cfg.bodyOffX, cfg.bodyOffY);

        const variant = BOSS_VARIANTS[level % BOSS_VARIANTS.length];
        if (variant.tint !== null) this.setTint(variant.tint);
        this.variant = variant;

        this.bossType = type;
        this.cfg = cfg;
        this.health = cfg.health + variant.healthBonus;
        this.startX = x;
        this.patrolRange = cfg.range;
        this.speed = cfg.speed * variant.speedMult;
        this._playerX = x;
        this._playerY = y;
        this.stars = scene.physics.add.group();
        this.comets = scene.physics.add.group();

        this.on('animationupdate', (_anim, frame) => {
            if (frame.textureKey === cfg.shootFrame) {
                this._shoot(this._playerX, this._playerY);
            }
        });

        scene.time.addEvent({
            delay: 5500,
            loop: true,
            callback: () => { if (this.active) this._shootComet(this._playerX, this._playerY); },
        });
    }

    static getBossTypeForLevel(level) {
        return getBossTypeForLevel(level);
    }

    static preload(scene) {
        Object.entries(BOSS_TYPES).forEach(([type, cfg]) => {
            for (let i = 1; i <= cfg.frames; i++) {
                const key = `boss_${type}_${String(i).padStart(3, '0')}`;
                if (!scene.textures.exists(key)) {
                    scene.load.image(key, `${cfg.frameDir}/frame_${String(i).padStart(3, '0')}.png`);
                }
            }
        });
    }

    static stripWhiteFrames(scene) {
        Object.entries(BOSS_TYPES).forEach(([type, cfg]) => {
            for (let i = 1; i <= cfg.frames; i++) {
                const key = `boss_${type}_${String(i).padStart(3, '0')}`;
                const src = scene.textures.get(key)?.source[0]?.image;
                if (src instanceof HTMLImageElement) scene.stripWhite(key);
            }
        });
    }

    static createAnims(scene) {
        Object.entries(BOSS_TYPES).forEach(([type, cfg]) => {
            const animKey = `boss_${type}_attack`;
            if (scene.anims.exists(animKey)) return;
            const pad = n => String(n).padStart(3, '0');
            scene.anims.create({
                key: animKey,
                frames: Array.from({ length: cfg.frames }, (_, i) => ({ key: `boss_${type}_${pad(i + 1)}` })),
                frameRate: cfg.frameRate,
                repeat: -1,
            });
        });
    }

    static createProjectileTextures(scene) {
        Boss._createGreenStar(scene);
        Boss._createComet(scene);
    }

    static _createComet(scene) {
        if (scene.textures.exists('comet')) return;
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0xff5500, 0.3);
        g.fillCircle(22, 22, 22);
        g.fillStyle(0xff7700);
        g.fillCircle(22, 22, 15);
        g.fillStyle(0xffcc00);
        g.fillCircle(22, 22, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(18, 17, 4);
        g.generateTexture('comet', 44, 44);
        g.destroy();
    }

    static _createGreenStar(scene) {
        if (scene.textures.exists('green_star')) return;
        const g = scene.make.graphics({ add: false });
        const cx = 14, cy = 14;
        g.fillStyle(0x00dd55, 0.25);
        g.fillCircle(cx, cy, 14);
        g.fillStyle(0x00ff66);
        const outerR = 11, innerR = 4.5;
        const pts = [];
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 / 10) * i - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        g.beginPath();
        pts.forEach((p, i) => i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y));
        g.closePath();
        g.fillPath();
        g.fillStyle(0xbbffdd);
        g.fillCircle(cx, cy, 3.5);
        g.generateTexture('green_star', 28, 28);
        g.destroy();
    }

    _shoot(playerX, playerY) {
        const star = this.stars.create(this.x, this.body.top - 10, 'green_star');
        if (!star) return;
        star.setDepth(2);
        star.body.setAllowGravity(false);
        if (this.variant.tint !== null) star.setTint(this.variant.tint);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        star.setVelocity(Math.cos(angle) * 265, Math.sin(angle) * 265);

        this.scene.tweens.add({ targets: star, angle: 360, duration: 650, repeat: -1 });

        const emitter = this.scene.add.particles(star.x, star.y, 'green_star', {
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.75, end: 0 },
            speed: 15,
            lifespan: 220,
            frequency: 22,
            quantity: 1,
            tint: this.variant.starTints,
            depth: 2,
        });
        emitter.startFollow(star);
        star._emitter = emitter;

        this.scene.time.delayedCall(3500, () => {
            if (emitter && !emitter.destroyed) emitter.destroy();
            if (star.active) star.destroy();
        });
    }

    _shootComet(playerX, _playerY) {
        const comet = this.comets.create(this.x, this.body.top - 10, 'comet');
        if (!comet) return;
        comet.setDepth(2).setScale(1.3);
        if (this.variant.tint !== null) comet.setTint(this.variant.tint);

        const dx = playerX - this.x;
        comet.setVelocity((dx / Math.max(Math.abs(dx), 1)) * 280, -480);
        comet.body.setGravityY(520);

        this.scene.tweens.add({ targets: comet, angle: 360, duration: 600, repeat: -1 });

        const trail = this.scene.add.particles(comet.x, comet.y, 'comet', {
            scale: { start: 0.55, end: 0 },
            alpha: { start: 0.8, end: 0 },
            speed: 20,
            lifespan: 280,
            frequency: 16,
            quantity: 1,
            tint: this.variant.cometTints,
            blendMode: 'ADD',
            depth: 1,
        });
        trail.startFollow(comet);
        comet._trail = trail;

        this.scene.time.delayedCall(4000, () => {
            if (trail && !trail.destroyed) trail.destroy();
            if (comet.active) comet.destroy();
        });
    }

    takeHit() {
        this.health--;
        this.scene.tweens.add({
            targets: this,
            alpha: 0.2,
            duration: 60,
            repeat: 3,
            yoyo: true,
            onComplete: () => this.setAlpha(1),
        });
        return this.health <= 0;
    }

    update(playerX, playerY) {
        this._playerX = playerX;
        this._playerY = playerY;

        if (!this._dir) this._dir = 1;

        if (this.body.blocked.left) this._dir = 1;
        else if (this.body.blocked.right) this._dir = -1;

        if (this.x > this.startX + this.patrolRange) this._dir = -1;
        else if (this.x < this.startX - this.patrolRange) this._dir = 1;

        this.setVelocityX(this.speed * this._dir);
        this.setFlipX(this._dir < 0);
    }
}
