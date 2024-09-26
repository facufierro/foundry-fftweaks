//path: src/scripts/modules/combat-automation/models/combat.js
import { Card } from "./card.js";
import { CardType } from "./enums.js";

export class Combat {
    constructor() {
        console.log("Initializing Combat");
        this.activationCard = null;
        this.attackCard = null;
        this.damageCard = null;
        this.attackResult = null;
    }

    setCardCategory(card) {
        console.log("Setting Card Category");
        switch (card.type) {
            case CardType.ACTIVATION_CARD:
                this.activationCard = card;
                console.log("This is an Activation Card");
                break;
            case CardType.ATTACK_CARD:
                this.attackCard = card;
                console.log("This is an Attack Card");
                break;
            case CardType.DAMAGE_CARD:
                this.damageCard = card;
                console.log("This is a Damage Card");
                break;
        }
    }

    getCardData(html) {
        console.log("Getting Card Data");
        let card = new Card(html);
        this.setCardCategory(card);

        // If it's the activation card, roll both attack and damage
        if (this.activationCard) {
            this.activationCard.rollAttack();
            this.activationCard.rollDamage();
            this.activationCard.delete();
            this.activationCard = null;
        }

        // Wait for the attack card result asynchronously
        if (this.attackCard) {
            this.attackResult = this.attackCard.getRollResult();
        }

        // Defer deletion of damage card until it is rendered and attack result is false
        if (this.attackResult === false) {
            // Wait until the damage card is rendered
            setTimeout(() => {
                if (this.damageCard) {
                    console.log("Deleting Damage Card due to Attack Failure");
                    this.damageCard.delete();
                    this.damageCard = null; // Reset after deletion
                }
            }, 100); // Adjust delay if necessary based on when damage card is rendered
        }
    }
}
