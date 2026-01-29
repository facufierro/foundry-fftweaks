export function resourceful() {
    (Hooks as any).on("dnd5e.restCompleted", (actor: any, result: { longRest: boolean }) => {
        if (result.longRest && actor.effects.getName("Resourceful")) {
            actor.update({ "system.attributes.inspiration": true });
        }
    });
}
