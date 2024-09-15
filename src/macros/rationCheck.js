function findPlayerTokensOnScene() {
    return playerTokens = canvas.tokens.placeables.filter(token => token.actor?.hasPlayerOwner);
}

function manageRationsForAllPlayerTokens() {
    const playerTokens = findPlayerTokensOnScene();
    let actors = [];
    playerTokens.forEach(token => {

        if (actors.includes(token.actor)) {
            return;
        } else {
            actors.push(token.actor);
        }

        const rationItem = actor.items.find(i => i.name.toLowerCase().includes("ration"));
        const quantity = rationItem?.system?.quantity || 0;

        if (rationItem && quantity > 0) {
            // Reduce rations by 1
            rationItem.update({ 'system.quantity': quantity - 1 });
            message += `${actor.name} consumed 1 ration. (${quantity - 1} left)\n`;
        } else {
            // Add 1 level of exhaustion from the existing dnd5e effects list
            const exhaustion = game.dnd5e.config.conditionTypes.exhaustion;



            message += `${actor.name} has no rations and gained 1 level of exhaustion.\n`;
        }
    });

    ui.notifications.info(message.trim());
}

// Set up a daily check for rations and exhaustion
if (game.rationCheckEventId) {
    game.Gametime.clearTimeout(game.rationCheckEventId);
    ui.notifications.info("Previous ration check event cleared.");
}

game.rationCheckEventId = game.Gametime.doEvery({ days: 1 }, () => {
    manageRationsForAllPlayerTokens();
    ui.notifications.info("Ration management executed for all player tokens.");
});
