/**
 * Apply rest to selected tokens
 * @param isLongRest - If true, applies long rest; if false, applies short rest
 */
async function restTokens(isLongRest: boolean): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled.filter(t => t.actor?.hasPlayerOwner);
    if (selectedTokens.length === 0) {
        ui.notifications?.warn("No player tokens selected.");
        return;
    }

    for (const token of selectedTokens) {
        const actor = token.actor as any;
        if (!actor) continue;

        if (isLongRest) {
            // Use D&D 5e's built-in long rest method which handles chat messages
            if (actor.type === "character" || actor.type === "npc") {
                await actor.longRest({ dialog: false, newDay: false });
            }
        } else {
            // Use D&D 5e's built-in short rest method which handles chat messages
            if (actor.type === "character" || actor.type === "npc") {
                await actor.shortRest({ dialog: false });
            }
        }
    }

    const restType = isLongRest ? "long" : "short";
    console.log(`FFTweaks | Applied ${restType} rest to selected player tokens.`);
}
