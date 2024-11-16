// path: src/scripts/modules/combat-automation/models/combat.js
import { Card } from "./card.js";
import { CardType } from "./enums.js";

export class Combat {
    constructor() {
        this.cardsMap = new Map();  // Use a Map to store cards by their chat message ID
    }

    // Get card data and handle the card based on its type
    async getCardData(html) {
        let card = new Card(html);
        const messageId = card.id;

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

            // Remove from map
            this.cardsMap.delete(messageId);

            return; // After deleting the activation card, wait for the next cards to be rendered
        }

        // Handle attack and damage cards (after activation card is deleted)
        if (!this.cardsMap.has(messageId)) {
            this.cardsMap.set(messageId, { attackCard: null, damageCard: null });
        }

        const currentCards = this.cardsMap.get(messageId);

        if (card.type === CardType.ATTACK_CARD) {
            console.log("Attack Card detected.");
            currentCards.attackCard = card;
        }

        if (card.type === CardType.DAMAGE_CARD) {
            console.log("Damage Card detected.");
            currentCards.damageCard = card;
        }

        // Ensure both cards (attack and damage) have been rendered before proceeding
        if (currentCards.attackCard && currentCards.damageCard) {
            await this.waitUntilRendered(currentCards.attackCard);
            await this.waitUntilRendered(currentCards.damageCard);

            // Check the attack card result AFTER both cards are rendered to avoid timing issues
            const attackSuccess = await currentCards.attackCard.getRollResult();
            if (!attackSuccess) {
                // If attack failed, delete the damage card
                console.log("Attack failed. Deleting Damage Card...");
                if (currentCards.damageCard) {
                    try {
                        await currentCards.damageCard.delete(); // Delete the damage card if attack failed
                        currentCards.damageCard = null;
                    } catch (err) {
                        console.error(`Failed to delete damage card: ${err}`);
                    }
                }
            }

            // Clean up cards from the map once processing is done
            this.cardsMap.delete(messageId);
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
                console.log("Activation Card detected.");
                break;
            case CardType.ATTACK_CARD:
                console.log("Attack Card detected.");
                break;
            case CardType.DAMAGE_CARD:
                console.log("Damage Card detected.");
                break;
            default:
                console.log("Unknown Card Type.");
        }
    }
}
