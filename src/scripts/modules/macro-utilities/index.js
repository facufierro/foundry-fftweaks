import * as functions from "./functions.js";
import * as ui from "./ui.js";

export function initialize() {
    try {
        console.log("Initializing macro-utilities module...");
        globalThis.fft = globalThis.fft || {};
        fft.removeItemsFromActor = functions.removeItemsFromActor;
        fft.getCompendiumItems = functions.getCompendiumItems;
        fft.chooseItemsDialog = ui.chooseItemsDialog;
        fft.addItemsToActor = functions.addItemsToActor;
        fft.getSourceTags = functions.getSourceTags;
    } catch (error) {
        console.error(error);
    }
}

