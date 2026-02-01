export function jackOfAllTrades() {
    (Hooks as any).on("dnd5e.useItem", (i: any) => i.name === "Jack of All Trades" && i.actor?.setFlag("fftweaks", "joat", true));
    (Hooks as any).on("dnd5e.postUseActivity", (a: any) => a.item?.name === "Jack of All Trades" && a.actor?.setFlag("fftweaks", "joat", true));

    const handle = (c: any) => {
        const a = c.subject;
        if (!a?.getFlag?.("fftweaks", "joat") || c._joat) return;

        if ((c.skill && a.system.skills[c.skill]?.value < 1) || (!c.skill && c.ability)) {
            c._joat = true;
            const b = Math.floor((a.system.attributes.prof ?? 0) / 2);
            const r = (c.rolls = c.rolls || [{}])[0];
            (r.parts = r.parts || []).push(`${b}`);
            a.unsetFlag("fftweaks", "joat");
            ui.notifications?.info(`Jack of All Trades (+${b})`);
        }
    };

    (Hooks as any).on("dnd5e.preRollSkill", handle);
    (Hooks as any).on("dnd5e.preRollAbilityCheck", handle);
}