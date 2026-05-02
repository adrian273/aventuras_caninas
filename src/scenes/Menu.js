export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const bestCoins = localStorage.getItem('bestCoins') ?? 0;
        const bestTime  = localStorage.getItem('bestTime')  ?? 0;

        this.add.text(640, 160, 'AVENTURA CANINA', {
            fontSize: '68px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(640, 270, `🏆 Mejor puntaje: ${bestCoins} monedas`, {
            fontSize: '28px', color: '#ffd700', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(640, 315, `⏱ Mejor tiempo: ${this._fmt(Number(bestTime))}`, {
            fontSize: '28px', color: '#aaddff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        const btn = this.add.text(640, 430, '  ▶  JUGAR  ', {
            fontSize: '48px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#3b1278', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 40, y: 16 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: '#ffd700' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown', () => this.scene.start('Start'));
    }

    _fmt(ms) {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        return `${mins}:${String(secs % 60).padStart(2, '0')}`;
    }
}
