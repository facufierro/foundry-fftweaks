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

    const selectedItems: Record<string, { playerId: string; color: string; tokenId: string; playerName: string }> = {};
    const lootSections = generateLootSections(deadNpcs, selectedItems, playerTokens);

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

function generateLootSections(deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string; playerName: string }>, playerTokens: Token[]): string {
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
            const claimedLabel = isSelected 
                ? `<div class="item-claimed-portrait" style="position: absolute; bottom: -3px; right: -3px; width: 24px; height: 24px; border: 2px solid ${selection.color}; border-radius: 50%; overflow: hidden; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.7); background: white;"><img src="${getPlayerPortrait(selection.playerId, playerTokens)}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
                : "";

            return `
                <div class="item-selector" 
                     data-item-id="${item.id}"
                     data-npc-id="${npc.id}"
                     style="display: inline-block; margin: 0 2px; border: 3px solid ${borderColor}; border-radius: 5px; position: relative; box-shadow: ${isSelected ? `0 0 8px ${selection.color}55` : '0 2px 4px rgba(0,0,0,0.1)'};">
                    <img src="${item.img}" width="38" height="38" style="display: block; border-radius: 2px;" />
                    ${claimedLabel}
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

function createLootDialog(playerTokens: Token[], deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string; playerName: string }>, lootSections: string): void {
    const playerIcons = playerTokens.map((token, index) => {
        const actor = token.actor;
        if (!actor) return "";
        
        // Get the user color from the actor's player owner (not GM)
        let userColor = "#ff4444"; // fallback color
        const ownership = actor.ownership;
        for (const [userId, level] of Object.entries(ownership)) {
            if (level === 3 && userId !== "default") { // OWNER level
                const user = game.users?.get(userId);
                if (user?.color && user.role !== 4) { // role 4 is GAMEMASTER
                    userColor = user.color;
                    break;
                }
            }
        }
        
        return `
            <div class="player-selector" 
                 data-token-id="${token.id}"
                 data-player-color="${userColor}"
                 style="display: inline-block; margin: 8px; padding: 5px; border: 3px solid transparent; border-radius: 50%; cursor: pointer; background: rgba(0,0,0,0.1); width: 70px; height: 70px; overflow: hidden;">
                <img src="${actor.img}" width="60" height="60" style="border-radius: 50%; display: block; width: 100%; height: 100%; object-fit: cover;" />
            </div>
        `;
    }).join("");

    const dialog: Dialog<DialogOptions> = new Dialog({
        title: "Loot Corpses",
        content: `
            <div style="margin-bottom: 20px;">
                <div id="player-selection" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                    ${playerIcons}
                </div>
            </div>
            <div style="border-top: 2px solid #ccc; padding-top: 20px;">
                <div style="max-height: 70vh; overflow-y: auto;">
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
                .loot-tooltip {
                    position: absolute;
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 10000;
                    pointer-events: none;
                    max-width: 200px;
                    word-wrap: break-word;
                    display: none;
                }
                /* Force buttons to bottom */
                .dialog .dialog-buttons {
                    position: absolute !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    margin: 0 !important;
                    border-top: 1px solid #ccc !important;
                    background: #f0f0f0 !important;
                }
                .dialog .dialog-content {
                    padding-bottom: 60px !important;
                }
            </style>
        `,
        buttons: {
            distribute: {
                icon: '<i class="fas fa-hand-holding"></i>',
                label: "Distribute Selected",
                callback: async () => distributeLoot(playerTokens, deadNpcs, selectedItems)
            }
        },
        default: "distribute",
        render: (html) => {
            setupItemClickHandler($(html), playerTokens, selectedItems, dialog);
            
            // Initialize visual state for already selected items
            $(html).find('.item-selector').each((index, element) => {
                const itemId = $(element).data('item-id');
                const selection = selectedItems[itemId];
                if (selection) {
                    updateItemVisuals($(element), selection, playerTokens);
                }
            });
        }
    }, {
        width: 800,
        height: 600,
        resizable: true
    });

    dialog.render(true);
}

async function distributeLoot(playerTokens: Token[], deadNpcs: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string; playerName: string }>): Promise<void> {
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

function setupItemClickHandler(html: JQuery, playerTokens: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string; playerName: string }>, dialog: Dialog<DialogOptions>): void {
    let selectedPlayerId: string | null = null;
    let selectedPlayerColor: string = "#000000";

    // Create tooltip element
    const tooltip = $('<div class="loot-tooltip"></div>').appendTo('body');

    // Handle tooltip showing/hiding
    $(html).on('mouseenter', '.item-selector img', function(ev) {
        const itemId = $(this).closest('.item-selector').data('item-id');
        const selection = selectedItems[itemId];
        const tooltipText = selection
            ? `Claimed by ${playerTokens.find(t => t.actor?.id === selection.playerId)?.actor?.name || "Unknown"}`
            : "Click to assign to selected character";
        
        tooltip.text(tooltipText).show();
        
        const mouseX = ev.pageX;
        const mouseY = ev.pageY;
        
        tooltip.css({
            left: mouseX + 10,
            top: mouseY - 30
        });
    });

    $(html).on('mouseleave', '.item-selector img', function() {
        tooltip.hide();
    });

    $(html).on('mousemove', '.item-selector img', function(ev) {
        if (tooltip.is(':visible')) {
            tooltip.css({
                left: ev.pageX + 10,
                top: ev.pageY - 30
            });
        }
    });

    // Clean up tooltip when dialog closes
    $(html).closest('.dialog').on('remove', function() {
        tooltip.remove();
    });

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
            updateItemVisuals($(ev.currentTarget), null, playerTokens);
        } else {
            // Select item for current player
            const targetToken = playerTokens.find(t => t.actor?.id === selectedPlayerId);
            if (!targetToken?.actor) return;

            selectedItems[itemId] = {
                playerId: selectedPlayerId,
                color: selectedPlayerColor,
                tokenId: targetToken.id,
                playerName: targetToken.actor.name
            };

            updateItemVisuals($(ev.currentTarget), selectedItems[itemId], playerTokens);
        }
    });

    // Initially disable item selection until a player is chosen
    $(html).find(".item-selector").addClass("disabled");
}

function updateItemVisuals(itemElement: JQuery, selection: { playerId: string; color: string; tokenId: string; playerName: string } | null, playerTokens: Token[]): void {
    if (selection) {
        // Item is claimed - add border, glow, and label
        itemElement.css({
            "border-color": selection.color,
            "border-width": "3px",
            "box-shadow": `0 0 8px ${selection.color}55`
        });
        
        // Remove existing label if any
        itemElement.find('.item-claimed-portrait').remove();
        
        // Add new portrait label
        const claimedPortrait = `<div class="item-claimed-portrait" style="position: absolute; bottom: -3px; right: -3px; width: 24px; height: 24px; border: 2px solid ${selection.color}; border-radius: 50%; overflow: hidden; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.7); background: white;"><img src="${getPlayerPortrait(selection.playerId, playerTokens)}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
        itemElement.append(claimedPortrait);
    } else {
        // Item is unclaimed - remove border, glow, and label
        itemElement.css({
            "border-color": "transparent",
            "border-width": "3px",
            "box-shadow": "0 2px 4px rgba(0,0,0,0.1)"
        });
        itemElement.find('.item-claimed-portrait').remove();
    }
}

function getPlayerPortrait(playerId: string, playerTokens: Token[]): string {
    // Find the player token by actor ID
    const playerToken = playerTokens.find(token => token.actor?.id === playerId);
    return playerToken?.actor?.img || "icons/svg/mystery-man.svg";
}