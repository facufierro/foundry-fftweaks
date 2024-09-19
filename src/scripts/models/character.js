// models/character.js
export class Character {
    constructor(actorId) {
        this.actor = game.actors.get(actorId);
        this.conditions = this.getConditions();
    }

    // Method to get active conditions applied to the actor
    getConditions() {
        const conditions = [];

        // Loop through actor-level active effects
        this.actor.effects.forEach(effect => {
            if (effect.label) {
                conditions.push(effect.label); // Add the condition name (label)
            }
        });

        return conditions;
    }

    // Method to toggle a condition using the token's Active Effect system, with special handling for exhaustion
    async toggleCondition(conditionName, durationRounds = null, exhaustionLevel = null) {
        // Special handling for exhaustion
        if (conditionName === 'exhaustion') {
            const currentExhaustion = this.actor.system.attributes.exhaustion || 0;
            let newExhaustion = exhaustionLevel ?? currentExhaustion + 1;

            // Reset exhaustion to 0 if it exceeds 6
            if (newExhaustion > 6) {
                newExhaustion = 0;
            }

            await this.actor.update({ 'system.attributes.exhaustion': newExhaustion });
            return;
        }

        // Standard condition toggle
        const token = this.actor.getActiveTokens()[0];
        if (!token) return;

        const conditionData = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === conditionName));
        if (!conditionData) return;

        if (durationRounds) conditionData.duration = { rounds: durationRounds };

        await token.document.toggleActiveEffect(conditionData);
    }


    // Method to clear all active conditions and reset exhaustion to 0
    async clearConditions() {
        const token = this.actor.getActiveTokens()[0];
        if (!token) return;

        // Get all valid conditions from CONFIG.statusEffects and clear each from the token
        for (const conditionId of CONFIG.statusEffects.map(e => e.id)) {
            const conditionData = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === conditionId));
            await token.document.toggleActiveEffect(conditionData, { active: false });
        }

        // Reset exhaustion level to 0
        if (this.actor.system.attributes.exhaustion > 0) {
            await this.actor.update({ 'system.attributes.exhaustion': 0 });
        }
    }


}
