/**
 * Hurt selected tokens by a specified amount or kill them
 * @param amount - The amount to hurt. If null/undefined, kills the tokens (sets HP to 0)
 */
async function hurtTokens(amount?: number): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    for (const token of selectedTokens) {
        const actor = token.actor as any;
        if (!actor) continue;

        const currentHP = actor.system.attributes.hp.value;
        
        let newHP: number;
        if (amount === undefined || amount === null) {
            // Kill
            newHP = 0;
        } else {
            // Hurt by specific amount
            newHP = Math.max(currentHP - amount, 0);
        }

        await actor.update({
            "system.attributes.hp.value": newHP
        });
    }

    const hurtType = amount === undefined || amount === null ? "killed" : `hurt by ${amount} HP`;
    console.log(`FFTweaks | ${hurtType} selected tokens.`);
}
