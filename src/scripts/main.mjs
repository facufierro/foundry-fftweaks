import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';
import * as battlemapGenerator from './battlemapGenerator/index.js';
import * as chatAutoClean from './chatAutoClean/index.js';
import * as folderColorizer from './folderColorizer/index.js';

Hooks.once('ready', () => {
    folderColorizer.initialize();
    characterAnvil.initialize();
    tokenBarExtender.initialize();
    chatAutoClean.initialize();
});

Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    characterAnvil.initializeUI(html, sheet.actor);
});

Hooks.on("pauseGame", (paused) => {
    autoTimer.initialize(paused);
});

// Passing controls to battlemapGenerator.initializeUI
Hooks.on('getSceneControlButtons', (controls) => {
    battlemapGenerator.initializeUI(controls);
});

// Hook into the creation of a folder and apply colors
Hooks.on('createFolder', () => {
    // Add a slight delay to ensure the folder is fully created and rendered before updating colors
    setTimeout(() => {
        folderColorizer.initialize();
    }, 25); // Adjust delay as needed
});