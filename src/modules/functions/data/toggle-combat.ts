
export async function toggleCombat(event: MouseEvent) {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) return;

    for (const token of selectedTokens) {
        const tokenDocument = token.document;
        if (!tokenDocument.combatant) {
            await tokenDocument.toggleCombatant();

            if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                await tokenDocument.combatant.update({ hidden: true });
            }
        } else {
            await tokenDocument.toggleCombatant();
        }
    }
}