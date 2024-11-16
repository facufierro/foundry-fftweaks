(window as any).FFT.Functions.restSelectedTokens = async function (event: MouseEvent) {
    const selectedTokens = canvas.tokens?.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
        return;
    }

    for (const token of selectedTokens) {
        const actor = token.actor;
        if (!actor) continue;

        if (event.shiftKey) {
            // Shift key: Perform a Short Rest
            if (actor.type === "character" || actor.type === "npc") {
                await actor.shortRest({ dialog: false });
            }
        } else {
            // Default: Perform a Long Rest
            if (actor.type === "character" || actor.type === "npc") {
                await actor.longRest({ dialog: false, newDay: false });
            }
        }
    }
};
