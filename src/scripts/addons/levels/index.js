import { selectGroundFloor } from "./functions/select-ground-floor.js";
export function initialize() {
    try {
        Debug.Log("Initializing levels addon...");
        selectGroundFloor();
    }
    catch (error) {
        Debug.Error(error);
    }
}