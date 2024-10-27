import * as functions from "./functions.js";
import * as ui from "./ui.js";

export function initialize() {
    try {
        console.log("Initializing macro-utilities module...");
        globalThis.fft = globalThis.fft || {};
        fft.getItemsInCompendiumFolder = functions.getItemsInCompendiumFolder;
        fft.removeItemsByName = functions.removeItemsByName; // Corrected the assignment
        fft.chooseItemsDialog = ui.chooseItemsDialog;
        fft.addItemsToActor = functions.addItemsToActor;
    } catch (error) {
        console.error(error);
    }
}

