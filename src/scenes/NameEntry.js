export class NameEntry extends Phaser.Scene {
    constructor() {
        super('NameEntry');
    }

    preload() {
        if (!this.textures.exists('menu_bg')) {
            this.load.image('menu_bg', 'assets/backgrounds/menu.png');
        }
    }

    create() {
        this.add.image(640, 360, 'menu_bg').setDisplaySize(1280, 720);

        this.add.rectangle(640, 350, 620, 380, 0x1a0533, 0.88).setOrigin(0.5);

        this.add.text(640, 195, '¿Cómo te llamás?', {
            fontSize: '50px', color: '#ffd700', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(640, 265, 'Ingresá tu nombre para guardar tu progreso', {
            fontSize: '22px', color: '#aaddff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        const dom = this.add.dom(640, 360).createFromHTML(`
            <input id="nameInput" type="text" maxlength="16" placeholder="Tu nombre..."
                style="
                    width: 360px;
                    font-size: 28px;
                    padding: 14px 20px;
                    border-radius: 14px;
                    border: 3px solid #7b3fa0;
                    background: rgba(15, 5, 40, 0.95);
                    color: #ffffff;
                    font-family: Arial, sans-serif;
                    outline: none;
                    text-align: center;
                    caret-color: #ffd700;
                "
            />
        `);

        dom.addListener('keydown');
        dom.on('keydown', e => { if (e.key === 'Enter') this._confirm(); });

        const btn = this.add.text(640, 460, '  ▶  ¡Jugar!  ', {
            fontSize: '44px', color: '#ffffff', fontFamily: 'Arial',
            stroke: '#3b1278', strokeThickness: 6,
            backgroundColor: '#3b1278', padding: { x: 36, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: '#ffd700' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerdown', () => this._confirm());

        const back = this.add.text(640, 535, '← Volver', {
            fontSize: '24px', color: '#aaddff', fontFamily: 'Arial',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        back.on('pointerover', () => back.setStyle({ color: '#ffffff' }));
        back.on('pointerout',  () => back.setStyle({ color: '#aaddff' }));
        back.on('pointerdown', () => this.scene.start('Menu'));

        this.time.delayedCall(100, () => {
            document.getElementById('nameInput')?.focus();
        });
    }

    _confirm() {
        const raw  = document.getElementById('nameInput')?.value ?? '';
        const name = raw.trim() || 'Jugador';
        localStorage.setItem('gameSave', JSON.stringify({ name, level: 0, score: 0, time: 0 }));
        this.scale.startFullscreen();
        this.scene.start('Start', { level: 0, score: 0, time: 0, name });
    }
}
