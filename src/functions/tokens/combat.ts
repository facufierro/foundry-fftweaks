(window as any).FFT.Functions.toggleCombatState = async function (event: MouseEvent) {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) return;

    for (const token of selectedTokens) {
        const tokenDocument = token.document; // Access the TokenDocument
        if (!tokenDocument.combatant) {
            // Add token to combat
            await tokenDocument.toggleCombatant();

            // Hide the token in the combat tracker if it is hostile
            if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                await tokenDocument.combatant.update({ hidden: true });
            }
        } else {
            // Remove token from combat
            await tokenDocument.toggleCombatant();
        }
    }
};
