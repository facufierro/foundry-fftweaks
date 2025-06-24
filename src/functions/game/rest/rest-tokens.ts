/**
 * Apply rest to selected tokens
 * @param isLongRest - If true, applies long rest; if false, applies short rest
 */
async function restTokens(isLongRest: boolean): Promise<void> {
    const selectedTokens = canvas.tokens?.controlled.filter(t => t.actor?.hasPlayerOwner);
    if (selectedTokens.length === 0) {
        ui.notifications?.warn("No player tokens selected.");
        return;
    }

    for (const token of selectedTokens) {
        const actor = token.actor as any;
        if (!actor) continue;

        if (isLongRest) {
            // Long rest: restore all HP and spell slots
            const maxHP = actor.system.attributes.hp.max;
            await actor.update({
                "system.attributes.hp.value": maxHP
            });

            // Restore spell slots
            if (actor.system.spells) {
                const spellUpdates: Record<string, any> = {};
                for (const [level, spellData] of Object.entries(actor.system.spells)) {
                    if (typeof spellData === 'object' && spellData !== null && 'max' in spellData) {
                        spellUpdates[`system.spells.${level}.value`] = (spellData as any).max;
                    }
                }
                if (Object.keys(spellUpdates).length > 0) {
                    await actor.update(spellUpdates);
                }
            }
        } else {
            // Short rest: restore some HP and short rest abilities
            const currentHP = actor.system.attributes.hp.value;
            const maxHP = actor.system.attributes.hp.max;
            const healAmount = Math.floor(maxHP * 0.25); // Heal 25% of max HP
            const newHP = Math.min(currentHP + healAmount, maxHP);
            
            await actor.update({
                "system.attributes.hp.value": newHP
            });
        }
    }

    const restType = isLongRest ? "long" : "short";
    console.log(`FFTweaks | Applied ${restType} rest to selected player tokens.`);
}
