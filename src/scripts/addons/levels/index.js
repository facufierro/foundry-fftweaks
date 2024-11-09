import { selectGroundFloor } from "./functions/select-ground-floor.js";
export function initialize() {
    try {
        console.log("Initializing levels addon...");
        selectGroundFloor();
    }
    catch (error) {
        console.error(error);
    }
}