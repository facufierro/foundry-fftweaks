import { toggleClock } from "./functions/toggle-clock.js";

export function initialize() {
    try {
        Debug.Log("Initializing simple-calendar addon...");
        toggleClock();
    } catch (error) {
        Debug.Error(error);
    }
}
