// Immediately assign Debug to window so it's globally accessible
import { Debug } from "./utilities/debug.js";
window.Debug = Debug;  // This makes Debug globally accessible immediately

import * as addonLevels from "./addons/levels/index.js";
import * as addonMonksTokenbar from "./addons/monks-tokenbar/index.js";
import * as addonSimpleCalendar from "./addons/simple-calendar/index.js";
import * as moduleFolderAutocolor from "./modules/folder-autocolor/index.js";

Hooks.once('ready', () => {
    Debug.Log("Initializing FFTweaks...");
    try {
        addonLevels.initialize();
        addonMonksTokenbar.initialize();
        addonSimpleCalendar.initialize();
        moduleFolderAutocolor.initialize();
    } catch (error) {
        Debug.Error(error);
    }

});
