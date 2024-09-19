export function display(tokenDocument) {
    let token = canvas.tokens.get(tokenDocument.id);

    // Check if the token is a player-owned character
    if (token.actor.hasPlayerOwner && token.actor.type === 'character') {
        token.document.update({
            displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS // Show name for PCs
        });
    } else if (token.actor.type === 'npc') {
        token.document.update({
            displayName: CONST.TOKEN_DISPLAY_MODES.NONE // Hide name for NPCs
        });
    }
}
