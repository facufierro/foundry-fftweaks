async function selectAllPlayers(): Promise<void> {
    // Get all tokens on the current scene
    const allTokens = canvas.tokens?.placeables;
    if (!allTokens || allTokens.length === 0) {
        ui.notifications?.warn("No tokens found on the scene.");
        return;
    }

    // Filter for player-owned tokens
    const playerTokens = allTokens.filter(token => {
        const actor = token.actor;
        return actor && actor.hasPlayerOwner;
    });

    if (playerTokens.length === 0) {
        ui.notifications?.warn("No player tokens found on the scene.");
        return;
    }

    // Clear current selection and select all player tokens
    canvas.tokens?.releaseAll();
    
    // Select all player tokens
    for (const token of playerTokens) {
        token.control({ releaseOthers: false });
    }

    // Notify the user
    ui.notifications?.info(`Selected ${playerTokens.length} player token${playerTokens.length === 1 ? '' : 's'}.`);
}