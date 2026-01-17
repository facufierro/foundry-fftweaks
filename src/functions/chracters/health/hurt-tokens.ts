/**
 * Hurt selected tokens by a specified amount or kill them
 * @param amount - The amount to hurt. If null/undefined, kills the tokens (sets HP to 0)
 */
export async function hurtTokens(amount?: number): Promise<void> {
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
            
            let newHP: number;
            if (amount === undefined || amount === null) {
                // Kill
                newHP = 0;
            } else {
                // Hurt by specific amount
                newHP = Math.max(currentHP - amount, 0);
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
