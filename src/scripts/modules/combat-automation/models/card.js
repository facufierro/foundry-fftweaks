//path: src/scripts/modules/combat-automation/models/card.js

import { CardType } from "./enums.js";

const TIME_LIMIT_MS = 1000;
const TIMEOUT_MS = 25;

export class Card {
    constructor(html) {
        try {
            console.log("Initializing Card");
            this.html = html;
            this.id = this.html.data('messageId');
            this.createdAt = Date.now();
            this.rollResult = html.find('h4.dice-total').first();
            this.rollAttackButton = html.find('button[data-action="rollAttack"]')[0];
            this.rollDamageButton = html.find('button[data-action="rollDamage"]')[0];
            this.applyDamageButton = html.find('button[data-action="applyDamage"]')[0];
            this.rollSaveButton = html.find('button[data-action="rollSave"]')[0];

            this.placeTemplateButton = html.find('button[data-action="placeTemplate"]')[0];
            this.subtitle = this.getSubtitle();
            this.type = this.getType();


        } catch (e) {
            console.error(e);
        }
    }

    // Delete the chat card 
    delete() {
        try {
            console.log(`Deleting ${this.type}`);
            let chatMessage = game.messages.get(this.id);
            if (chatMessage) {
                chatMessage.delete();
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    getSubtitle() {
        try {
            setTimeout(() => {
                const subtitleElement = this.html.find('.card-header .summary .name-stacked .subtitle');
                if (subtitleElement.length > 0) {
                    return subtitleElement.text().trim(); // Return the full subtitle text
                } else {
                    return null; // Return null if the subtitle is not found
                }
            }
                , TIMEOUT_MS);
        } catch (e) {
            console.error("Error retrieving subtitle: ", e);
            return null;
        }
    }

    // Determine the card type immediately
    getType() {
        try {
            console.log("Setting Card Type");
            if (this.rollAttackButton && this.rollDamageButton) {
                console.log("Type set: Activation Card");
                return CardType.ACTIVATION_CARD;
            } else if (this.subtitle && this.subtitle.includes("Attack")) {
                console.log("Type set: Attack Card");
                return CardType.ATTACK_CARD;
            } else if (this.subtitle && this.subtitle.includes("Damage")) {
                console.log("Type set: Damage Card");
                return CardType.DAMAGE_CARD;
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    // If rollAttackButton is not null and createdAt is less than TIME_LIMIT_MS, press the button using shift+click
    rollAttack() {
        try {
            setTimeout(() => {
                console.log(`Rolling Attack`);
                if (this.rollAttackButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
                    const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
                    this.rollAttackButton.dispatchEvent(event);
                }
            }
                , TIMEOUT_MS);
        } catch (e) {
            console.error(e);
        }

    }
    // If rollDamageButton is not null and createdAt is less than TIME_LIMIT_MS, press the button using shift+click
    rollDamage() {
        try {
            setTimeout(() => {

                console.log("Rolling Damage");
                if (this.rollAttackButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
                    const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
                    this.rollDamageButton.dispatchEvent(event);
                }
            }
                , TIMEOUT_MS);
        } catch (e) {
            console.error(e);
        }
    }

    // Check for success or failure asynchronously and call the callback with the result
    getRollResult() {
        try {
            setTimeout(() => {
                const rollResult = this.html.find('h4.dice-total').first();

                if (rollResult.hasClass('success')) {
                    console.log("Attack Successful");
                    return true;
                } else if (rollResult.hasClass('failure') || rollResult.hasClass('fumble')) {
                    // Check for both 'failure' and 'fumble' classes
                    console.log("Attack Failed");
                    return false;
                }
            }, TIMEOUT_MS); // Introduce a small delay to ensure rendering
        }
        catch (e) {
            console.error(e);
        }
    }

}

