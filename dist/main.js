/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />
// Initialize FFT.Macros first
window.FFT = window.FFT || {};
window.FFT.Addons = window.FFT.Addons || {};
window.FFT.Macros = window.FFT.Macros || {};
// Initialize MonksTokenbar after macros are set
Hooks.once("ready", () => {
    FFT.Addons.MonksTokenbar.initialize();
});
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var FFT;
(function (FFT) {
    var Addons;
    (function (Addons) {
        class MonksTokenbar {
            // Initialize and observe token bar
            static initialize() {
                const setupTokenBar = () => {
                    const tokenBar = document.getElementById('tokenbar-controls');
                    if (tokenBar) {
                        clearInterval(interval);
                        this.populateTokenbar();
                        // Observe DOM for changes
                        new MutationObserver(() => {
                            if (!document.querySelector('[id^="custom-tokenbar-row"]'))
                                this.populateTokenbar();
                        }).observe(document.body, { childList: true, subtree: true });
                    }
                };
                const interval = setInterval(setupTokenBar, 100);
            }
            // Fetch button data
            static fetchButtonData() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const response = yield fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                        if (!response.ok)
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        return yield response.json();
                    }
                    catch (error) {
                        FFT.Debug.Error("Failed to fetch button data:", error);
                        return {};
                    }
                });
            }
            // Create a button element
            static createButton(id, button) {
                return FFT.UI.createButton({
                    id,
                    classes: ['control-icon'],
                    icon: button.icon,
                    tooltip: button.name,
                    onClick: () => this.runScript(button.script), // Call the function via script name
                });
            }
            // Run a global function
            static runScript(script) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    try {
                        // Locate the function in the global namespace
                        const func = script.split('.').reduce((obj, key) => obj === null || obj === void 0 ? void 0 : obj[key], window);
                        if (typeof func === "function") {
                            yield func();
                        }
                        else {
                            // Show a notification if the function is not found
                            (_a = ui.notifications) === null || _a === void 0 ? void 0 : _a.warn(`Function "${script}" not implemented.`);
                        }
                    }
                    catch (error) {
                        (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.warn(`Failed to execute function "${script}".`);
                        FFT.Debug.Error(`Failed to execute script: ${script}`, error);
                    }
                });
            }
            // Create and append buttons to token bar
            static populateTokenbar() {
                return __awaiter(this, void 0, void 0, function* () {
                    const buttonData = yield this.fetchButtonData();
                    const tokenBar = document.getElementById('tokenbar-controls');
                    if (!tokenBar) {
                        FFT.Debug.Error("Token bar not found!");
                        return;
                    }
                    // Clear previous custom rows
                    document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());
                    // Organize buttons into rows
                    const rows = {};
                    for (const [id, button] of Object.entries(buttonData)) {
                        rows[button.row] = rows[button.row] || document.createElement('div');
                        rows[button.row].id = `custom-tokenbar-row-${button.row}`;
                        rows[button.row].className = 'flexrow tokenbar-buttons';
                        rows[button.row].appendChild(this.createButton(id, button));
                    }
                    // Append rows to token bar
                    Object.values(rows).forEach(row => tokenBar.appendChild(row));
                    FFT.Debug.Success("Token bar updated with buttons.");
                });
            }
        }
        Addons.MonksTokenbar = MonksTokenbar;
    })(Addons = FFT.Addons || (FFT.Addons = {}));
})(FFT || (FFT = {}));
// // scripts/monksTokenBarExtender/combat/combat.js
// namespace FFT {
//     export const combat = async (event) => {
//         const tokens = canvas.tokens.controlled;
//         let combat = game.combat;
//         if (!combat) {
//             // Create a new combat encounter
//             combat = await Combat.create({ scene: game.scenes.viewed.id });
//         }
//         for (let token of tokens) {
//             // Check if the token is already in combat
//             if (!combat.combatants.find(c => c.tokenId === token.id)) {
//                 await combat.createEmbeddedDocuments("Combatant", [{ tokenId: token.id }]);
//             }
//             // Get the combatant associated with the token
//             let combatant = combat.combatants.find(c => c.tokenId === token.id);
//             // Check if the token is an enemy and hide the combatant if so
//             if (token.document.disposition === -1) { // Disposition -1 is for hostile tokens
//                 await combatant.update({ hidden: true });
//             }
//             // Roll initiative if the combatant doesn't have an initiative value
//             if (combatant && combatant.initiative === null) {
//                 await combatant.rollInitiative();
//             }
//         }
//         // Make the combat encounter active if it isn't already
//         if (!combat.active) {
//             await combat.startCombat();
//         }
//     };
// }
window.FFT.Macros.healSelectedTokens = function (event) {
    var _a;
    let healValue = 0;
    // Check which modifier key is pressed
    if (event.shiftKey) {
        healValue = 10; // Heal by 10 if Shift is pressed
    }
    else if (event.ctrlKey) {
        healValue = 5; // Heal by 5 if Ctrl is pressed
    }
    else if (event.altKey) {
        healValue = 1; // Heal by 1 if Alt is pressed
    }
    else {
        healValue = 0; // Heal to full HP if no modifier is pressed
    }
    // Apply healing to selected tokens
    (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled.forEach((token) => {
        const actor = token.actor;
        actor.update({
            "system.attributes.hp.value": Math.min(actor.system.attributes.hp.value + healValue, actor.system.attributes.hp.max)
        });
    });
};
window.FFT.Macros.hurtSelectedTokens = function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled.forEach((token) => {
            var _a, _b;
            const actor = token.actor;
            if ((_b = (_a = actor === null || actor === void 0 ? void 0 : actor.system) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.hp) {
                actor.update({
                    "system.attributes.hp.value": 0
                });
            }
        });
    });
};
var FFT;
(function (FFT) {
    class Character {
        constructor(actorId) {
            var _a;
            const actor = (_a = game.actors) === null || _a === void 0 ? void 0 : _a.get(actorId);
            if (!actor)
                throw new Error(`Actor with ID ${actorId} not found.`);
            this.actor = actor;
            this.abilities = this.actor.system.abilities;
            FFT.Debug.Success(`Initialized character: ${this.actor.name}`);
            console.log(this.actor);
        }
    }
    FFT.Character = Character;
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    class Debug {
        static Log(message, ...args) {
            console.log(`%cFFTweaks | ${message}`, 'color: cyan; font-weight: bold;', ...args);
        }
        static Success(message, ...args) {
            console.log(`%cFFTweaks | ${message}`, 'color: green; font-weight: bold;', ...args);
        }
        static Warn(message, ...args) {
            console.warn(`%cFFTweaks | ${message}`, 'color: orange; font-weight: bold;', ...args);
        }
        static Error(message, ...args) {
            console.error(`%cFFTweaks | ${message}`, 'color: red; font-weight: bold;', ...args);
        }
    }
    FFT.Debug = Debug;
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    class UI {
        static createButton({ id = '', // Optional ID
        classes = [], // CSS classes
        icon = '', // Icon class
        tooltip = '', // Tooltip text
        onClick = null, // Click handler
         }) {
            const button = document.createElement('div');
            if (id)
                button.id = id;
            button.className = ['control-icon', ...classes].join(' ');
            if (tooltip)
                button.title = tooltip;
            button.innerHTML = `<i class="${icon}"></i>`;
            if (onClick)
                button.addEventListener('click', onClick);
            return button;
        }
    }
    FFT.UI = UI;
})(FFT || (FFT = {}));
