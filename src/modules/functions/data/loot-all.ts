// Refactored code for better readability and separation of responsibilities

async function lootCorpses(): Promise<void> {
    const playerTokens = getPlayerTokens();
    if (playerTokens.length === 0) {
        ui.notifications?.warn("No player tokens selected.");
        return;
    }

    const deadNpcs = getDeadHostileNpcs();
    if (deadNpcs.length === 0) {
        ui.notifications?.warn("No dead NPCs found.");
        return;
    }

    const selectedItems: Record<string, { playerId: string; color: string; tokenId: string }> = {};
    const lootSections = generateLootSections(deadNpcs, selectedItems);

    if (lootSections.trim() === "") {
        ui.notifications?.warn("No lootable items found.");
        return;
    }

    createLootDialog(playerTokens, deadNpcs, selectedItems, lootSections);
}

function getPlayerTokens(): Token[] {
    const selectedTokens = canvas.tokens?.controlled ?? [];
    return selectedTokens.filter(t => t.actor?.hasPlayerOwner);
}

function getDeadHostileNpcs(): Token[] {
    const allSceneTokens = canvas.tokens?.placeables ?? [];
    return allSceneTokens.filter(token => {
        const actor = token.actor;
        if (!actor) return false;
        const isHostile = token.document.disposition === -1;
        const isEnemy = !actor.hasPlayerOwner;
        const hp = foundry.utils.getProperty(actor.system, "attributes.hp.value");
        const isDead = typeof hp === "number" && hp <= 0;
        return isHostile && isEnemy && isDead;
    });
}

function generateLootSections(deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string }>): string {
    return deadNpcs.map(npc => {
        const actor = npc.actor;
        if (!actor) return "";

        const items = actor.items.filter(item => {
            // Exclude feat, spell types
            if (item.type === "feat" || item.type === "spell") {
                return false;
            }
            
            // For weapons, exclude natural weapons
            if (item.type === "weapon") {
                const weaponType = item.system.type;
                if (weaponType && typeof weaponType === 'object' && 'value' in weaponType && weaponType.value === "natural") {
                    return false;
                }
            }
            
            return true;
        });
        if (items.length === 0) return "";

        const itemIcons = items.map(item => {
            const selection = selectedItems[item.id];
            const isSelected = selection !== undefined;
            const borderColor = isSelected ? selection.color : "transparent";
            const tooltip = isSelected
                ? `Claimed by ${game.users.get(selection.playerId)?.name}`
                : "Click to assign to a selected player token";

            return `
                <div class="item-selector" 
                     data-item-id="${item.id}"
                     data-npc-id="${npc.id}"
                     style="display: inline-block; margin: 0 2px; border: 2px solid ${borderColor}; border-radius: 3px;">
                    <img src="${item.img}" width="30" height="30" data-tooltip="${tooltip}"/>
                </div>
            `;
        }).join("");

        return `
            <div class="npc-loot-section">
                <h3>${actor.name}</h3>
                <div class="item-list">${itemIcons}</div>
            </div>
        `;
    }).join("");
}

function createLootDialog(playerTokens: Token[], deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string }>, lootSections: string): void {
    const playerIcons = playerTokens.map((token, index) => {
        const actor = token.actor;
        if (!actor) return "";
        const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
        const color = colors[index % colors.length];
        return `
            <div class="player-selector" 
                 data-token-id="${token.id}"
                 data-player-color="${color}"
                 style="display: inline-block; margin: 5px; padding: 10px; border: 3px solid transparent; border-radius: 8px; cursor: pointer; text-align: center; background: rgba(0,0,0,0.1);">
                <img src="${actor.img}" width="60" height="60" style="border-radius: 50%; display: block; margin: 0 auto 5px auto;" />
                <div style="font-size: 12px; font-weight: bold;">${actor.name}</div>
            </div>
        `;
    }).join("");

    const dialog: Dialog<DialogOptions> = new Dialog({
        title: "Loot Corpses",
        content: `
            <div style="margin-bottom: 15px;">
                <h3>Select a Character:</h3>
                <div id="player-selection" style="display: flex; flex-wrap: wrap; justify-content: center;">
                    ${playerIcons}
                </div>
                <div id="selected-player" style="text-align: center; margin-top: 10px; font-weight: bold; display: none;">
                    Selected: <span id="selected-player-name"></span>
                </div>
            </div>
            <div style="border-top: 2px solid #ccc; padding-top: 15px;">
                <h3>Click items to assign to selected character:</h3>
                <div style="max-height: 50vh; overflow-y: auto;">
                    ${lootSections}
                </div>
            </div>
            <style>
                .player-selector { transition: border-color 0.2s, background-color 0.2s; }
                .player-selector:hover { background: rgba(255,100,0,0.2) !important; }
                .player-selector.selected { border-color: var(--selected-color) !important; background: var(--selected-bg) !important; }
                .item-selector { cursor: pointer; transition: border 0.2s; }
                .item-selector:hover { border-color: #ff6400 !important; }
                .item-selector.disabled { opacity: 0.5; cursor: not-allowed; }
                [data-tooltip]:hover:after {
                    content: attr(data-tooltip);
                    position: absolute;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1000;
                }
            </style>
        `,
        buttons: {
            distribute: {
                icon: '<i class="fas fa-hand-holding"></i>',
                label: "Distribute Selected",
                callback: async () => distributeLoot(playerTokens, deadNpcs, selectedItems)
            },
            cancel: { label: "Close" }
        },
        default: "cancel",
        render: (html) => setupItemClickHandler($(html), playerTokens, selectedItems, dialog)
    });

    dialog.render(true);
}

