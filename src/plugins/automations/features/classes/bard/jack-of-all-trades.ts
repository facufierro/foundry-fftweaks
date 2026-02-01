export function jackOfAllTrades() {
    const SCOPE = "fftweaks";
    const FLAG = "jackOfAllTradesActive";

    const activate = async (actor: any) => {
        if (!actor) return;
        await actor.setFlag(SCOPE, FLAG, true);
        ui.notifications?.info("Jack of All Trades ready.");
    };

    (Hooks as any).on("dnd5e.useItem", (item: any) => {
        if (item.name === "Jack of All Trades") activate(item.actor);
    });

    (Hooks as any).on("dnd5e.postUseActivity", (activity: any) => {
        if (activity.item?.name === "Jack of All Trades") activate(activity.actor);
    });

    const onPreRoll = (config: any) => {
        const actor = config.subject;
        if (!actor?.getFlag?.(SCOPE, FLAG) || config._fft_joat) return;

        let proficient = false;
        if (config.skill) {
            proficient = actor.system.skills[config.skill]?.value >= 1;
        } else if (config.ability && config.hookNames?.includes("abilityCheck")) {
            proficient = false;
        } else {
            return;
        }

        if (!proficient) {
            const bonus = Math.floor((actor.system.attributes.prof ?? 0) / 2);
            if (bonus > 0) {
                config._fft_joat = true;
                config.rolls = config.rolls || [{}];
                const roll = config.rolls[0];
                roll.parts = roll.parts || [];
                roll.parts.push(`${bonus}`);

                actor.unsetFlag(SCOPE, FLAG);
                ui.notifications?.info(`Jack of All Trades applied (+${bonus})!`);
            }
        }
    };

    (Hooks as any).on("dnd5e.preRollSkill", onPreRoll);
    (Hooks as any).on("dnd5e.preRollAbilityCheck", onPreRoll);
}
