import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';
import * as battlemapGenerator from './battlemapGenerator/index.js';
import * as chatCleaner from './chatCleaner/index.js';
import * as folderColorizer from './folderColorizer/index.js';

Hooks.once('ready', () => {
    folderColorizer.initialize();
    // characterAnvil.initialize();
    tokenBarExtender.initialize();
    chatCleaner.initialize();
});

Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    // characterAnvil.initializeUI(html, sheet.actor);
});

Hooks.on("pauseGame", (paused) => {
    autoTimer.initialize(paused);
});

// Passing controls to battlemapGenerator.initializeUI
Hooks.on('getSceneControlButtons', (controls) => {
    battlemapGenerator.initializeUI(controls);
});

