export function initialize(tokenDocument) {
    let token = canvas.tokens.get(tokenDocument.id);
    if (token.actor.hasPlayerOwner) {
        // Set the nameplate to always be visible for player-linked tokens
        token.document.update({
            displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS
        });
    }
}