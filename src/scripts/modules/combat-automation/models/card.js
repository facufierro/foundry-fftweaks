//path: src/scripts/modules/combat-automation/models/card.js

import { CardType } from "./enums.js";

const TIME_LIMIT_MS = 1000;

export class Card {
    constructor(html) {
        console.log("Initializing Card");
        this.html = html;
        this.id = this.html.data('messageId');
        this.createdAt = Date.now();
        this.rollResult = html.find('h4.dice-total').first();
        this.rollAttackButton = html.find('button[data-action="rollAttack"]')[0];
        this.rollDamageButton = html.find('button[data-action="rollDamage"]')[0];
        this.applyDamageButton = html.find('button[data-action="applyDamage"]')[0];
        this.rollSaveButton = html.find('button[data-action="rollSave"]')[0];
        this.getSubtitle().then(subtitle => {
            this.subtitle = subtitle;
            this.type = this.getType();
            this.isRendered = true;
        }).catch(console.error);
    }


    // Delete the chat card, returning a Promise
    delete() {
        return new Promise((resolve, reject) => {
            const chatMessage = game.messages.get(this.id);
            if (chatMessage) {
                chatMessage.delete().then(() => {
                    console.log(`Chat message with ID ${this.id} deleted.`);
                    resolve(true);
                }).catch(error => {
                    console.error(`Failed to delete chat message with ID ${this.id}:`, error);
                    reject(error);
                });
            } else {
                console.error(`No chat message found with ID ${this.id}.`);
                reject(new Error(`No chat message found with ID ${this.id}`));
            }
        });
    }

    // Return a Promise to handle asynchronous access to subtitle
    getSubtitle() {
        return new Promise((resolve, reject) => {
            const subtitleElement = this.html.find('.subtitle');
            if (subtitleElement.length > 0) {
                resolve(subtitleElement.text().trim());
            } else {
                const observer = new MutationObserver((mutations, obs) => {
                    const subtitleElement = this.html.find('.subtitle');
                    if (subtitleElement.length > 0) {
                        resolve(subtitleElement.text().trim());
                        obs.disconnect();
                    }
                });
                observer.observe(this.html[0], { childList: true, subtree: true });
            }
        });
    }

    // Determine the card type
    getType() {
        if (this.rollAttackButton && this.rollDamageButton) {
            return CardType.ACTIVATION_CARD;
        } else if (this.subtitle?.includes("Attack")) {
            return CardType.ATTACK_CARD;
        } else if (this.subtitle?.includes("Damage")) {
            return CardType.DAMAGE_CARD;
        }
        return null;
    }

    // Roll attack 
    rollAttack() {
        return new Promise((resolve, reject) => {
            if (this.rollAttackButton) {
                console.log("Rolling attack, button found.");
                this.rollAttackButton.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
                resolve(true);
            } else {
                console.error("No roll attack button found in the card.");
                reject(new Error("No roll attack button found."));
            }
        });
    }

    // Roll damage 
    rollDamage() {
        return new Promise((resolve, reject) => {
            if (this.rollDamageButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
                this.rollDamageButton.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // Check roll result asynchronously
    getRollResult() {
        return new Promise((resolve, reject) => {
            const rollResult = this.html.find('h4.dice-total').first();
            if (rollResult.hasClass('success')) {
                resolve(true);
            } else if (rollResult.hasClass('failure') || rollResult.hasClass('fumble')) {
                resolve(false);
            } else {
                resolve(null);
            }
        });
    }
}
