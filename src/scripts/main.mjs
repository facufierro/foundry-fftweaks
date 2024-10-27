// path: src/scripts/main.mjs
// import { CharacterController } from "./controllers/character-controller.js";
// import * as comabtAutomation from "./modules/combat-automation/index.js";
import * as monksTokenbarAddon from "./addons/monks-tokenbar/index.js";
import * as folderAutocolorModule from "./modules/folder-autocolor/index.js";
import * as simpleCalendarUtils from "./addons/simplecalendar-utils/index.js";
import * as levelsUtils from "./addons/levels-utils/index.js";


Hooks.once('ready', () => {
    // CharacterController.initializeAllPlayerCharacters();
    // comabtAutomation.initialize();
    folderAutocolorModule.initialize();
    monksTokenbarAddon.initialize();
    simpleCalendarUtils.initialize();
    levelsUtils.initialize();
});

// Hooks.once('dnd5e.postRollAttack', (rolls, data, activity) => {
//     console.log('rolls:', rolls);
//     console.log('data:', data);
//     console.log('activity:', activity);
// })
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


// let actor = canvas.tokens.controlled[0]?.actor;
// if (!actor) return;

// let weapon = actor.items.find(i => i.system.equipped && i.type === "weapon");
// if (!weapon) return;

// let attackActivity = weapon.system.activities?.getByType("attack")[0];
// if (attackActivity) {
//     await attackActivity.rollAttack({ options: { fastForward: true } });
// }