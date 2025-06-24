/**
 * Delete the current combat encounter
 */
async function deleteCombatEncounter(): Promise<void> {
    if (!game.combat) {
        ui.notifications?.warn("No active combat encounter to delete.");
        return;
    }
    
    await game.combat.delete();
    console.log("FFTweaks | Combat encounter deleted.");
}

/**
 * Reset the current combat encounter (preserve combatants and initiatives)
 */
async function resetCombatEncounter(): Promise<void> {
    if (!game.combat) {
        ui.notifications?.warn("No active combat encounter to reset.");
        return;
    }

    const currentCombat = game.combat;
    
    // Store all combatants and their exact initiative values
    const combatantData: Array<{
        tokenId: string;
        actorId: string;
        initiative: number;
        hidden: boolean;
        name: string;
        img: string;
        defeated: boolean;
    }> = [];

    for (const combatant of currentCombat.combatants) {
        combatantData.push({
            tokenId: combatant.tokenId,
            actorId: combatant.actorId,
            initiative: combatant.initiative,
            hidden: combatant.hidden,
            name: combatant.name,
            img: combatant.img,
            defeated: combatant.defeated
        });
    }

    if (combatantData.length === 0) {
        ui.notifications?.warn("No combatants found in the current encounter.");
        return;
    }

    // Delete the current combat encounter
    await currentCombat.delete();

    // Create a new combat encounter
    const newCombat = await Combat.create({
        scene: canvas.scene?.id,
        active: true
    });

    if (!newCombat) {
        ui.notifications?.error("Failed to create new combat encounter.");
        return;
    }

    // Prepare combatant creation data
    const newCombatantData = combatantData.map(data => ({
        tokenId: data.tokenId,
        actorId: data.actorId,
        initiative: data.initiative,
        hidden: data.hidden,
        name: data.name,
        img: data.img,
        defeated: data.defeated
    }));

    // Add all combatants back with their stored initiatives
    const createdCombatants = await newCombat.createEmbeddedDocuments("Combatant", newCombatantData);

    if (!createdCombatants || createdCombatants.length === 0) {
        ui.notifications?.error("Failed to recreate combatants.");
        return;
    }

    // Begin the encounter
    await newCombat.startCombat();

    console.log(`FFTweaks | Combat encounter reset with ${createdCombatants.length} combatants restored.`);
}

/**
 * Remove selected tokens from combat
 */
async function removeTokensFromCombat(): Promise<void> {
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

/**
 * Add selected tokens to combat, roll initiative, and start combat
 */
async function addTokensToCombat(): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    // Ensure combat encounter exists
    let combat = game.combat;
    if (!combat) {
        combat = await Combat.create({ scene: canvas.scene?.id });
        await combat.update({ active: true });
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
        await game.combat.rollInitiative(ids, { 
            messageOptions: { 
                rollMode: "gmroll" 
            }
        });

        if (!game.combat.started) {
            await game.combat.startCombat();
        }
        
        console.log(`FFTweaks | Added ${addedCount} token(s) to combat and rolled initiative.`);
    } else if (addedCount === 0) {
        console.log("FFTweaks | All selected tokens are already in combat.");
    }
}

/**
 * Main entry point for combat toggle functionality
 * Routes actions based on mouse button and modifier keys
 */
async function toggleCombat(event: MouseEvent): Promise<void> {
    console.debug("Combat action triggered:", {
        button: event.button,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey
    });

    // Route to appropriate action based on input
    if (event.shiftKey) {
        await deleteCombatEncounter();
    } else if (event.altKey) {
        await resetCombatEncounter();
    } else if (event.button === 2) {
        await removeTokensFromCombat();
    } else if (event.button === 0) {
        await addTokensToCombat();
    }
}
