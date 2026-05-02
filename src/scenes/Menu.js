export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        this.load.image('menu_bg', 'assets/backgrounds/menu.png');
    }

    create() {
        this.add.image(640, 360, 'menu_bg').setDisplaySize(1280, 720);


        const bestCoins = localStorage.getItem('bestCoins') ?? 0;
        const bestTime  = localStorage.getItem('bestTime')  ?? 0;
        const save      = JSON.parse(localStorage.getItem('gameSave') || 'null');

        this.add.text(640, 460, `🏆 Mejor puntaje: ${bestCoins} monedas`, {
            fontSize: '28px', color: '#ffd700', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(640, 505, `⏱ Mejor tiempo: ${this._fmt(Number(bestTime))}`, {
            fontSize: '28px', color: '#aaddff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        if (save) {
            const cont = this.add.text(640, 590, `  ▶  Continuar — ${save.name} · Nivel ${save.level + 1}  `, {
                fontSize: '40px', color: '#ffffff', fontFamily: 'Arial',
                stroke: '#3b1278', strokeThickness: 6,
                backgroundColor: '#3b1278', padding: { x: 36, y: 14 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            cont.on('pointerover', () => cont.setStyle({ color: '#ffd700' }));
            cont.on('pointerout',  () => cont.setStyle({ color: '#ffffff' }));
            cont.on('pointerdown', () => {
                this.scene.start('Start', { level: save.level, score: save.score, time: save.time, name: save.name });
            });

            const newGame = this.add.text(640, 660, 'Nueva partida', {
                fontSize: '26px', color: '#aaddff', fontFamily: 'Arial',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            newGame.on('pointerover', () => newGame.setStyle({ color: '#ffffff' }));
            newGame.on('pointerout',  () => newGame.setStyle({ color: '#aaddff' }));
            newGame.on('pointerdown', () => this._startNew());
        } else {
            const btn = this.add.text(640, 620, '  ▶  JUGAR  ', {
                fontSize: '48px', color: '#ffffff', fontFamily: 'Arial',
                stroke: '#3b1278', strokeThickness: 6,
                backgroundColor: '#3b1278', padding: { x: 40, y: 16 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setStyle({ color: '#ffd700' }));
            btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
            btn.on('pointerdown', () => this._startNew());
        }
    }

    _startNew() {
        this.scene.start('NameEntry');
    }

    _fmt(ms) {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        return `${mins}:${String(secs % 60).padStart(2, '0')}`;
    }
}
