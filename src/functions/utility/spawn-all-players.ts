/**
 * Spawns all assigned player character tokens in a square formation at the specified location
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

    // Calculate total number of tokens to position (only those with assigned characters)
    const totalTokens = teleportExisting ? mainCharacters.length : charactersToSpawn.length;

    // Calculate square formation dimensions
    const gridCols = Math.ceil(Math.sqrt(totalTokens));
    const gridRows = Math.ceil(totalTokens / gridCols);
    
    // Calculate starting position (center the square on the clicked point)
    const totalWidth = (gridCols - 1) * spacing;
    const totalHeight = (gridRows - 1) * spacing;
    const startX = x - (totalWidth / 2);
    const startY = y - (totalHeight / 2);

    // Helper function to check if a position is occupied by any token
    const isPositionOccupied = (checkX: number, checkY: number, gridSize: number) => {
        const tolerance = gridSize * 0.1; // 10% tolerance for grid alignment
        return canvas.scene?.tokens.some(token => 
            Math.abs(token.x - checkX) < tolerance && Math.abs(token.y - checkY) < tolerance
        ) || false;
    };

    // Helper function to find next available position
    const findAvailablePosition = (preferredX: number, preferredY: number, gridSize: number) => {
        const snappedX = Math.round(preferredX / gridSize) * gridSize;
        const snappedY = Math.round(preferredY / gridSize) * gridSize;
        
        // If preferred position is free, use it
        if (!isPositionOccupied(snappedX, snappedY, gridSize)) {
            return { x: snappedX, y: snappedY };
        }
        
        // Search in expanding spiral for free space
        for (let radius = 1; radius <= 10; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Only check positions on the perimeter of the current radius
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const testX = snappedX + (dx * gridSize);
                        const testY = snappedY + (dy * gridSize);
                        if (!isPositionOccupied(testX, testY, gridSize)) {
                            return { x: testX, y: testY };
                        }
                    }
                }
            }
        }
        
        // Fallback to original position if no free space found
        return { x: snappedX, y: snappedY };
    };

    // Handle existing tokens (teleport if requested)
    if (teleportExisting && existingTokens.length > 0) {
        const tokenUpdates = [];
        let tokenIndex = 0;
        
        for (const actor of mainCharacters) {
            const existingToken = existingTokens.find(token => token.actorId === actor.id);
            if (existingToken) {
                // Calculate grid position
                const row = Math.floor(tokenIndex / gridCols);
                const col = tokenIndex % gridCols;
                const tokenX = startX + (col * spacing);
                const tokenY = startY + (row * spacing);
                
                const gridSize = canvas.grid?.size || 100;
                const position = findAvailablePosition(tokenX, tokenY, gridSize);
                
                tokenUpdates.push({
                    _id: existingToken.id,
                    x: position.x,
                    y: position.y
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
    const occupiedPositions = new Set(); // Track positions we're about to occupy
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
        
        // Calculate grid position
        const row = Math.floor(spawnIndex / gridCols);
        const col = spawnIndex % gridCols;
        const tokenX = startX + (col * spacing);
        const tokenY = startY + (row * spacing);
        
        const gridSize = canvas.grid?.size || 100;
        let position = findAvailablePosition(tokenX, tokenY, gridSize);
        
        // Check if we're about to place another token at this position
        const positionKey = `${position.x},${position.y}`;
        let attempts = 0;
        while (occupiedPositions.has(positionKey) && attempts < 20) {
            // Find alternative position by offsetting slightly
            const offsetX = tokenX + ((attempts % 4 - 1.5) * gridSize);
            const offsetY = tokenY + (Math.floor(attempts / 4 - 1.5) * gridSize);
            position = findAvailablePosition(offsetX, offsetY, gridSize);
            const newPositionKey = `${position.x},${position.y}`;
            if (!occupiedPositions.has(newPositionKey)) {
                break;
            }
            attempts++;
        }
        
        occupiedPositions.add(`${position.x},${position.y}`);
        
        newTokenUpdates.push({
            name: actor.name,
            actorId: actor.id,
            x: position.x,
            y: position.y,
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
