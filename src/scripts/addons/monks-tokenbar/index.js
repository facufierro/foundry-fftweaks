import * as ui from "./ui/ui-manager.js";

export function initialize() {
    try {
        console.log("Initializing monks-tokenbar addon...");
        ui.extendTokenBar();
    } catch (error) {
        console.error(error);
    }
}

