namespace FFT {
    export class Functions {
        static healSelectedTokens(event: MouseEvent) {
            const selectedTokens = canvas.tokens?.controlled;
            if (!selectedTokens || selectedTokens.length === 0) {
                ui.notifications?.warn("No tokens selected.");
                return;
            }
            for (const token of selectedTokens) {
                const actor = token.actor as any;

                let healValue = actor.system.attributes.hp.max; // Default: Heal to max HP
                if (event.shiftKey) {
                    healValue = 10;  // Heal by 10 if Shift is pressed
                } else if (event.ctrlKey) {
                    healValue = 5;  // Heal by 5 if Ctrl is pressed
                } else if (event.altKey) {
                    healValue = 1;  // Heal by 1 if Alt is pressed
                }

                actor.update({
                    "system.attributes.hp.value": Math.min(actor.system.attributes.hp.value + healValue, actor.system.attributes.hp.max),
                });
            }
        }

        static hurtSelectedTokens(event: MouseEvent) {
            const selectedTokens = canvas.tokens?.controlled;
            if (!selectedTokens || selectedTokens.length === 0) {
                ui.notifications?.warn("No tokens selected.");
                return;
            }
            for (const token of selectedTokens) {
                const actor = token.actor as any;

                let damageValue = actor.system.attributes.hp.max; // Default: Damage to 0 HP
                if (event.shiftKey) {
                    damageValue = 10; // Damage by 10 if Shift is pressed
                } else if (event.ctrlKey) {
                    damageValue = 5; // Damage by 5 if Ctrl is pressed
                } else if (event.altKey) {
                    damageValue = 1; // Damage by 1 if Alt is pressed
                }

                actor.update({
                    "system.attributes.hp.value": Math.max(actor.system.attributes.hp.value - damageValue, 0),
                });
            }
        }

        static async restSelectedTokens(event: MouseEvent) {
            const selectedTokens = canvas.tokens?.controlled;
            if (!selectedTokens || selectedTokens.length === 0) {
                ui.notifications?.warn("No tokens selected.");
                return;
            }

            for (const token of selectedTokens) {
                const actor = token.actor;
                if (!actor) continue;

                if (event.shiftKey) {
                    if (actor.type === "character" || actor.type === "npc") {
                        await actor.shortRest({ dialog: false });
                    }
                } else {
                    if (actor.type === "character" || actor.type === "npc") {
                        await actor.longRest({ dialog: false, newDay: false });
                    }
                }
            }
        }

        static async toggleCombatState(event: MouseEvent) {
            const selectedTokens = canvas.tokens?.controlled;
            if (!selectedTokens || selectedTokens.length === 0) return;

            for (const token of selectedTokens) {
                const tokenDocument = token.document;
                if (!tokenDocument.combatant) {
                    await tokenDocument.toggleCombatant();

                    if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                        await tokenDocument.combatant.update({ hidden: true });
                    }
                } else {
                    await tokenDocument.toggleCombatant();
                }
            }
        }
        static async createDefaultLevels(start = 0, end = 0, height = 10): Promise<void> {
            const scene = game.scenes?.active;
            if (!scene) return;

            const levels = [];
            for (let i = start; i <= end; i++) {
                levels.push([i * height, (i + 1) * height, `${i}`]);
            }

            await (scene as any).setFlag("levels", "sceneLevels", levels);

            if (confirm("Levels created. Reload the scene now?")) {
                window.location.reload();
            }
        }

    }
}
