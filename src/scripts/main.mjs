import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';
import * as battlemapGenerator from './battlemapGenerator/index.js';
import * as chatAutoClean from './chatAutoClean/index.js';
import * as folderColorizer from './folderColorizer/index.js';
import * as tokenCustomizer from './tokenCustomizer/index.js';
import * as levelsHandler from './levelsHandler/index.js';

import { ActorWrapper } from './models/actorWrapper.js';

Hooks.once('ready', () => {
    folderColorizer.initialize();
    // levelsHandler.initialize();
    // characterAnvil.initialize();
    tokenBarExtender.initialize();
    chatAutoClean.initialize();
    tokenCustomizer.initialize();
    const myActor = game.actors.get("y0J7wKfvQyNIC1RS"); // Fetch the actor by its ID

    if (myActor) {
        const actorWrapper = new ActorWrapper(myActor);

        // Make the actorWrapper globally accessible (for testing and macros)
        window.myActorWrapper = actorWrapper;
    } else {
        ui.notifications.error("Actor not found.");
    }
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

