// models/characterManager.js

import { Character } from '../models/character.js';

export class CharacterManager {
    static initializeAllPlayerCharacters() {
        window.fftweaks = window.fftweaks || {};

        game.actors.forEach(actor => {
            if (actor.type === 'character' && actor.hasPlayerOwner) {
                let firstName = actor.name.split(/[' ]/)[0].toLowerCase();
                console.log(`Initializing character: ${firstName}`);
                window.fftweaks[firstName] = new Character(actor.id);
            }
        });

        ui.notifications.info("Player characters initialized!");
    }
}
