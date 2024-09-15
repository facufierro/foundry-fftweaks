
enum ActorEffects {
    exhaustion = actor.system.attributes.exhaustion,
}


export function add_effect(actor, effect) {
    const actor_effects = actor.effects;
    if (!actor_effects.includes(effect)) {
        actor_effects.push(effect);
    }
}




let exhaustion = actor.system.attributes.exhaustion || 0;

// Increase exhaustion level by 1, up to a max of 6
if (exhaustion < 6) {
    exhaustion += 1;
    await actor.update({ "system.attributes.exhaustion": exhaustion });
    ui.notifications.info(`${actor.name} is now at exhaustion level ${exhaustion}.`);
} else {
    ui.notifications.info(`${actor.name} is already at maximum exhaustion (level 6).`);
}