(window as any).FFT.Macros.hurtSelectedTokens = async function () {
    canvas.tokens?.controlled.forEach((token) => {
        const actor = (token.actor as any);
        if (actor?.system?.attributes?.hp) {
            actor.update({
                "system.attributes.hp.value": 0
            });
        }
    });
};
