// models/character.js
import { Item } from './item.js';  // Import the Item class
export class Character {
    constructor(actorId) {
        this.actor = game.actors.get(actorId);
    }

    getHP() {
        return this.actor.system.attributes.hp.value;
    }

    async setHP(newHP) {
        await this.actor.update({ 'system.attributes.hp.value': newHP });
        ui.notifications.info(`${this.actor.name}'s HP changed to: ${newHP}`);
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
        // Special case for exhaustion
        if (conditionName === 'exhaustion') {
            const currentExhaustion = this.actor.system.attributes.exhaustion || 0;

            const newExhaustionLevel = exhaustionLevel !== null ? exhaustionLevel : currentExhaustion + 1;

            if (newExhaustionLevel > 6) {
                ui.notifications.warn(`${this.actor.name} is already at maximum exhaustion level.`);
            } else if (newExhaustionLevel < 0) {
                ui.notifications.warn(`${this.actor.name}'s exhaustion cannot be less than 0.`);
            } else {
                await this.actor.update({ 'system.attributes.exhaustion': newExhaustionLevel });
                ui.notifications.info(`${this.actor.name}'s exhaustion level set to ${newExhaustionLevel}.`);
            }
            return;
        }

        // For other conditions, use the standard toggle method
        const token = this.actor.getActiveTokens()[0];

        if (!token) {
            ui.notifications.error(`${this.actor.name} does not have an active token.`);
            return;
        }

        // Find the condition in the CONFIG.statusEffects (D&D 5e default conditions)
        const conditionData = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === conditionName));

        if (!conditionData) {
            ui.notifications.error(`${conditionName} is not a valid condition.`);
            return;
        }

        // Optionally set a duration for the condition (in rounds)
        if (durationRounds) {
            conditionData.duration = { rounds: durationRounds };
        }

        // Toggle the condition on the token
        await token.document.toggleActiveEffect(conditionData);

        ui.notifications.info(`${this.actor.name} toggled the condition: ${conditionName}`);
    }

    // Method to clear all active conditions and reset exhaustion to 0
    async clearConditions() {
        const token = this.actor.getActiveTokens()[0];

        if (!token) {
            ui.notifications.error(`${this.actor.name} does not have an active token.`);
            return;
        }

        // Get all valid conditions from CONFIG.statusEffects
        const conditions = CONFIG.statusEffects.map(e => e.id);

        // Iterate through each condition and clear it from the token
        for (const conditionId of conditions) {
            const conditionData = foundry.utils.deepClone(CONFIG.statusEffects.find(e => e.id === conditionId));
            await token.document.toggleActiveEffect(conditionData, { active: false });
        }

        // Reset exhaustion level to 0
        if (this.actor.system.attributes.exhaustion > 0) {
            await this.actor.update({ 'system.attributes.exhaustion': 0 });
            ui.notifications.info(`${this.actor.name}'s exhaustion level has been reset to 0.`);
        }

        ui.notifications.info(`${this.actor.name}'s conditions have been cleared.`);
    }
    // Method to get only inventory items (weapons, armor, consumables, equipment, etc.)
    getInventory() {
        const items = this.actor.items;
        const inventory = [];

        // Define the types of items we consider part of the inventory
        const inventoryTypes = ['weapon', 'armor', 'consumable', 'equipment', 'tool', 'loot', 'backpack'];

        // Loop through the items collection and only return relevant inventory types
        items.forEach(item => {
            if (inventoryTypes.includes(item.type)) {
                inventory.push(new Item(item));  // Push each relevant Item class instance into the array
            }
        });

        return inventory;  // Return the array of filtered Item instances
    }
}
