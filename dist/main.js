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
            static initialize() {
                const interval = setInterval(() => {
                    const tokenBar = document.getElementById('tokenbar-controls');
                    if (tokenBar) {
                        clearInterval(interval);
                        setInterval(() => this.populateTokenbar(), 50);
                    }
                }, 100);
            }
            static fetchButtonData() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const response = yield fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                        if (!response.ok)
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        return yield response.json();
                    }
                    catch (_a) {
                        return {};
                    }
                });
            }
            static createButton(id, button) {
                return FFT.UI.createButton({
                    id,
                    classes: ['control-icon'],
                    icon: button.icon,
                    tooltip: button.name,
                    onClick: (event) => this.runScript(button.script, event),
                });
            }
            static runScript(script, event) {
                return __awaiter(this, void 0, void 0, function* () {
                    const func = script.split('.').reduce((obj, key) => obj === null || obj === void 0 ? void 0 : obj[key], window);
                    if (typeof func === "function")
                        yield func(event);
                });
            }
            static populateTokenbar() {
                return __awaiter(this, void 0, void 0, function* () {
                    const buttonData = yield this.fetchButtonData();
                    const tokenBar = document.getElementById('tokenbar-controls');
                    if (!tokenBar)
                        return;
                    const rows = {};
                    for (const [id, button] of Object.entries(buttonData)) {
                        const rowId = `custom-tokenbar-row-${button.row}`;
                        rows[button.row] = rows[button.row] || document.getElementById(rowId) || (() => {
                            const row = document.createElement('div');
                            row.id = rowId;
                            row.className = 'flexrow tokenbar-buttons';
                            tokenBar.appendChild(row);
                            return row;
                        })();
                        if (!document.getElementById(id)) {
                            rows[button.row].appendChild(this.createButton(id, button));
                        }
                    }
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
    (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled.forEach((token) => {
        const actor = token.actor;
        let healValue = actor.system.attributes.hp.max; // Default: Heal to max HP
        if (event.shiftKey) {
            healValue = 10; // Heal by 10 if Shift is pressed
        }
        else if (event.ctrlKey) {
            healValue = 5; // Heal by 5 if Ctrl is pressed
        }
        else if (event.altKey) {
            healValue = 1; // Heal by 1 if Alt is pressed
        }
        actor.update({
            "system.attributes.hp.value": Math.min(actor.system.attributes.hp.value + healValue, actor.system.attributes.hp.max),
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
        static createButton({ id = '', classes = [], icon = '', tooltip = '', onClick = null, }) {
            const button = document.createElement('div');
            if (id)
                button.id = id;
            button.className = ['control-icon', ...classes].join(' ');
            if (tooltip)
                button.title = tooltip;
            button.innerHTML = `<i class="${icon}"></i>`;
            if (onClick)
                button.addEventListener('click', onClick); // Pass event automatically
            return button;
        }
    }
    FFT.UI = UI;
})(FFT || (FFT = {}));
