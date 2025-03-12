/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />
window.FFT = window.FFT || {};
window.FFT.Modules = window.FFT.Modules || {};
window.FFT.Addons = window.FFT.Addons || {};
window.FFT.Functions = window.FFT.Functions || {};
// on ready
Hooks.once("ready", () => {
    FFT.Modules.FunctionBar.initialize();
    FFT.Modules.FolderAutoColor.initialize();
    FFT.Modules.CharacterAnvil.initialize();
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
window.FFT.Functions.craftingCheck = function (actor, toolID, checksNeeded, DC) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure the necessary flags are initialized
        actor.flags["custom-dnd5e"] = actor.flags["custom-dnd5e"] || {};
        actor.flags["custom-dnd5e"]["crafting-progress"] = actor.flags["custom-dnd5e"]["crafting-progress"] || { value: 0, max: 0 };
        actor.flags["custom-dnd5e"]["crafting-failures"] = actor.flags["custom-dnd5e"]["crafting-failures"] || { value: 0, max: 3 };
        // Set the crafting progress max to the required checks
        yield actor.update({ "flags.custom-dnd5e.crafting-progress.max": checksNeeded });
        // Make the tool check roll
        const result = yield actor.rollToolCheck(toolID);
        if (result.total >= DC) {
            // Successful check: Deduct downtime hours and increase progress
            const downtimeHours = actor.getFlag("custom-dnd5e", "downtime-hours") || 0;
            yield actor.update({
                "flags.custom-dnd5e.downtime-hours": downtimeHours - 2,
                "flags.custom-dnd5e.crafting-progress.value": actor.getFlag("custom-dnd5e", "crafting-progress.value") + 1,
            });
            // Check if crafting progress has reached the maximum
            const craftingProgress = actor.getFlag("custom-dnd5e", "crafting-progress.value") || 0;
            const craftingMax = actor.getFlag("custom-dnd5e", "crafting-progress.max") || 0;
            if (craftingProgress >= craftingMax) {
                yield actor.update({
                    "flags.custom-dnd5e.crafting-progress.value": 0,
                    "flags.custom-dnd5e.crafting-progress.max": 0,
                    "flags.custom-dnd5e.crafting-failures.value": 0,
                });
                return { success: true, consume: true };
            }
        }
        else {
            // Failed check: Increase crafting failures
            yield actor.update({
                "flags.custom-dnd5e.crafting-failures.value": actor.getFlag("custom-dnd5e", "crafting-failures.value") + 1,
            });
            // Check if crafting failures have reached the maximum
            const craftingFailures = actor.getFlag("custom-dnd5e", "crafting-failures.value") || 0;
            const craftingFailuresMax = actor.getFlag("custom-dnd5e", "crafting-failures.max") || 3;
            if (craftingFailures >= craftingFailuresMax) {
                yield actor.update({
                    "flags.custom-dnd5e.crafting-progress.value": 0,
                    "flags.custom-dnd5e.crafting-progress.max": 0,
                    "flags.custom-dnd5e.crafting-failures.value": 0,
                });
                return { success: false, consume: true };
            }
        }
        // If no crafting completion or failure, return false for both success and consume
        return { success: false, consume: false };
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
    var Modules;
    (function (Modules) {
        class CharacterAnvil {
            static initialize() {
                Hooks.on("createItem", (item, options, userId) => __awaiter(this, void 0, void 0, function* () {
                    if (item.type === "class") {
                        FFT.Modules.EquipmentManager.showDialog("create", "class", item, userId);
                        const spellListId = "fltmd5kijx3pTREA.GEc89WbpwBlsqP2z";
                        const { spells, title, category } = yield FFT.Modules.SpellSelector.getSpellData(spellListId);
                        const actor = item.parent; // ✅ Get the character that owns the item
                        if (!actor || !(actor instanceof Actor)) {
                            console.warn("No valid actor found for this item.");
                            return;
                        }
                        if (Object.keys(spells).length > 0) {
                            FFT.Modules.SpellSelector.showDialog(spells, title, category, actor, game.user.id);
                        }
                        else {
                            console.warn("No spells found, skipping dialog.");
                        }
                    }
                    if (item.type === "background") {
                        FFT.Modules.EquipmentManager.showDialog("create", "background", item, userId);
                    }
                }));
                Hooks.on("preDeleteItem", (item, options, userId) => {
                    if (item.type === "class") {
                        FFT.Modules.EquipmentManager.showDialog("remove", "class", item, userId);
                    }
                    if (item.type === "background") {
                        FFT.Modules.EquipmentManager.showDialog("remove", "background", item, userId);
                    }
                });
                FFT.Modules.PointBuySystem.initialize();
            }
        }
        Modules.CharacterAnvil = CharacterAnvil;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    var Modules;
    (function (Modules) {
        class EquipmentManager {
            static isValidEvent(userId) {
                return game.user.isGM || userId === game.user.id;
            }
            static showDialog(eventType, itemType, item, userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!this.isValidEvent(userId))
                        return;
                    if (!item || item.type !== itemType)
                        return;
                    const actor = item.parent;
                    if (!actor)
                        return;
                    const character = new FFT.Character(actor);
                    const content = `
                <p>${character.actor.name} has ${eventType === "create" ? "selected" : "removed"} a ${itemType}.</p>
                <p>Do you want to ${eventType} its associated items?</p>
            `;
                    new FF.CustomDialog(`${eventType.charAt(0).toUpperCase() + eventType.slice(1)} ${itemType} Items`, content, {
                        yes: {
                            label: "Yes",
                            callback: () => __awaiter(this, void 0, void 0, function* () {
                                const data = yield EquipmentManager.getEquipmentData(item);
                                if (!data || !data.equipmentKeys.length)
                                    return;
                                if (eventType === "create") {
                                    yield character.addItemsByID(data.equipmentKeys);
                                }
                                else {
                                    yield character.removeItemsByName(data.equipmentNames);
                                }
                                ui.notifications.info(`${itemType} items ${eventType}d!`);
                            })
                        },
                        no: {
                            label: "No",
                            callback: () => ui.notifications.info(`${itemType} items were not ${eventType}d.`)
                        }
                    }, "yes").render();
                });
            }
            static getEquipmentData(item) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    const actor = item.parent;
                    if (!actor)
                        return null;
                    const character = new FFT.Character(actor);
                    const equipmentKeys = ((_c = (_b = (_a = item.system) === null || _a === void 0 ? void 0 : _a.startingEquipment) === null || _b === void 0 ? void 0 : _b.map(e => e.key)) === null || _c === void 0 ? void 0 : _c.filter(Boolean)) || [];
                    const equipmentNames = (yield Promise.all(equipmentKeys.map((id) => __awaiter(this, void 0, void 0, function* () {
                        const foundItem = yield fromUuid(id);
                        return (foundItem === null || foundItem === void 0 ? void 0 : foundItem.name) || null;
                    })))).filter(Boolean);
                    return {
                        character,
                        sourceType: item.type,
                        sourceName: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                        equipmentKeys,
                        equipmentNames
                    };
                });
            }
        }
        Modules.EquipmentManager = EquipmentManager;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    var Modules;
    (function (Modules) {
        class PointBuySystem {
            static initialize() {
                Hooks.on("renderActorSheet5eCharacter", (_app, html, data) => {
                    if (!game.user.isGM)
                        return;
                    let actor = data.actor;
                    let details = actor.system.details || {}; // Fix: Ensure details is treated as an object
                    if (details.background)
                        return; // Hide button if character has a background
                    let buttonContainer = html.find(".sheet-header-buttons");
                    if (!buttonContainer.length)
                        return;
                    let button = $(`
            <button type="button" class="point-buy-button gold-button" 
                data-tooltip="Point Buy System" aria-label="Point Buy">
                <i class="fas fa-chart-bar"></i>
            </button>
        `);
                    button.on("click", () => PointBuySystem.openDialog(actor));
                    buttonContainer.append(button);
                });
            }
            static openDialog(actor) {
                if (this.activeDialog) {
                    if (this.activeDialog.rendered) {
                        this.activeDialog.bringToTop();
                    }
                    return;
                }
                let abilities = {
                    str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
                };
                let abilityLabels = {
                    str: "Strength",
                    dex: "Dexterity",
                    con: "Constitution",
                    int: "Intelligence",
                    wis: "Wisdom",
                    cha: "Charisma"
                };
                let currentPoints = this.calculatePoints(abilities);
                let content = this.generateDialogContent(abilities, abilityLabels, currentPoints);
                this.activeDialog = new Dialog({
                    title: "Point Buy System",
                    content: content,
                    render: (html) => {
                        this.setupListeners(html, abilities);
                        html.closest(".app").addClass("no-resize"); // ✅ Prevent resizing via CSS
                        html.closest(".window-app").find(".window-resizable-handle").remove(); // ✅ Remove resize handle
                    },
                    buttons: {
                        confirm: {
                            label: "Apply",
                            callback: (html) => this.applyChanges(actor, $(html))
                        },
                        cancel: {
                            label: "Cancel",
                            callback: () => { this.activeDialog = null; }
                        }
                    },
                    close: () => { this.activeDialog = null; }
                });
                this.activeDialog.render(true);
            }
            static generateDialogContent(abilities, abilityLabels, currentPoints) {
                let content = `<style>
                .point-buy-container { text-align: center; font-size: 1.1em; }
                .ability-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
                .ability-name { width: 100px; text-align: left; }
                .point-value { width: 40px; text-align: center; font-weight: bold; }
                .btn-adjust { cursor: pointer; border: none; background: #444; color: white; font-size: 1.2em; width: 30px; height: 30px; border-radius: 5px; }
                .btn-adjust:hover { background: #666; }
                .remaining-points { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
            </style>
            <div class="point-buy-container">
                <p class="remaining-points">Remaining Points: <span id="remaining-points">${currentPoints}</span></p>
            `;
                for (let key of Object.keys(abilities)) {
                    let name = abilityLabels[key];
                    content += `
                    <div class="ability-row">
                        <span class="ability-name">${name}</span>
                        <button class="btn-adjust" data-action="decrease" data-key="${key}">-</button>
                        <span class="point-value" id="ability-${key}">${abilities[key]}</span>
                        <button class="btn-adjust" data-action="increase" data-key="${key}">+</button>
                    </div>
                `;
                }
                content += `</div>`;
                return content;
            }
            static setupListeners(html, abilities) {
                let remainingPoints = 27;
                let costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
                html.find(".btn-adjust").on("click", function (event) {
                    let button = $(this);
                    let key = button.data("key");
                    let action = button.data("action");
                    let valueElement = html.find(`#ability-${key}`);
                    let currentValue = parseInt(valueElement.text());
                    let newValue = currentValue;
                    if (event.shiftKey) {
                        newValue = (action === "increase") ? 15 : 8;
                    }
                    else {
                        if (action === "increase" && currentValue < 15) {
                            newValue++;
                        }
                        else if (action === "decrease" && currentValue > 8) {
                            newValue--;
                        }
                    }
                    let oldCost = costs[currentValue] || 0;
                    let newCost = costs[newValue] || 0;
                    let pointChange = newCost - oldCost;
                    if (remainingPoints - pointChange >= 0) {
                        valueElement.text(newValue);
                        remainingPoints -= pointChange;
                    }
                    html.find("#remaining-points").text(remainingPoints);
                });
            }
            static calculatePoints(abilities) {
                let total = 27;
                let costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
                for (let value of Object.values(abilities)) {
                    total -= costs[value] || 0;
                }
                return total;
            }
            static applyChanges(actor, html) {
                let updates = {};
                let remainingPoints = 27;
                let costs = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
                html.find(".ability-row").each((_index, element) => {
                    let key = $(element).find(".btn-adjust").data("key");
                    let newValue = parseInt($(element).find(".point-value").text());
                    if (isNaN(newValue) || newValue < 8 || newValue > 15)
                        return;
                    remainingPoints -= costs[newValue] || 0;
                    updates[`system.abilities.${key}.value`] = newValue;
                });
                if (remainingPoints < 0) {
                    ui.notifications.error("Invalid point allocation. Please stay within the 27 points.");
                    return;
                }
                actor.update(updates);
                ui.notifications.info("Abilities updated successfully.");
                this.activeDialog = null;
            }
        }
        PointBuySystem.activeDialog = null; // Prevent multiple windows
        Modules.PointBuySystem = PointBuySystem;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    var Modules;
    (function (Modules) {
        class SpellSelector {
            static isValidEvent(userId) {
                return game.user.isGM || userId === game.user.id;
            }
            static getSpellData(spellListId) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    console.log("Received spellListId:", spellListId);
                    const [journalId, pageId] = spellListId.split(".");
                    console.log("Extracted Journal ID:", journalId);
                    console.log("Extracted Page ID:", pageId);
                    const journal = game.journal.get(journalId);
                    if (!journal)
                        return { spells: {}, title: "Unknown", category: "Spells" };
                    const page = journal.pages.get(pageId);
                    if (!page)
                        return { spells: {}, title: "Unknown", category: "Spells" };
                    console.log("Journal Page Found:", page.name);
                    console.log("Page System Data:", page.system);
                    const spellIds = ((_a = page.system) === null || _a === void 0 ? void 0 : _a.spells) instanceof Set
                        ? Array.from(page.system.spells)
                        : Array.isArray((_b = page.system) === null || _b === void 0 ? void 0 : _b.spells)
                            ? page.system.spells
                            : [];
                    console.log("Extracted Spell IDs:", spellIds);
                    if (spellIds.length === 0) {
                        console.warn(`No spells found in Journal Page: ${page.name}`);
                        return {
                            spells: {},
                            title: page.name,
                            category: String(((_c = page.system) === null || _c === void 0 ? void 0 : _c.grouping) || "Spells")
                        };
                    }
                    // Convert to dictionary { spellName: { id, level } }
                    const spellDict = Object.fromEntries(yield Promise.all(spellIds.map((id) => __awaiter(this, void 0, void 0, function* () {
                        const spell = yield fromUuid(id);
                        return spell instanceof Item ? [spell.name, { id: id, level: spell.system.level || 0 }] : null;
                    }))).then(spells => spells.filter(Boolean)));
                    console.log("Final Spell Dictionary:", spellDict);
                    return {
                        spells: spellDict,
                        title: page.name,
                        category: String(((_d = page.system) === null || _d === void 0 ? void 0 : _d.grouping) || "Spells")
                    };
                });
            }
            static showDialog(spells, title, category, actor, // ✅ Actor is now passed in
            userId) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!this.isValidEvent(userId))
                        return;
                    if (Object.keys(spells).length === 0)
                        return;
                    if (!actor) {
                        ui.notifications.error("No character sheet found.");
                        return;
                    }
                    const existingSpells = this.getExistingSpells(actor); // ✅ Use the actor to check existing spells
                    // Group spells by level
                    const spellsByLevel = {};
                    for (const [spellName, spellData] of Object.entries(spells)) {
                        const level = spellData.level;
                        if (!spellsByLevel[level])
                            spellsByLevel[level] = [];
                        spellsByLevel[level].push({
                            name: spellName,
                            id: spellData.id,
                            owned: existingSpells.has(spellName) // ✅ Check if the character already owns this spell
                        });
                    }
                    // Sort levels numerically
                    const sortedLevels = Object.keys(spellsByLevel)
                        .map(Number)
                        .sort((a, b) => a - b);
                    // Build spell selection UI with level separators
                    const spellOptions = sortedLevels.map(level => {
                        const levelLabel = level === 0 ? "Cantrips" : `Level ${level}`;
                        const spellList = spellsByLevel[level]
                            .map(spell => `
                        <div>
                            <input type="checkbox" class="spell-checkbox" data-spell-id="${spell.id}" ${spell.owned ? "disabled" : ""}>
                            <label style="${spell.owned ? "color: gray;" : ""}">${spell.name}</label>
                        </div>
                    `).join("");
                        return `
                    <h3>${levelLabel}</h3>
                    ${spellList}
                `;
                    }).join("");
                    const content = `
                <p><strong>${category}</strong></p>  <!-- ✅ Display spell category -->
                <div class="spell-list" style="max-height: 400px; overflow-y: auto;">
                    ${spellOptions}
                </div>
            `;
                    new FF.CustomDialog(title, content, {
                        yes: {
                            label: "Add",
                            callback: (html) => __awaiter(this, void 0, void 0, function* () {
                                const selectedSpells = Array.from(html[0].querySelectorAll(".spell-checkbox:checked")).map(el => el.dataset.spellId || "");
                                if (selectedSpells.length === 0) {
                                    ui.notifications.warn("No spells selected.");
                                    return;
                                }
                                console.log("Selected Spell IDs:", selectedSpells);
                                ui.notifications.info(`${selectedSpells.length} spell(s) selected.`);
                            })
                        },
                        no: {
                            label: "Cancel",
                            callback: () => ui.notifications.info(`Spell selection canceled.`)
                        }
                    }, "yes").render();
                });
            }
            static getExistingSpells(actor) {
                if (!actor)
                    return new Set();
                // Get all spell names from the actor's items
                const spellNames = new Set(actor.items.filter(item => item.type === "spell").map(spell => spell.name));
                console.log("Existing Spells on Character:", spellNames);
                return spellNames;
            }
        }
        Modules.SpellSelector = SpellSelector;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    var Modules;
    (function (Modules) {
        class FolderAutoColor {
            static initialize() {
                FolderAutoColor.updateFolderColors();
                Hooks.on("createFolder", (folder, data) => {
                    FolderAutoColor.updateFolderColors();
                });
            }
            static updateFolderColors() {
                if (!game.user.isGM)
                    return;
                let colors = [
                    '#4b0000', '#003300', '#00004b', '#4b004b', '#4b2e00',
                    '#00334b', '#4b0033', '#333333', '#4b4b00', '#4b6600'
                ];
                // Function to lighten a hex color by a given percentage
                function lightenColor(color, lightenPercent) {
                    let num = parseInt(color.slice(1), 16), amt = Math.round(2.55 * lightenPercent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
                    return '#' + (0x1000000 +
                        (Math.min(255, Math.max(0, R)) * 0x10000) +
                        (Math.min(255, Math.max(0, G)) * 0x100) +
                        (Math.min(255, Math.max(0, B)))).toString(16).slice(1);
                }
                // Function to apply folder color updates
                function updateFolderColors() {
                    let tabIds = ["actors", "items", "scenes", "journal", "cards", "rolltable", "playlists", "compendium"];
                    tabIds.forEach(tabId => {
                        let tabElement = document.querySelector(`#${tabId}`);
                        if (tabElement) {
                            let rootFolders = tabElement.querySelectorAll('.directory-item.folder[data-folder-depth="1"]');
                            let folderTree = {};
                            rootFolders.forEach((folderElement, index) => {
                                let rootFolderId = folderElement.getAttribute('data-folder-id');
                                if (!rootFolderId)
                                    return;
                                folderTree[rootFolderId] = [];
                                let rootColor = colors[index % colors.length];
                                let lightColor1 = lightenColor(rootColor, 10);
                                let lightColor2 = lightenColor(rootColor, 20);
                                let currentDepth = 1;
                                let subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth + 1}"]`);
                                while (subfolders.length > 0) {
                                    subfolders.forEach(subfolderElement => {
                                        let subfolderId = subfolderElement.getAttribute('data-folder-id');
                                        if (subfolderId)
                                            folderTree[rootFolderId].push(subfolderId);
                                    });
                                    currentDepth += 1;
                                    subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth}"]`);
                                }
                                let rootFolder = game.folders.get(rootFolderId);
                                rootFolder === null || rootFolder === void 0 ? void 0 : rootFolder.update({ color: rootColor });
                                folderTree[rootFolderId].forEach((subfolderId, subIndex) => {
                                    let subfolder = game.folders.get(subfolderId);
                                    let subfolderColor = (subIndex % 2 === 0) ? lightColor1 : lightColor2;
                                    subfolder === null || subfolder === void 0 ? void 0 : subfolder.update({ color: subfolderColor });
                                });
                            });
                        }
                    });
                }
                setTimeout(updateFolderColors, 25);
            }
        }
        Modules.FolderAutoColor = FolderAutoColor;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    var Modules;
    (function (Modules) {
        class FunctionBar {
            static initialize() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!game.user.isGM) {
                        return;
                    }
                    const buttonData = yield FFT.UI.fetchButtonData();
                    const buttons = Object.entries(buttonData).map(([id, { name, icon, script }]) => ({
                        id,
                        title: name,
                        icon,
                        onClick: FFT.UI.resolveFunction(script),
                    }));
                    FFT.UI.createForm({
                        id: 'fft-functionbar',
                        position: { top: '150px', left: '150px' },
                        buttons,
                    });
                });
            }
        }
        Modules.FunctionBar = FunctionBar;
    })(Modules = FFT.Modules || (FFT.Modules = {}));
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
    class Character {
        constructor(actor) {
            var _a, _b;
            this.actor = actor;
            this.background = (_a = actor.items.find(i => i.type === "background")) !== null && _a !== void 0 ? _a : null;
            this.class = (_b = actor.items.find(i => i.type === "class")) !== null && _b !== void 0 ? _b : null;
        }
        addItemsByID(itemIds) {
            return __awaiter(this, void 0, void 0, function* () {
                const items = (yield Promise.all(itemIds.map(id => fromUuid(id)))).filter(Boolean);
                if (!items.length)
                    return;
                yield this.actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
            });
        }
        removeItemsByID(itemIds) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.actor.deleteEmbeddedDocuments("Item", itemIds);
            });
        }
        removeItemsByName(itemNames) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("Attempting to remove items:", itemNames);
                const itemsToRemove = this.actor.items.filter(item => itemNames.includes(item.name));
                console.log("Found items to remove:", itemsToRemove.map(item => item.name));
                if (!itemsToRemove.length)
                    return;
                yield this.actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(item => item.id));
            });
        }
    }
    FFT.Character = Character;
})(FFT || (FFT = {}));
var FFT;
(function (FFT) {
    class Token {
    }
    FFT.Token = Token;
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
var FF;
(function (FF) {
    class CustomDialog {
        constructor(title, content, buttons, defaultButton = "yes", options = {}) {
            this.title = title;
            this.content = content;
            this.buttons = Object.fromEntries(Object.entries(buttons).map(([key, { label, callback }]) => [
                key, { label, callback }
            ]));
            this.defaultButton = defaultButton;
            this.options = options;
        }
        render() {
            new Dialog(Object.assign({ title: this.title, content: this.content, buttons: this.buttons, default: this.defaultButton }, this.options)).render(true);
        }
    }
    FF.CustomDialog = CustomDialog;
})(FF || (FF = {}));
