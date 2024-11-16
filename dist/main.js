/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />
// Initialize FFT.Macros first
window.FFT = window.FFT || {};
window.FFT.Addons = window.FFT.Addons || {};
window.FFT.Macros = window.FFT.Macros || {};
// Initialize MonksTokenbar after macros are set
Hooks.once("ready", () => {
    FFT.Addons.ActionBar.initialize();
});
var FFT;
(function (FFT) {
    var Addons;
    (function (Addons) {
        class ActionBar {
            static initialize() {
                const existingActionBar = document.getElementById('fft-actionbar');
                if (existingActionBar)
                    existingActionBar.remove();
                const actionBar = document.createElement('div');
                actionBar.id = 'fft-actionbar';
                Object.assign(actionBar.style, {
                    position: 'fixed',
                    top: '150px',
                    left: '150px',
                    zIndex: '60',
                    display: 'flex',
                    flexDirection: 'column', // Stack rows vertically
                    gap: '4px',
                    padding: '0px',
                    background: 'rgb(11 10 19 / 75%)',
                    border: '1px solid #111',
                    borderRadius: '0', // Set to 0 to remove rounded edges
                    boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)'
                });
                const buttons = [
                    { iconClass: 'fa fa-running', tooltip: 'Move' },
                    { iconClass: 'fa fa-street-view', tooltip: 'Interact' },
                    { iconClass: 'fa fa-fist-raised', tooltip: 'Action' },
                    { iconClass: 'fa fa-tools', tooltip: 'Tools' },
                    { iconClass: 'fas fa-people-arrows', tooltip: 'Team' },
                    { iconClass: 'fas fa-book-medical', tooltip: 'More' }
                ];
                // Split buttons into rows (e.g., 3 buttons per row)
                const columns = 3;
                const rows = Math.ceil(buttons.length / columns);
                for (let i = 0; i < rows; i++) {
                    const row = document.createElement('div');
                    row.className = 'fft-actionbar-buttons';
                    Object.assign(row.style, {
                        display: 'flex',
                        flexDirection: 'row', // Align buttons horizontally
                        gap: '4px',
                        margin: '4px 0', // Add margin to each row (columns)
                    });
                    buttons.slice(i * columns, i * columns + columns).forEach(button => {
                        const buttonElem = document.createElement('button');
                        buttonElem.title = button.tooltip;
                        Object.assign(buttonElem.style, {
                            width: '28px',
                            height: '28px',
                            background: 'rgb(0 0 0 / 0%)', // Default background is transparent
                            border: '1px solid transparent',
                            borderRadius: '4px',
                            color: '#c9c7b8',
                            textAlign: 'center',
                            margin: '0',
                            cursor: 'pointer',
                            padding: '0',
                            boxSizing: 'border-box',
                            boxShadow: 'none', // Default no shadow
                            transition: 'box-shadow 0.2s ease' // Smooth transition for hover effect
                        });
                        const iconElem = document.createElement('i');
                        iconElem.className = button.iconClass;
                        Object.assign(iconElem.style, {
                            color: '#c9c7b8',
                            fontFamily: 'Font Awesome 6 Pro',
                            lineHeight: '28px',
                            marginRight: '0',
                            transition: 'text-shadow 0.2s ease' // Smooth transition for hover effect
                        });
                        buttonElem.appendChild(iconElem);
                        buttonElem.addEventListener('mouseenter', () => {
                            iconElem.style.textShadow = '0 0 10px #ff6400'; // Glow effect
                        });
                        buttonElem.addEventListener('mouseleave', () => {
                            iconElem.style.textShadow = 'none'; // Remove glow effect
                        });
                        row.appendChild(buttonElem);
                    });
                    actionBar.appendChild(row);
                }
                document.body.appendChild(actionBar);
                this.makeDraggable(actionBar);
            }
            static makeDraggable(element) {
                let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
                const onMouseDown = (event) => {
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                };
                const onMouseMove = (event) => {
                    offsetX = event.clientX - mouseX;
                    offsetY = event.clientY - mouseY;
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                    const rect = element.getBoundingClientRect();
                    element.style.left = rect.left + offsetX + 'px';
                    element.style.top = rect.top + offsetY + 'px';
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                element.addEventListener('mousedown', onMouseDown);
            }
        }
        Addons.ActionBar = ActionBar;
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
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
