import { addCharacterCreationButton } from "./ui/buttons/character-creation-button.js";

export function initialize() {
    Hooks.on("renderActorSheet", (app, html, data) => {
        addCharacterCreationButton(html, app.actor);
    });
}

