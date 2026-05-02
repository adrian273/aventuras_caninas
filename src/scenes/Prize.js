const PRIZES = [
    { name: 'Sigue participando XD', weight: 10, color: 0x555555 },
    { name: '100 pesos', weight: 25, color: 0xf1c40f },
    { name: '500 pesos', weight: 13, color: 0xe67e22 },
    { name: 'Sigue participando XD', weight: 10, color: 0x555555 },
    { name: '1 Galleta', weight: 8, color: 0x9b59b6 },
    { name: '1 Dorito', weight: 6, color: 0xe74c3c },
    { name: 'Sigue participando XD', weight: 10, color: 0x555555 },
    { name: '1 Helado', weight: 4, color: 0x3498db },
    { name: '1 Squishie', weight: 2, color: 0x2ecc71 },
    { name: '1500 pesos', weight: 1, color: 0xff6b9d },
    { name: '5 Squishies', weight: 0.5, color: 0x1abc9c },
    { name: '2000 pesos', weight: 0.3, color: 0xf39c12 },
    { name: '¡Lo que pidas!', weight: 0.2, color: 0xff4444 },
];

const ONE_TIME = new Set(['1 Galleta', '1 Dorito', '¡Lo que pidas!']);

function getActivePrizes() {
    const claimed = JSON.parse(localStorage.getItem('claimedPrizes') || '[]');
    return PRIZES.filter(p => !ONE_TIME.has(p.name) || !claimed.includes(p.name));
}

function claimPrize(name) {
    if (!ONE_TIME.has(name)) return;
    const claimed = JSON.parse(localStorage.getItem('claimedPrizes') || '[]');
    if (!claimed.includes(name)) {
        claimed.push(name);
        localStorage.setItem('claimedPrizes', JSON.stringify(claimed));
    }
}

let ACTIVE;
const R = 210;

export class Prize extends Phaser.Scene {
    constructor() { super('Prize'); }

    preload() {
        if (!this.cache.audio.exists('tap')) this.load.audio('tap', 'assets/sounds/tap.wav');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x1a0533);

        this.add.text(640, 55, '¡Completaste el juego!', {
            fontSize: '46px', color: '#ffd700', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 7
        }).setOrigin(0.5);

        this.add.text(640, 115, 'Girá la rueda para ganar tu premio', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        ACTIVE = getActivePrizes();

        this._winner = this._pick();
        this._spun = false;
        this._tickSnd = this.sound.add('tap', { volume: 0.3 });

        this._buildWheel();
        this._buildPointer();
        this._buildSpinBtn();
    }

    _pick() {
        const total = ACTIVE.reduce((s, p) => s + p.weight, 0);
        let r = Math.random() * total;
        for (const p of ACTIVE) { r -= p.weight; if (r <= 0) return p; }
        return ACTIVE[0];
    }

    _buildWheel() {
        const cx = 640, cy = 390;
        const n = ACTIVE.length;
        const seg = (Math.PI * 2) / n;
        this.wheelContainer = this.add.container(cx, cy);

        const g = this.add.graphics();
        ACTIVE.forEach((prize, i) => {
            const start = i * seg - Math.PI / 2;
            const end = start + seg;
            g.fillStyle(prize.color);
            g.slice(0, 0, R, start, end, false);
            g.fillPath();
        });

        g.lineStyle(2, 0x000000, 0.4);
        for (let i = 0; i < n; i++) {
            const a = i * seg - Math.PI / 2;
            g.lineBetween(0, 0, Math.cos(a) * R, Math.sin(a) * R);
        }
        g.fillStyle(0xffffff);
        g.fillCircle(0, 0, 18);

        this.wheelContainer.add(g);

        ACTIVE.forEach((prize, i) => {
            const mid = i * seg - Math.PI / 2 + seg / 2;
            const tx = Math.cos(mid) * R * 0.64;
            const ty = Math.sin(mid) * R * 0.64;
            const t = this.add.text(tx, ty, prize.name, {
                fontSize: '13px', color: '#ffffff', fontFamily: 'Arial',
                stroke: '#000000', strokeThickness: 3,
                align: 'center', wordWrap: { width: 80 }
            }).setOrigin(0.5).setRotation(mid + Math.PI / 2);
            this.wheelContainer.add(t);
        });

        this._wheelSeg = seg;
    }

    _buildPointer() {
        const cx = 640, cy = 390;
        const tip = cy - R - 8;
        const p = this.add.graphics();
        p.fillStyle(0xff2222);
        p.fillTriangle(cx, tip, cx - 16, tip - 36, cx + 16, tip - 36);
        p.lineStyle(2, 0x000000, 1);
        p.strokeTriangle(cx, tip, cx - 16, tip - 36, cx + 16, tip - 36);
    }

    _buildSpinBtn() {
        this._btn = this.add.text(640, 662, '  🎰 GIRAR  ', {
            fontSize: '38px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#3b1278', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this._btn.on('pointerover', () => this._btn.setStyle({ color: '#ffd700' }));
        this._btn.on('pointerout', () => this._btn.setStyle({ color: '#ffffff' }));
        this._btn.on('pointerdown', () => {
            if (this._spun) return;
            this._spun = true;
            this._btn.destroy();
            this._spin();
        });
    }

    _spin() {
        const winIdx = ACTIVE.indexOf(this._winner);
        const segDeg = Phaser.Math.RadToDeg(this._wheelSeg);
        const targetOff = -(winIdx * segDeg + segDeg / 2);
        const fullSpins = (6 + Math.floor(Math.random() * 4)) * 360;
        const finalAngle = fullSpins + targetOff;

        let lastSegment = -1;
        this.tweens.add({
            targets: this.wheelContainer,
            angle: finalAngle,
            duration: 5000,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                const current = ((this.wheelContainer.angle % 360) + 360) % 360;
                const seg = Math.floor(current / segDeg);
                if (seg !== lastSegment) {
                    lastSegment = seg;
                    this._tickSnd.play();
                }
            },
            onComplete: () => this._showPrize()
        });
    }

    _showPrize() {
        claimPrize(this._winner.name);
        const uuid = crypto.randomUUID();

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75).setDepth(5);

        this.add.text(640, 180, '🎁 ¡Tu premio!', {
            fontSize: '52px', color: '#ffd700', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(6);

        this.add.text(640, 280, this._winner.name, {
            fontSize: '52px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 7
        }).setOrigin(0.5).setDepth(6);

        this.add.text(640, 370, 'Código de verificación:', {
            fontSize: '20px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);

        this.add.text(640, 415, uuid, {
            fontSize: '15px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#333333', padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setDepth(6);

        const replay = this.add.text(640, 510, '  ▶  Jugar de nuevo  ', {
            fontSize: '34px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#3b1278', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 26, y: 10 }
        }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });

        const menu = this.add.text(640, 578, 'Volver al menú', {
            fontSize: '24px', color: '#aaddff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });

        replay.on('pointerover', () => replay.setStyle({ color: '#ffd700' }));
        replay.on('pointerout', () => replay.setStyle({ color: '#ffffff' }));
        replay.on('pointerdown', () => this.scene.start('Start', { level: 0 }));

        menu.on('pointerover', () => menu.setStyle({ color: '#ffffff' }));
        menu.on('pointerout', () => menu.setStyle({ color: '#aaddff' }));
        menu.on('pointerdown', () => this.scene.start('Menu'));
    }
}
