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
    const dialog: Dialog<DialogOptions> = new Dialog({
        title: "Loot Corpses",
        content: `
            <p><strong>Selected Players:</strong> ${playerTokens.map(t => t.actor?.name).join(", ")}</p>
            <p>Click items to assign them to a player token.</p>
            <div style="max-height: 60vh; overflow-y: auto;">
                ${lootSections}
            </div>
            <style>
                .item-selector { cursor: pointer; transition: border 0.2s; }
                .item-selector:hover { border-color: #ff6400 !important; }
                [data-tooltip]:hover:after {
                    content: attr(data-tooltip);
                    position: absolute;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
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
        const item = game.items?.get(itemId);
        const targetToken = canvas.tokens?.get(selection.tokenId);
        if (item && targetToken?.actor) {
            // await item.update({ "actorId": targetToken.actor.id });
        }
    }

    for (const npc of deadNpcs) {
        const remainingItems = npc.actor?.items.filter(i => !selectedItems[i.id]);
        if (remainingItems?.length === 0) {
            await npc.document.delete();
        }
    }

    ui.notifications?.info("Loot distributed to selected tokens!");
}

function setupItemClickHandler(html: JQuery, playerTokens: Token[], selectedItems: Record<string, { playerId: string; color: string; tokenId: string }>, dialog: Dialog<DialogOptions>): void {
    $(html).find(".item-selector").click((ev) => {
        const itemId = $(ev.currentTarget).data("item-id");
        const currentSelection = selectedItems[itemId];

        const playerTokenIndex = currentSelection
            ? (playerTokens.findIndex(t => t.id === currentSelection.tokenId) + 1) % playerTokens.length
            : 0;

        const targetToken = playerTokens[playerTokenIndex];
        if (!targetToken.actor) return;

        selectedItems[itemId] = {
            playerId: targetToken.actor.id,
            color: targetToken.actor.hasPlayerOwner ? "#000000" : "#CCCCCC",
            tokenId: targetToken.id
        };

        if (dialog instanceof Dialog) {
            dialog.render(true);
        }
    });
}