import * as ui from "./ui/ui-manager.js";

export function initialize() {
    try {
        Debug.Log("Initializing monks-tokenbar addon...");
        ui.extendTokenBar();
    } catch (error) {
        Debug.Error(error);
    }
}

