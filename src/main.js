import { Menu }      from './scenes/Menu.js';
import { NameEntry } from './scenes/NameEntry.js';
import { Start }     from './scenes/Start.js';

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
        Start
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
