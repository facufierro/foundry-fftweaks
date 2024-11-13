/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />
window.FFT = window.FFT || {};
window.FFT.Addons = window.FFT.Addons || {};
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
            // Function to create an individual button with icon and click handler
            static createButton(id, title, icon, onClick) {
                FFT.Debug.Log(`Creating button: ${title} with icon: ${icon}`);
                const button = document.createElement('div');
                button.id = id;
                button.title = title;
                button.classList.add('control-icon'); // Ensures styling matches other buttons
                button.innerHTML = `<i class="${icon}"></i>`; // Set icon class (e.g., "fas fa-dice")
                button.addEventListener('click', onClick);
                return button;
            }
            // Function to create buttons from JSON data and organize them into rows
            static createButtons() {
                return __awaiter(this, void 0, void 0, function* () {
                    FFT.Debug.Log("Attempting to fetch button data...");
                    try {
                        const response = yield fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                        if (!response.ok) {
                            FFT.Debug.Error(`Failed to fetch button data: ${response.status} ${response.statusText}`);
                            return;
                        }
                        const buttonData = yield response.json();
                        FFT.Debug.Log("Button data fetched successfully:", buttonData);
                        const tokenBar = document.getElementById('tokenbar-controls');
                        if (!tokenBar) {
                            FFT.Debug.Error("Token bar not found! Adjust initialization timing if needed.");
                            return;
                        }
                        FFT.Debug.Log("Token bar found. Clearing existing custom rows...");
                        // Remove existing custom rows to avoid duplicates
                        document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());
                        const rows = {};
                        // Create and store buttons by row
                        for (const [id, button] of Object.entries(buttonData)) {
                            FFT.Debug.Log(`Processing button: ${button.name} in row: ${button.row}`);
                            // Create a new row if it doesn't exist
                            if (!rows[button.row]) {
                                rows[button.row] = document.createElement('div');
                                rows[button.row].id = `custom-tokenbar-row-${button.row}`;
                                rows[button.row].className = 'flexrow tokenbar-buttons';
                                FFT.Debug.Log(`Created new row: ${button.row}`);
                            }
                            // Create the button using createButton function
                            const newButton = MonksTokenbar.createButton(id, button.name, button.icon, (event) => {
                                Promise.resolve(`${button.script}`).then(s => require(s)).then(m => { var _a; return (_a = m.default) === null || _a === void 0 ? void 0 : _a.call(m, event); });
                            });
                            // Append the button to its corresponding row
                            rows[button.row].appendChild(newButton);
                        }
                        // Append only non-empty rows to the token bar
                        Object.values(rows).forEach(rowElement => {
                            if (rowElement.children.length > 0) {
                                tokenBar.appendChild(rowElement);
                                FFT.Debug.Success(`Appended row to token bar: ${rowElement.id}`);
                            }
                        });
                        FFT.Debug.Success("All rows and buttons appended to token bar.");
                    }
                    catch (error) {
                        FFT.Debug.Error("Error fetching or processing button data:", error);
                    }
                });
            }
            // Function to add buttons and attach them to the token bar
            static addButtons() {
                const tokenBar = document.getElementById('tokenbar-controls');
                if (!tokenBar) {
                    FFT.Debug.Error("Token bar not found in addButtons!");
                    return;
                }
                FFT.Debug.Log("Adding buttons to token bar...");
                // Ensure no existing 'custom-tokenbar-row' remains
                document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());
                // Create buttons and attach them
                MonksTokenbar.createButtons();
            }
            // Initialization function to set up observers and add buttons on load
            static initialize() {
                FFT.Debug.Log("Initializing MonksTokenbar...");
                // Check if tokenBar exists or wait for it
                const checkInterval = setInterval(() => {
                    const tokenBar = document.getElementById('tokenbar-controls');
                    if (tokenBar) {
                        clearInterval(checkInterval);
                        MonksTokenbar.addButtons();
                        // Set up MutationObserver if tokenBar is available
                        const observer = new MutationObserver(() => {
                            if (!document.querySelector('[id^="custom-tokenbar-row"]')) {
                                FFT.Debug.Log("MutationObserver triggered. Re-adding buttons.");
                                MonksTokenbar.addButtons();
                            }
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                        FFT.Debug.Log("MutationObserver set up.");
                    }
                    else {
                        FFT.Debug.Log("Waiting for token bar to become available...");
                    }
                }, 100); // Adjust delay if needed
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
// src/debug.ts
var FFT;
(function (FFT) {
    class UI {
        static createButton({ classes = [], icon = '', tooltip = '', onClick = null }) {
            const button = $(`<button type="button" class="${classes.join(' ')}" data-tooltip="${tooltip}"><i class="${icon}"></i></button>`);
            if (onClick)
                button.on('click', onClick);
            return button;
        }
        static test() {
            FFT.Debug.Warn("Test");
        }
    }
    FFT.UI = UI;
})(FFT || (FFT = {}));
