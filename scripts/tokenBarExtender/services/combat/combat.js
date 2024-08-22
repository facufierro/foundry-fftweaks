// scripts/monksTokenBarExtender/combat/combat.js

const combat = async (event) => {
    const tokens = canvas.tokens.controlled;
    let combat = game.combat;
    if (!combat) {
        // Create a new combat encounter
        combat = await Combat.create({ scene: game.scenes.viewed.id });
    }
    for (let token of tokens) {
        // Check if the token is already in combat
        if (!combat.combatants.find(c => c.tokenId === token.id)) {
            await combat.createEmbeddedDocuments("Combatant", [{ tokenId: token.id }]);
        }
        // Get the combatant associated with the token
        let combatant = combat.combatants.find(c => c.tokenId === token.id);

        // Check if the token is an enemy and hide the combatant if so
        if (token.document.disposition === -1) { // Disposition -1 is for hostile tokens
            await combatant.update({ hidden: true });
        }

        // Roll initiative if the combatant doesn't have an initiative value
        if (combatant && combatant.initiative === null) {
            await combatant.rollInitiative();
        }

    }
    // Make the combat encounter active if it isn't already
    if (!combat.active) {
        await combat.startCombat();
    }
};

export default combat;
