async function toggleCombat(event: MouseEvent) {
    console.debug("MouseEvent details:", {
        button: event.button,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey
    });

    // Handle modifier keys
    if (event.shiftKey && game.combat) {
        // Shift+click: Delete the current combat encounter
        await game.combat.delete();
        return;
    }

    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    let combat = game.combat;
    if (!combat) {
        combat = await Combat.create({ scene: canvas.scene?.id });
    }

    if (event.button === 2) { // Right-click
        console.debug("Right-click detected.");
        // Remove selected tokens from combat
        for (const token of selectedTokens) {
            const combatant = token.document.combatant;
            if (combatant) {
                await combatant.delete();
            }
        }
        return;
    }

    if (event.button === 0) { // Left-click
        // Add selected tokens to combat if not already, and roll initiative
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
            }
        }

        if (toRollInitiative.length > 0 && game.combat) {
            const ids = toRollInitiative.map(c => c.id);
            await game.combat.rollInitiative(ids);

            // Begin the combat encounter if not already active
            if (!game.combat.started) {
                await game.combat.startCombat();
            }
        }
    }
}
