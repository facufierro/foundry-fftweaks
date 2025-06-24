/**
 * Spawns all main player tokens in a line at the specified location
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

    // Get main character for each player
    const mainCharacters = players.map(player => {
        // Find the main character (first owned character or character marked as main)
        const ownedActors = game.actors?.filter(actor => 
            actor.ownership[player.id] === 3 // OWNER permission level
        ) || [];
        
        // Prefer character type actors
        const characterActors = ownedActors.filter(actor => actor.type === "character");
        return characterActors.length > 0 ? characterActors[0] : ownedActors[0];
    }).filter(actor => actor != null);

    if (mainCharacters.length === 0) {
        ui.notifications?.warn("No main characters found for players.");
        return;
    }

    // Calculate starting position (center the line on the clicked point)
    const totalWidth = (mainCharacters.length - 1) * spacing;
    const startX = x - (totalWidth / 2);

    // Create tokens for each main character
    const tokenUpdates = [];
    for (let i = 0; i < mainCharacters.length; i++) {
        const actor = mainCharacters[i];
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
        ui.notifications?.info(`Spawned ${tokenUpdates.length} player tokens.`);
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
    
    // Create a one-time click handler using FoundryVTT's Hook system
    let hookId: number;
    
    const handleCanvasClick = async (event: any) => {
        // Remove the hook after first use
        Hooks.off("canvasReady", hookId);
        
        // Get the click position in canvas coordinates
        const transform = canvas.stage?.worldTransform;
        if (!transform) return;
        
        // Calculate world coordinates from screen coordinates
        const rect = (canvas.app?.view as HTMLCanvasElement)?.getBoundingClientRect();
        if (!rect) return;
        
        const x = (event.clientX - rect.left - transform.tx) / transform.a;
        const y = (event.clientY - rect.top - transform.ty) / transform.d;
        
        // Spawn players at the clicked location
        await spawnAllPlayersAtLocation(x, y);
    };
    
    // Add a one-time click listener to the canvas view
    const canvasElement = canvas.app?.view as HTMLCanvasElement;
    if (canvasElement) {
        canvasElement.addEventListener("click", handleCanvasClick, { once: true });
    } else {
        ui.notifications?.error("Canvas not available");
    }
}
