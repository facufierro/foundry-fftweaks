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

        // Wait until the card is fully rendered
        await this.waitUntilRendered(card);

        // Set the card category based on the type
        this.setCardCategory(card);

        // Handle activation card: roll attack and damage, then delete activation card
        if (card.type === CardType.ACTIVATION_CARD) {
            console.log("Handling Activation Card");

            // Roll the attack from the activation card (simulate shift-click on attack button)
            await card.rollAttack();

            // Roll the damage from the activation card (simulate shift-click on damage button)
            await card.rollDamage();

            // Once attack and damage are rolled, delete the activation card
            console.log("Deleting Activation Card...");
            await card.delete();
            this.activationCard = null;
            return; // After deleting the activation card, wait for the next cards to be rendered
        }

        // Handle attack and damage cards (after activation card is deleted)
        if (this.activationCard === null) {
            if (card.type === CardType.ATTACK_CARD) {
                console.log("Attack Card detected.");
                this.attackCard = card;
            }

            if (card.type === CardType.DAMAGE_CARD) {
                console.log("Damage Card detected.");
                this.damageCard = card;
            }

            // Wait until both the attack and damage cards are rendered
            if (this.attackCard && this.damageCard) {
                await this.waitUntilRendered(this.attackCard);
                await this.waitUntilRendered(this.damageCard);

                // Now check the attack card result
                const attackSuccess = await this.attackCard.getRollResult();
                if (!attackSuccess) {
                    // If attack failed, delete the damage card
                    console.log("Attack failed. Deleting Damage Card...");
                    if (this.damageCard) {
                        await this.damageCard.delete(); // Delete the damage card if attack failed
                        this.damageCard = null;
                    }
                }
            }
        }
    }

    // Helper function to wait until a card is rendered
    async waitUntilRendered(card) {
        while (!card?.isRendered) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to wait until it's rendered
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
}
