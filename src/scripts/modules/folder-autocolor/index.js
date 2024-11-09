import { changeFoldersColors } from "./functions/change-folders-colors.js";
export function initialize() {
    try {
        console.log("Initializing folder-autocolor module...");
        changeFoldersColors();
    } catch (error) {
        console.error(error);
    }
}
