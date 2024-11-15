(window as any).FFT.Macros.healSelectedTokens = function (event: MouseEvent) {
    canvas.tokens?.controlled.forEach((token) => {
        const actor = (token.actor as any);

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
    });
};
