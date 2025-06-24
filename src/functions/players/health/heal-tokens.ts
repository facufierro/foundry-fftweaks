/**
 * Heal selected tokens by a specified amount or to full health
 * @param amount - The amount to heal. If null/undefined, heals to full health
 */
async function healTokens(amount?: number): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    for (const token of selectedTokens) {
        const actor = token.actor as any;
        if (!actor) continue;

        const currentHP = actor.system.attributes.hp.value;
        const maxHP = actor.system.attributes.hp.max;
        
        let newHP: number;
        if (amount === undefined || amount === null) {
            // Full heal
            newHP = maxHP;
        } else {
            // Heal by specific amount
            newHP = Math.min(currentHP + amount, maxHP);
        }

        await actor.update({
            "system.attributes.hp.value": newHP
        });
    }

    const healType = amount === undefined || amount === null ? "full health" : `${amount} HP`;
    console.log(`FFTweaks | Healed selected tokens by ${healType}.`);
}
