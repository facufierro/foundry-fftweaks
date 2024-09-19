// path: src/scripts/main.mjs
// import { CharacterController } from "./controllers/character-controller.js";
import * as comabtAutomation from "./modules/combat-automation/index.js";


Hooks.once('ready', () => {
    // CharacterController.initializeAllPlayerCharacters();
    comabtAutomation.initialize();
});

// Hooks.on('renderActorSheet5e', (sheet, html, data) => {
// });

// Hooks.on("pauseGame", (paused) => {
//     autoTimer.initialize(paused);
// });

// Hooks.on('getSceneControlButtons', (controls) => {
//     battlemapGenerator.initializeUI(controls);
// });

// Hooks.on('createFolder', () => {
//     setTimeout(() => {
//         folderColorizer.initialize();
//     }, 25);
// });
