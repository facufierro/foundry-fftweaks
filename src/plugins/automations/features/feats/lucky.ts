export function lucky() {
    const handle = async (config: any, dialog: any, message: any) => {
        const actor = config.subject;
        if (!actor) return;

        const luckyEffect = actor.appliedEffects.find((e: any) => e.name === "Lucky");
        const unluckyEffect = actor.appliedEffects.find((e: any) => e.name === "Unlucky");

        if (luckyEffect) {
            config.advantage = true;
            await luckyEffect.delete();
        }

        if (unluckyEffect) {
            config.disadvantage = true;
            await unluckyEffect.delete();
        }
    };

    (Hooks as any).on("dnd5e.preRollAttack", handle);
    (Hooks as any).on("dnd5e.preRollAbilityCheck", handle);
    (Hooks as any).on("dnd5e.preRollSkill", handle);
    (Hooks as any).on("dnd5e.preRollSave", handle);
    (Hooks as any).on("dnd5e.preRollToolCheck", handle);
}
