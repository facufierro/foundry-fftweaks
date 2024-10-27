import { Debug } from "./utilities/debug.js";
window.Debug = Debug;

import * as addonLevels from "./addons/levels/index.js";
import * as addonMonksTokenbar from "./addons/monks-tokenbar/index.js";
import * as addonSimpleCalendar from "./addons/simple-calendar/index.js";
import * as moduleCharacterCreation from "./modules/character-creation/index.js";
import * as moduleFolderAutocolor from "./modules/folder-autocolor/index.js";
import * as moduleMacroUtilitiies from "./modules/macro-utilities/index.js";

Hooks.once('ready', () => {
    Debug.Log("Initializing FFTweaks...");
    try {
        addonLevels.initialize();
        addonMonksTokenbar.initialize();
        addonSimpleCalendar.initialize();
        moduleCharacterCreation.initialize();
        moduleFolderAutocolor.initialize();
        moduleMacroUtilitiies.initialize();

    } catch (error) {
        Debug.Error(error);
    }

});
