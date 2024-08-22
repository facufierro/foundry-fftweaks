// scripts/monksTokenBarExtender/health/hurt.js

const hurt = async (event) => {
    const tokens = canvas.tokens.controlled;
    for (let token of tokens) {
        const actor = token.actor;
        const currentHP = actor.system.attributes.hp.value;
        const maxHP = actor.system.attributes.hp.max;

        let damageValue;

        // Determine damage based on modifier keys
        if (event.altKey) {
            damageValue = 10; // Deal 10 damage
        } else if (event.ctrlKey) {
            damageValue = 1; // Deal 1 damage
        } else if (event.shiftKey) {
            damageValue = Math.floor(maxHP / 2); // Deal half of max HP damage
        } else {
            // No modifier pressed, deal full damage
            damageValue = currentHP; // This will reduce HP to 0
        }

        // Update the HP, ensuring it doesn't go below 0
        await actor.update({ "system.attributes.hp.value": Math.max(currentHP - damageValue, 0) });
    }
};

// Add this line to export the function
export default hurt;
