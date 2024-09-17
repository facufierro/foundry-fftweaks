import * as Roll from '../models/AttackCard.js';
import * as Hit from '../models/AttackHitCard.js';
import * as Damage from '../models/AttackDamageCard.js';

export class AttackManager {
    constructor(html) {
        this.attackRollCard = new Roll.AttackRollCard(html);
        this.attackDamageCard = new Damage.AttackDamageCard(html);
    }

    attack() {
        this.attackRoll.clickAttackButton();
        this.attackHitCard = new Hit.AttackHitCard(html);


    }

}