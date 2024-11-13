import { selectGroundFloor } from "./functions/select-ground-floor.js";

export function initialize() {
    try {
        FFT.Debug.Success("Initializing levels addon...");
        selectGroundFloor();
    }
    catch (error) {
        console.error(error);
    }
}