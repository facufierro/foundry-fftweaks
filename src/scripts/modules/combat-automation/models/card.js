//path: src/scripts/modules/combat-automation/models/card.js

import { CardType } from "./enums.js";

const TIME_LIMIT_MS = 1000;

export class Card {
    constructor(html) {
        try {
            console.log("Initializing Card");
            this.html = html;
            console.log("HTML structure:", this.html);
            this.id = this.html.data('messageId');
            this.createdAt = Date.now();
            this.rollResult = html.find('h4.dice-total').first();
            this.rollAttackButton = html.find('button[data-action="rollAttack"]')[0];
            this.rollDamageButton = html.find('button[data-action="rollDamage"]')[0];
            this.applyDamageButton = html.find('button[data-action="applyDamage"]')[0];
            this.rollSaveButton = html.find('button[data-action="rollSave"]')[0];

            // Fetch the subtitle asynchronously without using setTimeout
            this.getSubtitle().then(subtitle => {
                this.subtitle = subtitle;
                this.type = this.getType();
            }).catch(err => {
                console.error("Error retrieving subtitle: ", err);
            });
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
        } catch (e) {
            console.error(e);
        }
    }

    // Return a Promise to handle asynchronous access to subtitle
    getSubtitle() {
        return new Promise((resolve, reject) => {
            const observer = new MutationObserver((mutations, obs) => {
                const subtitleElement = this.html.find('.subtitle');
                if (subtitleElement.length > 0) {
                    resolve(subtitleElement.text().trim());
                    obs.disconnect();  // Stop observing once the element is found
                }
            });

            const subtitleElement = this.html.find('.subtitle');
            if (subtitleElement.length > 0) {
                resolve(subtitleElement.text().trim());
            } else {
                // Observe for changes if the element isn't available yet
                observer.observe(this.html[0], { childList: true, subtree: true });
            }
        });
    }

    // Determine the card type
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
        } catch (e) {
            console.error(e);
        }
    }

    // Roll attack asynchronously using Promises
    rollAttack() {
        return new Promise((resolve, reject) => {
            try {
                if (this.rollAttackButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
                    const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
                    this.rollAttackButton.dispatchEvent(event);
                    resolve(true);  // Resolve when the attack is rolled
                } else {
                    resolve(false);  // Resolve false if conditions are not met
                }
            } catch (e) {
                reject(e);  // Reject in case of an error
            }
        });
    }

    // Roll damage asynchronously using Promises
    rollDamage() {
        return new Promise((resolve, reject) => {
            try {
                if (this.rollDamageButton && Date.now() - this.createdAt < TIME_LIMIT_MS) {
                    const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
                    this.rollDamageButton.dispatchEvent(event);
                    resolve(true);  // Resolve when the damage is rolled
                } else {
                    resolve(false);  // Resolve false if conditions are not met
                }
            } catch (e) {
                reject(e);  // Reject in case of an error
            }
        });
    }

    // Check roll result asynchronously using Promises
    getRollResult() {
        return new Promise((resolve, reject) => {
            try {
                const rollResult = this.html.find('h4.dice-total').first();
                if (rollResult.hasClass('success')) {
                    console.log("Attack Successful");
                    resolve(true);  // Resolve with success
                } else if (rollResult.hasClass('failure') || rollResult.hasClass('fumble')) {
                    console.log("Attack Failed");
                    resolve(false);  // Resolve with failure
                } else {
                    resolve(null);  // Resolve null if no success or failure is detected
                }
            } catch (e) {
                reject(e);  // Reject in case of an error
            }
        });
    }
}
