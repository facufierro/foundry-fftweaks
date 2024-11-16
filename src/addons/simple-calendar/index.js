import { toggleClock } from "./functions/toggle-clock.js";

export function initialize() {
    try {
        console.log("Initializing simple-calendar addon...");
        toggleClock();
    } catch (error) {
        console.error(error);
    }
}
