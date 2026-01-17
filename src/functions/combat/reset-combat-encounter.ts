/**
 * Reset the current combat encounter (preserve combatants and initiatives)
 */
export async function resetCombatEncounter(): Promise<void> {
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
