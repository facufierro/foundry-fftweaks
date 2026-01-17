/**
 * Heal selected tokens by a specified amount or to full health
 * @param amount - The amount to heal. If null/undefined, heals to full health
 */
export async function healTokens(amount?: number): Promise<void> {
    if (!canvas?.tokens) {
        ui.notifications?.warn("Canvas not ready.");
        return;
    }

    const selectedTokens = canvas.tokens.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    await Promise.all(
        selectedTokens.map(async (token) => {
            const actor = (token.document?.actor || token.actor) as any;
            if (!actor?.system?.attributes?.hp) return;

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

            try {
                await actor.update({
                    "system.attributes.hp.value": newHP
                }, { render: false });
            } catch (error) {
                console.error(`FFTweaks | Failed to update ${actor.name}:`, error);
            }
        })
    );
}
