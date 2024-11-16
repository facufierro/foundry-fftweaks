(window as any).FFT.Macros.hurtSelectedTokens = function (event: MouseEvent) {
    canvas.tokens?.controlled.forEach((token) => {
        const actor = (token.actor as any);

        let damageValue = actor.system.attributes.hp.max; // Default: Damage to 0 HP
        if (event.shiftKey) {
            damageValue = 10; // Damage by 10 if Shift is pressed
        } else if (event.ctrlKey) {
            damageValue = 5; // Damage by 5 if Ctrl is pressed
        } else if (event.altKey) {
            damageValue = 1; // Damage by 1 if Alt is pressed
        }

        actor.update({
            "system.attributes.hp.value": Math.max(actor.system.attributes.hp.value - damageValue, 0), // Ensure HP doesn't go below 0
        });
    });
};
