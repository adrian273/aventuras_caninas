import { Menu }        from './scenes/Menu.js';
import { NameEntry }   from './scenes/NameEntry.js';
import { Start, BACKGROUNDS } from './scenes/Start.js';
import { Prize }       from './scenes/Prize.js';

export const LAST_LEVEL = BACKGROUNDS.length - 1;

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    transparent: true,
    pixelArt: false,
    input: { activePointers: 3 },
    dom: { createContainer: true },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 }, debug: false }
    },
    scene: [
        Menu,
        NameEntry,
        Start,
        Prize
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
