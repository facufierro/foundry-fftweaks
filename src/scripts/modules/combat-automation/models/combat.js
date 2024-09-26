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
    getCardData(html) {
        let card = new Card(html);
        console.log(card.type);
        // If it's the activation card, roll both attack and damage
        if (this.activationCard) {
            this.activationCard.rollAttack();
            this.activationCard.rollDamage();
            this.activationCard.delete();
            this.activationCard = null;
        }
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



}