async function distributeLoot(playerTokens: Token[], deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string }>): Promise<void> {
    for (const [itemId, selection] of Object.entries(selectedItems)) {
        // Find the item from the dead NPCs
        let sourceItem: any = null;
        let sourceActor: any = null;
        
        for (const npc of deadNpcs) {
            const item = npc.actor?.items.get(itemId);
            if (item) {
                sourceItem = item;
                sourceActor = npc.actor;
                break;
            }
        }
        
        if (!sourceItem || !sourceActor) continue;

        const targetToken = canvas.tokens?.get(selection.tokenId);
        if (targetToken?.actor) {
            // Create a copy of the item data and add it to the target actor
            const itemData = sourceItem.toObject();
            itemData.system.equipped = false; // Ensure transferred items are unequipped
            await targetToken.actor.createEmbeddedDocuments("Item", [itemData]);
            
            // Remove the item from the source actor
            await sourceItem.delete();
        }
    }

    // Clean up empty NPCs (optional - remove if you don't want this behavior)
    for (const npc of deadNpcs) {
        if (!npc.actor) continue;
        const remainingItems = npc.actor.items.filter(i => {
            // Only count lootable items (same filter as in generateLootSections)
            if (i.type === "feat" || i.type === "spell") return false;
            if (i.type === "weapon") {
                const weaponType = i.system.type;
                if (weaponType && typeof weaponType === 'object' && 'value' in weaponType && weaponType.value === "natural") {
                    return false;
                }
            }
            return true;
        });
        
        if (remainingItems.length === 0) {
            await npc.document.delete();
        }
    }

    ui.notifications?.info("Loot distributed to selected characters!");
}

function setupItemClickHandler(html: JQuery, playerTokens: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string }>, dialog: Dialog<DialogOptions>): void {
    let selectedPlayerId: string | null = null;
    let selectedPlayerColor: string = "#000000";

    // Handle player selection
    $(html).find(".player-selector").click((ev) => {
        const tokenId = $(ev.currentTarget).data("token-id");
        const playerColor = $(ev.currentTarget).data("player-color");
        const token = playerTokens.find(t => t.id === tokenId);
        
        if (!token?.actor) return;

        selectedPlayerId = token.actor.id;
        selectedPlayerColor = playerColor;

        // Update UI
        $(html).find(".player-selector").removeClass("selected").css({
            "border-color": "transparent",
            "background": "rgba(0,0,0,0.1)"
        });
        
        $(ev.currentTarget).addClass("selected").css({
            "border-color": playerColor,
            "background": `${playerColor}33`
        });

        $(html).find("#selected-player").show();
        $(html).find("#selected-player-name").text(token.actor.name);

        // Enable item selection
        $(html).find(".item-selector").removeClass("disabled");
    });

    // Handle item selection
    $(html).find(".item-selector").click((ev) => {
        if (!selectedPlayerId) {
            ui.notifications?.warn("Please select a character first.");
            return;
        }

        const itemId = $(ev.currentTarget).data("item-id");
        const currentSelection = selectedItems[itemId];

        // If item is already selected by the same player, deselect it
        if (currentSelection && currentSelection.playerId === selectedPlayerId) {
            delete selectedItems[itemId];
            $(ev.currentTarget).css("border-color", "transparent");
        } else {
            // Select item for current player
            const targetToken = playerTokens.find(t => t.actor?.id === selectedPlayerId);
            if (!targetToken) return;

            selectedItems[itemId] = {
                playerId: selectedPlayerId,
                color: selectedPlayerColor,
                tokenId: targetToken.id
            };

            $(ev.currentTarget).css("border-color", selectedPlayerColor);
        }

        // Update tooltip
        const selection = selectedItems[itemId];
        const tooltip = selection
            ? `Claimed by ${game.users.get(selection.playerId)?.name || "Unknown"}`
            : "Click to assign to selected character";
        $(ev.currentTarget).find("img").attr("data-tooltip", tooltip);
    });

    // Initially disable item selection until a player is chosen
    $(html).find(".item-selector").addClass("disabled");
}