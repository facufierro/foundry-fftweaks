import { changeFoldersColors } from "./functions/change-folders-colors.js";
export function initialize() {
    try {
        Debug.Log("Initializing folder-autocolor module...");
        changeFoldersColors();
    } catch (error) {
        Debug.Error(error);
    }
}
