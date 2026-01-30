/**
 * Mantle of Inspiration - College of Glamour Bard
 * Rolls Bardic Inspiration die and grants temp HP (2x roll) to targeted creatures
 */
export async function mantleOfInspiration(): Promise<void> {
    const actor = (canvas as any)?.tokens?.controlled?.[0]?.actor;
    if (!actor) {
        ui.notifications?.warn("No token selected as the caster.");
        return;
    }

    const targets = (game.user as any)?.targets as Set<any> | undefined;
    if (!targets?.size) {
        ui.notifications?.warn("No targets selected.");
        return;
    }

    // Get Bardic Inspiration die from scale values
    const dieSize = actor.system.scale?.bard?.inspiration?.die;
    if (!dieSize) {
        ui.notifications?.warn("Actor does not have Bardic Inspiration scale data.");
        return;
    }

    // Roll the die
    const roll = await new Roll(dieSize).evaluate();
    await roll.toMessage({ flavor: "Mantle of Inspiration - Bardic Inspiration" } as any);

    const tempHP = roll.total * 2;

    await Promise.all(
        Array.from(targets).map(async (token: any) => {
            const actor = token.actor;
            if (!actor) return;
            await actor.applyTempHP(tempHP);
        })
    );

    ui.notifications?.info(`Granted ${tempHP} temporary HP to ${targets.size} creature(s).`);
}
