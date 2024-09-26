// path: src/scripts/modules/combat-automation/index.js
import { Combat } from './models/combat.js';
import { CardType } from './models/enums.js';

export function initialize() {
    const combat = new Combat();
    Hooks.on('renderChatMessage', (message, html, data) => {
        combat.getCardData(html)
    });
}
