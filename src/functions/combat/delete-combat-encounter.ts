/**
 * Delete the current combat encounter
 */
export async function deleteCombatEncounter(): Promise<void> {
    if (!game.combat) {
        ui.notifications?.warn("No active combat encounter to delete.");
        return;
    }
    
    await game.combat.delete();
    console.log("FFTweaks | Combat encounter deleted.");
}
