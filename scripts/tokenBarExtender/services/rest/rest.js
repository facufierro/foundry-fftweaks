// scripts/monksTokenBarExtender/rest/rest.js

const rest = async (event) => {
    const tokens = canvas.tokens.controlled;
    for (let token of tokens) {
        const actor = token.actor;

        if (event.shiftKey) {
            // short rest 
            await actor.shortRest({ dialog: false });
        } else {
            // long rest
            await actor.longRest({ dialog: false, newDay: false });
        }

    }
};

export default rest;
