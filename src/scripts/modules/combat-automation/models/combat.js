// path: src/scripts/modules/combat-automation/models/combat.js
import { Card } from "./card.js";
import { CardType } from "./enums.js";

export class Combat {
    constructor() {
        this.activationCard = null;
        this.attackCard = null;
        this.damageCard = null;
    }

    // Get card data and handle the card based on its type
    async getCardData(html) {
        let card = new Card(html);

        // Wait for the card to be fully rendered
        await this.waitForCardToRender(card);

        // Set the card category based on the type
        this.setCardCategory(card);

        // Handle activation card: roll attack first, wait for attack card, then roll damage
        if (card.type === CardType.ACTIVATION_CARD) {
            console.log("Handling Activation Card");

            // Roll the attack
            await card.rollAttack();

            // Wait for the attack card to render after the attack roll
            console.log("Waiting for Attack Card to render...");
            while (!this.attackCard?.isRendered) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Check if the attack succeeded
            const result = await this.attackCard.getRollResult();
            if (!result) {
                // If attack fails, delete the damage card if created and exit early
                console.log("Attack failed, deleting Damage Card...");
                if (this.damageCard) {
                    await this.damageCard.delete();
                    this.damageCard = null;
                }
                await card.delete(); // Delete activation card after failure
                this.activationCard = null;
                return;  // Exit early since damage won't be rolled
            }

            // Attack succeeded, now roll damage
            await card.rollDamage();

            // Wait for the damage card to render after the damage roll
            console.log("Waiting for Damage Card to render...");
            while (!this.damageCard?.isRendered) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Delete the activation card
            console.log("Deleting Activation Card...");
            await card.delete();
            this.activationCard = null;
        }

        // Handle attack card separately (if it was created independently)
        if (card.type === CardType.ATTACK_CARD) {
            console.log("Handling standalone Attack Card");

            // Get the result of the attack roll
            const result = await card.getRollResult();

            if (!result) {
                console.log("Attack failed, deleting Damage Card...");
                if (this.damageCard) {
                    await this.damageCard.delete();
                    this.damageCard = null;
                }
            } else {
                console.log("Attack succeeded.");
            }
        }
    }

    // Set the card category based on the type
    setCardCategory(card) {
        switch (card.type) {
            case CardType.ACTIVATION_CARD:
                this.activationCard = card;
                console.log("Activation Card detected.");
                break;
            case CardType.ATTACK_CARD:
                this.attackCard = card;
                console.log("Attack Card detected.");
                break;
            case CardType.DAMAGE_CARD:
                this.damageCard = card;
                console.log("Damage Card detected.");
                break;
            default:
                console.log("Unknown Card Type.");
        }
    }

    // Helper method to wait until the card is fully rendered
    waitForCardToRender(card) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (card && card.isRendered) {
                    clearInterval(interval); // Stop checking once it's rendered
                    resolve(true);
                }
            }, 100); // Check every 100ms if the card is rendered
        });
    }
}
