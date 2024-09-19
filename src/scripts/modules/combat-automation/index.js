// path: src/scripts/modules/combat-automation/index.js
import { Combat } from './models/combat.js';

export function initialize() {
    Hooks.on('renderChatMessage', (message, html, data) => {
        setTimeout(() => {
            console.log('Chat message fully rendered after delay', html);
            const combat = new Combat();
            combat.initializeAttackSequence(html);
        }, 100);  // Delay of 100ms
    });

}
