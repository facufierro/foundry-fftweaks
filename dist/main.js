/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />
window.FFT = window.FFT || {};
window.FFT.Addons = window.FFT.Addons || {};
window.FFT.Functions = window.FFT.Functions || {};
Hooks.once("ready", () => {
    FFT.Addons.FunctionBar.initialize();
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
window.FFT.Functions.craftingCheck = function (actor, toolID, checks, DC) {
    return __awaiter(this, void 0, void 0, function* () {
        const max_failures = 3;
        const gold = actor.system.currency.gp;
        const downtimeHours = actor.system.currency.dd;
        let failures = 0;
        let successes = 0;
        ui.notifications.info(`You have ${downtimeHours} downtime hours remaining.`);
    });
};
window.FFT.Functions.toggleCombatState = function (event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const selectedTokens = (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled;
        if (!selectedTokens || selectedTokens.length === 0)
            return;
        for (const token of selectedTokens) {
            const tokenDocument = token.document; // Access the TokenDocument
            if (!tokenDocument.combatant) {
                // Add token to combat
                yield tokenDocument.toggleCombatant();
                // Hide the token in the combat tracker if it is hostile
                if (tokenDocument.disposition === -1 && tokenDocument.combatant) {
                    yield tokenDocument.combatant.update({ hidden: true });
                }
            }
            else {
                // Remove token from combat
                yield tokenDocument.toggleCombatant();
            }
        }
    });
};
window.FFT.Functions.healSelectedTokens = function (event) {
    var _a, _b;
    const selectedTokens = (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.warn("No tokens selected.");
        return;
    }
    for (const token of selectedTokens) {
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
    }
};
window.FFT.Functions.hurtSelectedTokens = function (event) {
    var _a, _b;
    const selectedTokens = (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled;
    if (!selectedTokens || selectedTokens.length === 0) {
        (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.warn("No tokens selected.");
        return;
    }
    for (const token of selectedTokens) {
        const actor = token.actor;
        let damageValue = actor.system.attributes.hp.max; // Default: Damage to 0 HP
        if (event.shiftKey) {
            damageValue = 10; // Damage by 10 if Shift is pressed
        }
        else if (event.ctrlKey) {
            damageValue = 5; // Damage by 5 if Ctrl is pressed
        }
        else if (event.altKey) {
            damageValue = 1; // Damage by 1 if Alt is pressed
        }
        actor.update({
            "system.attributes.hp.value": Math.max(actor.system.attributes.hp.value - damageValue, 0), // Ensure HP doesn't go below 0
        });
    }
};
window.FFT.Functions.restSelectedTokens = function (event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const selectedTokens = (_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled;
        if (!selectedTokens || selectedTokens.length === 0) {
            (_b = ui.notifications) === null || _b === void 0 ? void 0 : _b.warn("No tokens selected.");
            return;
        }
        for (const token of selectedTokens) {
            const actor = token.actor;
            if (!actor)
                continue;
            if (event.shiftKey) {
                // Shift key: Perform a Short Rest
                if (actor.type === "character" || actor.type === "npc") {
                    yield actor.shortRest({ dialog: false });
                }
            }
            else {
                // Default: Perform a Long Rest
                if (actor.type === "character" || actor.type === "npc") {
                    yield actor.longRest({ dialog: false, newDay: false });
                }
            }
        }
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
    var Addons;
    (function (Addons) {
        class FunctionBar {
            static initialize() {
                return __awaiter(this, void 0, void 0, function* () {
                    // Check if the user is a DM
                    if (!game.user.isGM) {
                        return;
                    }
                    const buttonData = yield FFT.UI.fetchButtonData();
                    // Transform button data into the required format
                    const buttons = Object.entries(buttonData).map(([id, { name, icon, script }]) => ({
                        id,
                        title: name,
                        icon,
                        onClick: FFT.UI.resolveFunction(script),
                    }));
                    // Create the function bar
                    FFT.UI.createForm({
                        id: 'fft-functionbar',
                        position: { top: '150px', left: '150px' },
                        buttons,
                    });
                });
            }
        }
        Addons.FunctionBar = FunctionBar;
    })(Addons = FFT.Addons || (FFT.Addons = {}));
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
        // Fetch button data from JSON
        static fetchButtonData() {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch('modules/fftweaks/src/modules/function-bar/data/button-data.json');
                if (!response.ok) {
                    console.error("Failed to fetch button data:", response.statusText);
                    return {};
                }
                return yield response.json();
            });
        }
        // Create a customizable form with original styles and functionality
        static createForm({ id = 'fft-functionbar', position = { top: '150px', left: '150px' }, buttons = [], }) {
            // Remove existing form if it exists
            const existingForm = document.getElementById(id);
            if (existingForm)
                existingForm.remove();
            // Create the main container with original styles
            const form = document.createElement('div');
            form.id = id;
            Object.assign(form.style, {
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: '60',
                display: 'flex',
                flexDirection: 'column',
                padding: '0px',
                background: 'rgb(11 10 19 / 75%)',
                border: '1px solid #111',
                borderRadius: '0',
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
            });
            // Create the move handle with original styles
            const moveHandle = document.createElement('div');
            moveHandle.id = `${id}-handle`;
            Object.assign(moveHandle.style, {
                width: '100%',
                height: '20px',
                background: 'rgb(0 0 0 / 50%)',
                cursor: 'move',
                borderBottom: '1px solid #111',
            });
            form.appendChild(moveHandle);
            // Create and append button container
            const buttonRow = document.createElement('div');
            Object.assign(buttonRow.style, {
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
                padding: '4px',
            });
            // Create buttons and append them to the button row
            buttons.forEach(({ id, title, icon, onClick }) => {
                const button = this.createButton(id, title, icon, onClick);
                buttonRow.appendChild(button);
            });
            form.appendChild(buttonRow);
            // Make the form draggable
            this.makeDraggable(form, moveHandle);
            // Append to the document body
            document.body.appendChild(form);
            return form;
        }
        // Helper function to create a button with original styles
        static createButton(id, title, icon, onClick) {
            const buttonElem = document.createElement('button');
            buttonElem.id = id;
            buttonElem.title = title;
            Object.assign(buttonElem.style, {
                width: '28px',
                height: '28px',
                background: 'rgb(0 0 0 / 0%)',
                border: '1px solid transparent',
                borderRadius: '4px',
                color: '#c9c7b8',
                textAlign: 'center',
                margin: '0',
                cursor: 'pointer',
                padding: '0',
                boxSizing: 'border-box',
                boxShadow: 'none',
                transition: 'box-shadow 0.2s ease',
            });
            const iconElem = document.createElement('i');
            iconElem.className = icon;
            Object.assign(iconElem.style, {
                color: '#c9c7b8',
                fontFamily: 'Font Awesome 6 Pro',
                lineHeight: '28px',
                marginRight: '0',
                transition: 'text-shadow 0.2s ease',
            });
            buttonElem.appendChild(iconElem);
            buttonElem.addEventListener('mouseenter', () => {
                iconElem.style.textShadow = '0 0 10px #ff6400'; // Glow effect
            });
            buttonElem.addEventListener('mouseleave', () => {
                iconElem.style.textShadow = 'none'; // Remove glow effect
            });
            buttonElem.addEventListener('click', onClick);
            return buttonElem;
        }
        // Helper function to resolve a script function path
        static resolveFunction(scriptPath) {
            try {
                const scriptParts = scriptPath.split('.');
                let func = window;
                for (const part of scriptParts) {
                    func = func[part];
                    if (!func)
                        break;
                }
                if (typeof func === 'function') {
                    return func;
                }
                else {
                    console.error(`"${scriptPath}" is not a valid function.`);
                    return null;
                }
            }
            catch (error) {
                console.error(`Error resolving function "${scriptPath}":`, error);
                return null;
            }
        }
        // Helper function to make the form draggable
        static makeDraggable(element, handle) {
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
            handle.addEventListener('mousedown', onMouseDown);
        }
    }
    FFT.UI = UI;
})(FFT || (FFT = {}));
