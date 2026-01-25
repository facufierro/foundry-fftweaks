/**
 * Add selected tokens to combat, roll initiative, and start combat
 */
export async function addTokensToCombat(): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    // Ensure combat encounter exists
    let combat: Combat | null | undefined = game.combat;
    if (!combat) {
        combat = await Combat.create({ scene: canvas.scene?.id } as any) as unknown as Combat;
        if (combat) await combat.update({ active: true });
    }

    // Add tokens to combat that aren't already in it
    const toRollInitiative: Combatant[] = [];
    let addedCount = 0;
    
    for (const token of selectedTokens) {
        const tokenDocument = token.document;
        if (!tokenDocument.combatant) {
            await tokenDocument.toggleCombatant();
            addedCount++;
            
            // Hide hostile creatures in combat tracker
            if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                await tokenDocument.combatant.update({ hidden: true });
            }
            
            if (tokenDocument.combatant) {
                toRollInitiative.push(tokenDocument.combatant);
            }
        }
    }

    // Roll initiative for new combatants and start combat
    if (toRollInitiative.length > 0 && game.combat) {
        const ids = toRollInitiative.map(c => c.id);
        await game.combat.rollInitiative(ids);

        if (!game.combat.started) {
            await game.combat.startCombat();
        }
        
        console.log(`FFTweaks | Added ${addedCount} token(s) to combat and rolled initiative.`);
    } else if (addedCount === 0) {
        console.log("FFTweaks | All selected tokens are already in combat.");
    }
}
