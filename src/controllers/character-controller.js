// path: src/scripts/models/character.js

import { Character } from '../modules/characters/character.js';

/**
 * CharacterController is responsible for initializing all player characters
 * and making them accessible via global variables, named after their lowercase first names.
 * 
 * @class CharacterController
 */
export class CharacterController {
    /**
     * Initialize all player characters and create a global variable for each character,
     * indexed by their lowercase first names.
     * 
     * @static
     * @memberof CharacterController
     */
    static initializeAllPlayerCharacters() {
        game.actors.forEach(actor => {
            if (actor.type === 'character' && actor.hasPlayerOwner) {
                // Get the first name and lowercase it
                let firstName = actor.name.split(/[' ]/)[0].toLowerCase();
                console.log(`Initializing character: ${firstName}`);

                // Create a Character instance
                let characterInstance = new Character(actor.id);

                // Dynamically create a global variable for the character
                window[firstName] = characterInstance;
            }
        });

        ui.notifications.info("Player characters initialized and global variables created!");
    }
}
