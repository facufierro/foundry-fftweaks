//path: src/scripts/modules/combat-automation/models/card.js
const TIME_LIMIT_MS = 1000;

const CardType = Object.freeze({
    ACTIVATION_CARD: 'ACTIVATION_CARD',
    ATTACK_CARD: 'ATTACK_CARD',
    DAMAGE_CARD: 'DAMAGE_CARD',
});

export class Card {
    constructor(html) {
        this.html = html;
        this.id = html.data('messageId');
        this.createdAt = Date.now();

        this.rollResult = html.find('h4.dice-total').first();
        this.rollAttackButton = html.find('button[data-action="rollAttack"]')[0];
        this.rollDamageButton = html.find('button[data-action="rollDamage"]')[0];
        this.rollSaveButton = html.find('button[data-action="rollSave"]')[0];
        this.placeTemplateButton = html.find('button[data-action="placeTemplate"]')[0];

        // Initialize the type directly, no delay
        this.type = this.getType();
    }

    // Delete the chat card 
    delete() {
        let chatMessage = game.messages.get(this.id);
        if (chatMessage) {
            chatMessage.delete();
        }
    }

    // Determine the card type immediately
    getType() {
        if (this.rollAttackButton && this.rollDamageButton) {
            console.log('Card has both attack and damage buttons, identified as ACTIVATION_CARD');
            return CardType.ACTIVATION_CARD;
        } else if (this.rollResult && this.rollResult.length > 0) {  // Check if rollResult is valid
            console.log('Card has a roll result, identified as ATTACK_CARD');
            return CardType.ATTACK_CARD;
        } else {
            console.log('Card type could not be identified');
            return null;  // Default case, when no match
        }
    }

    // If rollAttackButton is not null and createdAt is less than TIME_LIMIT_MS, press the button using shift+click
    rollAttack() {
        if (this.rollAttackButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
            const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
            this.rollAttackButton.dispatchEvent(event);
        }
    }

    // If rollDamageButton is not null and createdAt is less than TIME_LIMIT_MS, press the button using shift+click
    rollDamage() {
        if (this.rollAttackButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
            const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
            this.rollDamageButton.dispatchEvent(event);
        }
    }

    // Check for success or failure asynchronously and call the callback with the result
    getRollResult(callback) {
        const rollResult = this.html.find('h4.dice-total').first();
        if (rollResult.hasClass('success')) {
            callback(true);  // Roll was a success
        } else if (rollResult.hasClass('failure')) {
            callback(false);  // Roll was a failure
        } else {
            callback(null);  // No result (neither success nor failure)
        }
    }
}

