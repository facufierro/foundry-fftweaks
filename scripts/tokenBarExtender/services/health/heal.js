// scripts/monksTokenBarExtender/health/heal.js

const heal = async (event) => {
    const tokens = canvas.tokens.controlled;
    for (let token of tokens) {
        const actor = token.actor;
        const currentHP = actor.system.attributes.hp.value;
        const maxHP = actor.system.attributes.hp.max;

        let healValue;

        if (event.altKey) {
            healValue = 10; // Heal by 10
        } else if (event.ctrlKey) {
            healValue = 1; // Heal by 1
        } else if (event.shiftKey) {
            healValue = Math.floor(maxHP / 2); // Heal by half of max HP
        } else {
            // No modifier pressed, heal to maximum
            await actor.update({ "system.attributes.hp.value": maxHP });
            continue; // Skip to the next token
        }
        await actor.update({ "system.attributes.hp.value": Math.min(currentHP + healValue, maxHP) });
    }
};

export default heal;
