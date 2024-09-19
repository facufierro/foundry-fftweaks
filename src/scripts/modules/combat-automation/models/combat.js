//path: src/scripts/modules/combat-automation/models/combat.js
import { Card } from "./card.js";

export class Combat {
    constructor() {
        this.chatCards = [];
    }
    initializeAttackSequence(html) {
        const newCard = new Card(html);
        this.chatCards.push(newCard);
        ui.notifications.info(`Last card is of type: ${newCard.type}`);
    }

}