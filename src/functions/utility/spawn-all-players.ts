/**
 * Spawns all assigned player character tokens in a line at the specified location
 * Uses each user's officially assigned character (user.character property)
 * @param x - X coordinate on the canvas
 * @param y - Y coordinate on the canvas
 * @param spacing - Spacing between tokens (default: 120)
 */
async function spawnAllPlayersAtLocation(x: number, y: number, spacing: number = 120): Promise<void> {
    // Get all players (users)
    const players = game.users?.filter(user => !user.isGM) || [];
    
    if (players.length === 0) {
        ui.notifications?.warn("No players found in the game.");
        return;
    }

    // Get the assigned character for each player
    const playerCharacterPairs = players.map(player => ({
        player,
        character: player.character
    }));

    // Get only players with assigned characters
    const playersWithCharacters = playerCharacterPairs.filter(pair => pair.character != null);

    if (playersWithCharacters.length === 0) {
        ui.notifications?.warn("No players have assigned characters to spawn.");
        return;
    }

    const mainCharacters = playersWithCharacters.map(pair => pair.character);

    // Filter out characters that already have tokens on the current scene
    const charactersToSpawn = mainCharacters.filter(actor => {
        const existingToken = canvas.scene?.tokens.find(token => token.actorId === actor.id);
        return !existingToken;
    });

    if (charactersToSpawn.length === 0) {
        ui.notifications?.info("All player characters already have tokens on this scene.");
        return;
    }

    // Calculate starting position (center the line on the clicked point)
    const totalWidth = (charactersToSpawn.length - 1) * spacing;
    const startX = x - (totalWidth / 2);

    // Create tokens for each character that needs spawning
    const tokenUpdates = [];
    for (let i = 0; i < charactersToSpawn.length; i++) {
        const actor = charactersToSpawn[i];
        const tokenX = startX + (i * spacing);
        
        // Get the grid size for proper positioning
        const gridSize = canvas.grid?.size || 100;
        
        // Snap to grid
        const snappedX = Math.round(tokenX / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        
        tokenUpdates.push({
            name: actor.name,
            actorId: actor.id,
            x: snappedX,
            y: snappedY,
            width: actor.prototypeToken.width,
            height: actor.prototypeToken.height,
            texture: {
                src: actor.prototypeToken.texture.src
            },
            disposition: actor.prototypeToken.disposition,
            displayName: actor.prototypeToken.displayName,
            displayBars: actor.prototypeToken.displayBars,
            bar1: actor.prototypeToken.bar1,
            bar2: actor.prototypeToken.bar2
        });
    }

    // Create all tokens at once
    try {
        await canvas.scene?.createEmbeddedDocuments("Token", tokenUpdates);
    } catch (error) {
        console.error("FFTweaks | Error spawning player tokens:", error);
        ui.notifications?.error("Failed to spawn player tokens.");
    }
}

/**
 * Shows a notification and waits for the user to click on the canvas to spawn players
 */
async function waitForCanvasClickToSpawnPlayers(): Promise<void> {
    ui.notifications?.info("Click on the map to spawn all player tokens at that location.");
    
    // Create a one-time click handler
    const handleCanvasClick = async (event: PointerEvent) => {
        // Remove the event listener after first use
        canvasElement.removeEventListener("click", handleCanvasClick);
        
        // Get the click position in world coordinates
        const worldPos = canvas.canvasCoordinatesFromClient({x: event.clientX, y: event.clientY});
        
        // Spawn players at the clicked location
        await spawnAllPlayersAtLocation(worldPos.x, worldPos.y);
    };
    
    // Add a one-time click listener to the canvas view
    const canvasElement = canvas.app?.view as HTMLCanvasElement;
    if (canvasElement) {
        canvasElement.addEventListener("click", handleCanvasClick);
    } else {
        ui.notifications?.error("Canvas not available");
    }
}
