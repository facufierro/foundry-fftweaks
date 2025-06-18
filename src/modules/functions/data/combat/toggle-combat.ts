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

    // Right-click: Remove selected tokens from combat if an encounter exists
    if (event.button === 2) {
        if (!game.combat) {
            console.debug("Right-click ignored: No active combat.");
            return;
        }
        console.debug("Right-click detected: Removing tokens from combat.");
        for (const token of selectedTokens) {
            const combatant = token.document.combatant;
            if (combatant) {
                await combatant.delete();
            }
        }
        return;
    }

    // Left-click: Add selected tokens to combat if not already, roll initiative, and start combat
    if (event.button === 0) {
        let combat = game.combat;
        if (!combat) {
            combat = await Combat.create({ scene: canvas.scene?.id });
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
            }
        }

        if (toRollInitiative.length > 0 && game.combat) {
            const ids = toRollInitiative.map(c => c.id);
            await game.combat.rollInitiative(ids);

            if (!game.combat.started) {
                await game.combat.startCombat();
            }
        }
    }
}
