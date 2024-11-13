import * as tokenName from "./utilities/tokenName.js";

export function initialize() {
    Hooks.on("createToken", (tokenDocument) => {
        // tokenName.display(tokenDocument);
        Debug.Success("TEST")
    });
}