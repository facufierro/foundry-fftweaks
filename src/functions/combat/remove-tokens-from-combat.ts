/**
 * Remove selected tokens from combat
 */
export async function removeTokensFromCombat(): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    if (!game.combat) {
        ui.notifications?.warn("No active combat encounter.");
        return;
    }

    console.debug("Removing tokens from combat.");
    let removedCount = 0;
    
    for (const token of selectedTokens) {
        const combatant = token.document.combatant;
        if (combatant) {
            await combatant.delete();
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        console.log(`FFTweaks | Removed ${removedCount} token(s) from combat.`);
    } else {
        ui.notifications?.warn("No selected tokens were in combat.");
    }
}
