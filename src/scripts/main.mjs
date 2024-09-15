import { CharacterManager } from './utils/characterManager.js';
import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';
import * as battlemapGenerator from './battlemapGenerator/index.js';
import * as chatAutoClean from './chatAutoClean/index.js';
import * as folderColorizer from './folderColorizer/index.js';
import * as tokenCustomizer from './tokenCustomizer/index.js';
import * as levelsHandler from './levelsHandler/index.js';

import { Character } from './models/character.js';

Hooks.once('ready', () => {
    CharacterManager.initializeAllPlayerCharacters();
    folderColorizer.initialize();
    // levelsHandler.initialize();
    // characterAnvil.initialize();
    tokenBarExtender.initialize();
    chatAutoClean.initialize();
    tokenCustomizer.initialize();

    window.fftweaks = window.fftweaks || {};

    game.actors.forEach(actor => {
        // Only instantiate actors that have player owners (i.e., player characters)
        if (actor.hasPlayerOwner) {
            // Create a variable name dynamically based on the actor's name
            const characterName = actor.name.replace(/\s+/g, '').toLowerCase(); // Remove spaces and lowercase the name
            window.fftweaks[characterName] = new Character(actor.id);
        }
    });

    ui.notifications.info("Player characters initialized!");
});

Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    // characterAnvil.initializeUI(html, sheet.actor);
});

Hooks.on("pauseGame", (paused) => {
    autoTimer.initialize(paused);
});

Hooks.on('getSceneControlButtons', (controls) => {
    battlemapGenerator.initializeUI(controls);
});

Hooks.on('createFolder', () => {
    setTimeout(() => {
        folderColorizer.initialize();
    }, 25);
});

