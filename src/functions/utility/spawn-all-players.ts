/**
 * Spawns all assigned player character tokens in a line at the specified location
 * Uses each user's officially assigned character (user.character property)
 * @param x - X coordinate on the canvas
 * @param y - Y coordinate on the canvas
 * @param spacing - Spacing between tokens (default: 120)
 * @param teleportExisting - If true, also teleport existing tokens to the new location
 */
async function spawnAllPlayersAtLocation(x: number, y: number, spacing: number = 120, teleportExisting: boolean = false): Promise<void> {
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

    // Separate existing tokens from characters that need spawning
    const existingTokens = [];
    const charactersToSpawn = [];
    
    for (const actor of mainCharacters) {
        const existingToken = canvas.scene?.tokens.find(token => token.actorId === actor.id);
        if (existingToken) {
            existingTokens.push(existingToken);
        } else {
            charactersToSpawn.push(actor);
        }
    }

    // If teleportExisting is false and all characters already have tokens, do nothing
    if (!teleportExisting && charactersToSpawn.length === 0) {
        ui.notifications?.info("All player characters already have tokens on this scene.");
        return;
    }

    // Calculate total number of tokens to position
    const totalTokens = teleportExisting ? mainCharacters.length : charactersToSpawn.length;

    // Calculate starting position (center the line on the clicked point)
    const totalWidth = (totalTokens - 1) * spacing;
    const startX = x - (totalWidth / 2);

    // Handle existing tokens (teleport if requested)
    if (teleportExisting && existingTokens.length > 0) {
        const tokenUpdates = [];
        let tokenIndex = 0;
        
        for (const actor of mainCharacters) {
            const existingToken = existingTokens.find(token => token.actorId === actor.id);
            if (existingToken) {
                const tokenX = startX + (tokenIndex * spacing);
                const gridSize = canvas.grid?.size || 100;
                const snappedX = Math.round(tokenX / gridSize) * gridSize;
                const snappedY = Math.round(y / gridSize) * gridSize;
                
                tokenUpdates.push({
                    _id: existingToken.id,
                    x: snappedX,
                    y: snappedY
                });
                tokenIndex++;
            }
        }
        
        if (tokenUpdates.length > 0) {
            try {
                await canvas.scene?.updateEmbeddedDocuments("Token", tokenUpdates);
            } catch (error) {
                console.error("FFTweaks | Error teleporting existing tokens:", error);
            }
        }
    }

    // Create tokens for characters that need spawning
    const newTokenUpdates = [];
    let spawnIndex = teleportExisting ? 0 : 0;
    
    for (const actor of mainCharacters) {
        // Skip if token already exists and we're not teleporting
        const existingToken = existingTokens.find(token => token.actorId === actor.id);
        if (existingToken && !teleportExisting) {
            continue;
        }
        
        // Skip if token already exists and we are teleporting (already handled above)
        if (existingToken && teleportExisting) {
            spawnIndex++;
            continue;
        }
        
        const tokenX = startX + (spawnIndex * spacing);
        const gridSize = canvas.grid?.size || 100;
        const snappedX = Math.round(tokenX / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        
        newTokenUpdates.push({
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
        spawnIndex++;
    }

    // Create new tokens
    if (newTokenUpdates.length > 0) {
        try {
            await canvas.scene?.createEmbeddedDocuments("Token", newTokenUpdates);
        } catch (error) {
            console.error("FFTweaks | Error spawning player tokens:", error);
            ui.notifications?.error("Failed to spawn player tokens.");
        }
    }
}

/**
 * Shows a notification and waits for the user to click on the canvas to spawn players
 * Left-click: spawn missing player tokens only
 * Right-click: teleport existing tokens and spawn missing ones
 */
async function waitForCanvasClickToSpawnPlayers(): Promise<void> {
    ui.notifications?.info("Left-click: spawn missing players | Right-click: teleport existing + spawn missing");
    
    // Create click handlers for both left and right clicks
    const handleCanvasClick = async (event: PointerEvent) => {
        // Prevent default right-click context menu
        if (event.button === 2) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Remove the event listeners after first use
        canvasElement.removeEventListener("click", handleCanvasClick);
        canvasElement.removeEventListener("contextmenu", handleCanvasClick);
        
        // Get the click position in world coordinates
        const worldPos = canvas.canvasCoordinatesFromClient({x: event.clientX, y: event.clientY});
        
        // Determine if this is a right-click (teleport existing + spawn missing)
        const teleportExisting = event.button === 2;
        
        // Spawn players at the clicked location
        await spawnAllPlayersAtLocation(worldPos.x, worldPos.y, 120, teleportExisting);
    };
    
    // Add click listeners to the canvas view
    const canvasElement = canvas.app?.view as HTMLCanvasElement;
    if (canvasElement) {
        canvasElement.addEventListener("click", handleCanvasClick);
        canvasElement.addEventListener("contextmenu", handleCanvasClick);
    } else {
        ui.notifications?.error("Canvas not available");
    }
}
