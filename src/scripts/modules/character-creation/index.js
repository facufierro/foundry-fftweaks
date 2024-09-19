import { addLevelUpButton } from "./ui/buttons/level-up-button.js";
import { extractBackgroundData } from "./services/compendium-service.js";

export function initialize() {

}

export function initializeUI(html, actor) {
    addLevelUpButton(html, actor);
    extractBackgroundData(game.packs.get('fftweaks.character-creation')).then(backgrounds => {
        console.log('Backgrounds:', backgrounds);
    });
}
