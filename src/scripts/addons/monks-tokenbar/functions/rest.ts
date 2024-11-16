(window as any).FFT.Macros.restSelectedTokens = async function (event: MouseEvent) {
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
                await actor.longRest(); // Replace with shortRest when applicable
                ui.notifications?.info(`${actor.name} has completed a Short Rest.`);
            }
        } else {
            // Default: Perform a Long Rest
            if (actor.type === "character" || actor.type === "npc") {
                await actor.longRest();
                ui.notifications?.info(`${actor.name} has completed a Long Rest.`);
            }
        }
    }
};
