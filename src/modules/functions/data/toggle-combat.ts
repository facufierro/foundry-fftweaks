async function toggleCombat(event: MouseEvent) {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) return;

    // Ensure there is a combat encounter for this scene
    let combat = game.combat;
    if (!combat) {
        combat = await Combat.create({ scene: canvas.scene?.id });
        ui.notifications.info("Combat encounter created.");
    }

    const toRollInitiative: Combatant[] = [];

    for (const token of selectedTokens) {
        const tokenDocument = token.document;

        if (!tokenDocument.combatant) {
            await tokenDocument.toggleCombatant();

            if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                await tokenDocument.combatant.update({ hidden: true });
            }

            if (tokenDocument.combatant) {
                toRollInitiative.push(tokenDocument.combatant);
            }
        } else {
            await tokenDocument.toggleCombatant();
        }
    }

    if (toRollInitiative.length > 0 && game.combat) {
        const ids = toRollInitiative.map(c => c.id);
        await game.combat.rollInitiative(ids);
    }
}
