
import { Debug } from "../../utils/debug";

// --- Interfaces ---

export interface WeaponSlot {
    primary: string | null;
    secondary: string | null;
}

export interface WeaponSetsData {
    activeSet: number;
    sets: [WeaponSlot, WeaponSlot, WeaponSlot];
}

export interface ActiveWeapons {
    primary: any | null;
    secondary: any | null;
}

export interface EquipmentSlotsData {
    armor: string | null;
    clothes: string | null;
    trinket1: string | null;
    trinket2: string | null;
    trinket3: string | null;
    trinket4: string | null;
}

// --- Constants ---

const WEAPON_FLAG = "weaponSets";
const EQUIP_FLAG = "equipmentSlots";
const HOOK_NAME = "fftweaks.weaponSetChanged";

const DEFAULT_WEAPONS: WeaponSetsData = {
    activeSet: 0,
    sets: [
        { primary: null, secondary: null },
        { primary: null, secondary: null },
        { primary: null, secondary: null }
    ]
};

const DEFAULT_EQUIP: EquipmentSlotsData = {
    armor: null, clothes: null,
    trinket1: null, trinket2: null, trinket3: null, trinket4: null
};

const EQUIP_SLOT_META: Record<string, { label: string; icon: string }> = {
    armor: { label: "Armor", icon: "fa-duotone fa-solid fa-shirt" },
    clothes: { label: "Clothes", icon: "fas fa-shirt" },
    trinket1: { label: "Trinket", icon: "fas fa-gem" },
    trinket2: { label: "Trinket", icon: "fas fa-gem" },
    trinket3: { label: "Trinket", icon: "fas fa-gem" },
    trinket4: { label: "Trinket", icon: "fas fa-gem" },
};

// --- Shared inline style helpers ---

const SLOT_STYLE = {
    width: "36px",
    height: "36px",
    border: "1px solid #3a3a45",
    borderRadius: "4px",
    background: "rgba(0,0,0,0.34)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative" as any,
    flexShrink: "0"
};

const BIG_SLOT_STYLE = {
    ...SLOT_STYLE,
    width: "75px",
    height: "75px",
};

const CONTEXT_MENU_ID = "fft-equip-item-context";

// Inventory item types shown in panel
const INVENTORY_ITEM_TYPES = new Set(["weapon", "equipment", "tool", "consumable"]);

const INVENTORY_CATEGORIES: { key: string; label: string; icon: string }[] = [
    { key: "weapons", label: "Weapons", icon: "fas fa-sword" },
    { key: "armor", label: "Armor", icon: "fas fa-shield-halved" },
    { key: "clothing", label: "Clothing", icon: "fas fa-shirt" },
    { key: "trinkets", label: "Trinkets", icon: "fas fa-gem" },
    { key: "tools", label: "Tools", icon: "fas fa-screwdriver-wrench" },
    { key: "instruments", label: "Instruments", icon: "fas fa-music" },
    { key: "consumables", label: "Consumables", icon: "fas fa-flask" },
];

// Map item → inventory category based on item.type and equipment subtype (system.type.value)
function getInventoryCategory(item: any): string | null {
    if (item.type === "weapon") return "weapons";
    if (item.type === "tool") {
        const toolType = String(item.system?.type?.value ?? item.system?.toolType ?? "").toLowerCase();
        if (toolType.includes("music") || toolType.includes("instrument") || toolType.includes("musical")) {
            return "instruments";
        }
        return "tools";
    }
    if (item.type === "consumable") return "consumables";
    if (item.type !== "equipment") return null;
    const sub = item.system?.type?.value ?? item.system?.armor?.type ?? "";
    switch (sub) {
        case "heavy": case "medium": case "light": return "armor";
        case "shield": case "rod": case "wand": return "weapons";
        case "clothing": return "clothing";
        case "trinket": case "wondrous": case "ring": return "trinkets";
        default: return "trinkets"; // fallback for unknown equipment subtypes
    }
}

function isValidEquipmentForSlot(item: any, slotName: keyof EquipmentSlotsData): boolean {
    if (!item || item.type !== "equipment") return false;

    const category = getInventoryCategory(item);
    if (!category) return false;

    if (slotName === "armor") return category === "armor";
    if (slotName === "clothes") return category === "clothing";
    if (slotName.startsWith("trinket")) return category === "trinkets";

    return false;
}

// Track collapsed state per category
const _collapsedCategories = new Set<string>();

// ==============================
// Equipment Plugin
// ==============================

export class Equipment {
    private static form: HTMLElement;
    private static _actor: any = null;
    private static _visible = false;

    static initialize() {
        new Equipment();

        Hooks.on("controlToken" as any, (token: any, controlled: boolean) => {
            if (controlled && token.actor?.type === "character") {
                this._actor = token.actor;
                this.refresh();
            }
        });

        // Refresh inventory when items change
        Hooks.on("createItem" as any, (item: any) => {
            if (item.actor?.id === this._actor?.id) this.refresh();
        });
        Hooks.on("deleteItem" as any, (item: any) => {
            if (item.actor?.id === this._actor?.id) this.refresh();
        });
        Hooks.on("updateItem" as any, (item: any) => {
            if (item.actor?.id === this._actor?.id) this.refresh();
        });

        Debug.Log("Equipment | Initialized");
    }

    // --- Toggle ---

    static toggle() {
        if (!this.form) return;
        this._visible = !this._visible;
        this.form.style.display = this._visible ? "flex" : "none";
        if (this._visible) this.refresh();
    }

    // --- Constructor (builds the DOM once) ---

    private constructor() {
        const existing = document.getElementById("fft-equipment-panel");
        if (existing) existing.remove();

        Equipment.form = document.createElement("div");
        Equipment.form.id = "fft-equipment-panel";
        Object.assign(Equipment.form.style, {
            position: "fixed",
            top: "200px",
            left: "200px",
            zIndex: "60",
            display: "none",
            flexDirection: "column",
            padding: "0px",
            background: "rgb(11 10 19 / 85%)",
            border: "1px solid #111",
            boxShadow: "0 0 8px rgba(0,0,0,0.6)",
            borderRadius: "4px",
            userSelect: "none"
        });

        this.buildUI();
        this.makePanelDropUnequipTarget();
        document.body.appendChild(Equipment.form);
    }

    // --- Build UI ---

    private buildUI() {
        // Handle bar
        const handle = document.createElement("div");
        Object.assign(handle.style, {
            height: "30px",
            background: "rgb(0 0 0 / 50%)",
            cursor: "move",
            borderBottom: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            fontSize: "12px",
            color: "#888",
            letterSpacing: "0.5px",
            textTransform: "uppercase" as any,
            borderRadius: "4px 4px 0 0"
        });

        const title = document.createElement("span");
        title.textContent = "Equipment";
        handle.appendChild(title);

        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;";
        Object.assign(closeBtn.style, { cursor: "pointer", fontSize: "18px", color: "#888" });
        closeBtn.addEventListener("click", () => Equipment.toggle());
        handle.appendChild(closeBtn);

        Equipment.form.appendChild(handle);
        this.makeDraggable(handle);

        // Top section: equipment slots (left) + weapon sets (right)
        const topSection = document.createElement("div");
        Object.assign(topSection.style, {
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            borderBottom: "1px solid #222"
        });

        topSection.appendChild(this.buildEquipmentSlotsColumn());
        topSection.appendChild(this.buildWeaponSetsColumn());

        Equipment.form.appendChild(topSection);

        // Bottom: full-width inventory
        Equipment.form.appendChild(this.buildInventoryColumn());
    }

    // --- Weapon Sets (right side of top section) ---

    private buildWeaponSetsColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-weapons";
        Object.assign(col.style, {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            justifyContent: "center",
            padding: "8px 8px 8px 10px",
            minWidth: "136px"
        });

        for (let i = 0; i < 3; i++) {
            const row = document.createElement("div");
            row.dataset.setIndex = String(i);
            row.className = "fft-weapon-row";
            Object.assign(row.style, {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "6px",
                minHeight: "34px",
                padding: "0 4px",
                borderRadius: "4px",
                cursor: "pointer"
            });

            const num = document.createElement("div");
            num.className = "fft-equip-set-label";
            num.textContent = String(i + 1);
            Object.assign(num.style, {
                fontSize: "12px", fontWeight: "bold", color: "#555",
                width: "16px", textAlign: "center"
            });
            row.appendChild(num);

            row.appendChild(this.createWeaponSlot(i, "primary"));
            row.appendChild(this.createWeaponSlot(i, "secondary"));

            row.addEventListener("click", (e) => {
                if ((e.target as HTMLElement).closest(".fft-equip-slot")) return;
                if (!Equipment._actor) return;
                Equipment.setActiveSet(Equipment._actor, i);
            });

            col.appendChild(row);
        }

        return col;
    }

    private createWeaponSlot(setIndex: number, slot: "primary" | "secondary"): HTMLElement {
        const el = document.createElement("div");
        el.className = "fft-equip-slot";
        el.dataset.setIndex = String(setIndex);
        el.dataset.slot = slot;
        el.dataset.slotType = "weapon";
        el.title = slot === "primary" ? "Main Hand" : "Off Hand";
        Object.assign(el.style, SLOT_STYLE);
        el.draggable = true;

        const icon = document.createElement("i");
        icon.className = slot === "primary" ? "fas fa-hand-fist" : "fas fa-shield-halved";
        Object.assign(icon.style, { color: "#444", fontSize: "14px" });
        el.appendChild(icon);

        el.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!Equipment._actor) return;
            await Equipment.clearWeaponSlot(Equipment._actor, setIndex, slot);
        });

        el.addEventListener("dragstart", (e: DragEvent) => {
            const uuid = el.dataset.itemUuid;
            if (!uuid) {
                e.preventDefault();
                return;
            }
            e.dataTransfer?.setData("text/plain", JSON.stringify({
                type: "Item",
                uuid,
                source: { kind: "weapon-slot", setIndex, slot }
            }));
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        });

        this.makeDropTarget(el, async (drop) => {
            if (!Equipment._actor) return;
            if (
                drop?.source?.kind === "weapon-slot"
                && typeof drop.source.setIndex === "number"
                && (drop.source.slot === "primary" || drop.source.slot === "secondary")
            ) {
                await Equipment.swapWeaponSlots(
                    Equipment._actor,
                    drop.source.setIndex,
                    drop.source.slot,
                    setIndex,
                    slot
                );
                return;
            }
            const uuid = drop?.uuid;
            if (!uuid) return;
            const item = Equipment._actor.items.find((i: any) => i.uuid === uuid);
            if (item && (item.type === "weapon" || item.type === "equipment")) {
                await Equipment.setWeaponSlot(Equipment._actor, setIndex, slot, uuid);
            }
        });

        return el;
    }

    // --- Equipment Slots (left side of top section) ---

    private buildEquipmentSlotsColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-gear";
        Object.assign(col.style, {
            display: "flex",
            flexDirection: "column",
            width: "156px",
            padding: "8px",
            gap: "6px"
        });

        // Big slots row: Armor + Clothes
        const bigRow = document.createElement("div");
        Object.assign(bigRow.style, { display: "flex", gap: "6px" });
        bigRow.appendChild(this.createEquipSlot("armor", true));
        bigRow.appendChild(this.createEquipSlot("clothes", true));
        col.appendChild(bigRow);

        // Trinkets row: 4 small slots aligned under big ones
        const trinketRow = document.createElement("div");
        Object.assign(trinketRow.style, { display: "flex", gap: "4px", justifyContent: "space-between" });
        trinketRow.appendChild(this.createEquipSlot("trinket1", false));
        trinketRow.appendChild(this.createEquipSlot("trinket2", false));
        trinketRow.appendChild(this.createEquipSlot("trinket3", false));
        trinketRow.appendChild(this.createEquipSlot("trinket4", false));
        col.appendChild(trinketRow);

        return col;
    }

    private createEquipSlot(slotName: string, big: boolean): HTMLElement {
        const meta = EQUIP_SLOT_META[slotName];
        const el = document.createElement("div");
        el.className = "fft-equip-slot";
        el.dataset.equipSlot = slotName;
        el.dataset.slotType = "gear";
        el.dataset.slotSize = big ? "big" : "small";
        el.title = meta.label;
        Object.assign(el.style, big ? BIG_SLOT_STYLE : SLOT_STYLE);
        el.draggable = true;

        const icon = document.createElement("i");
        icon.className = meta.icon;
        Object.assign(icon.style, { color: "#444", fontSize: big ? "22px" : "14px" });
        el.appendChild(icon);

        // Label under big slots
        if (big) {
            const label = document.createElement("div");
            label.textContent = meta.label;
            Object.assign(label.style, {
                position: "absolute",
                bottom: "2px",
                left: "0",
                right: "0",
                textAlign: "center",
                fontSize: "8px",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                pointerEvents: "none"
            });
            el.appendChild(label);
        }

        el.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!Equipment._actor) return;
            await Equipment.clearEquipmentSlot(Equipment._actor, slotName as keyof EquipmentSlotsData);
        });

        el.addEventListener("dragstart", (e: DragEvent) => {
            const uuid = el.dataset.itemUuid;
            if (!uuid) {
                e.preventDefault();
                return;
            }
            e.dataTransfer?.setData("text/plain", JSON.stringify({
                type: "Item",
                uuid,
                source: { kind: "gear-slot", slotName }
            }));
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        });

        this.makeDropTarget(el, async (drop) => {
            if (!Equipment._actor) return;
            const uuid = drop?.uuid;
            if (!uuid) return;
            const item = Equipment._actor.items.find((i: any) => i.uuid === uuid);
            if (item && item.type === "equipment") {
                await Equipment.setEquipmentSlot(Equipment._actor, slotName as keyof EquipmentSlotsData, uuid);
            }
        });

        return el;
    }

    // --- Inventory (full width, bottom) ---

    private buildInventoryColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-inventory";
        Object.assign(col.style, { display: "flex", flexDirection: "column", padding: "0" });

        const scrollArea = document.createElement("div");
        scrollArea.id = "fft-equip-inv-grid";
        Object.assign(scrollArea.style, {
            overflowY: "auto",
            maxHeight: "300px",
            padding: "8px"
        });

        col.appendChild(scrollArea);
        return col;
    }

    // --- Shared: drop target helper ---

    private makeDropTarget(el: HTMLElement, onDrop: (drop: any) => Promise<void>) {
        el.addEventListener("dragover", (e) => {
            e.preventDefault();
            el.style.borderColor = "#8cf";
        });
        el.addEventListener("dragleave", () => {
            el.style.borderColor = "#444";
        });
        el.addEventListener("drop", async (e) => {
            e.preventDefault();
            el.style.borderColor = "#444";
            try {
                const raw = e.dataTransfer?.getData("text/plain");
                if (!raw) return;
                const drop = JSON.parse(raw);
                if (drop.type === "Item" && drop.uuid) {
                    await onDrop(drop);
                }
            } catch (err) {
                Debug.Warn("Equipment | Drop failed", err);
            }
        });
    }

    private makePanelDropUnequipTarget() {
        Equipment.form.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        Equipment.form.addEventListener("drop", async (e) => {
            if (!Equipment._actor) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest(".fft-equip-slot")) return;

            try {
                const raw = e.dataTransfer?.getData("text/plain");
                if (!raw) return;
                const drop = JSON.parse(raw);
                if (drop?.type !== "Item" || !drop?.uuid) return;

                const item = Equipment._actor.items.find((i: any) => i.uuid === drop.uuid);
                if (!item?.system?.equipped) return;

                e.preventDefault();
                e.stopPropagation();
                await Equipment.unequipItemWithinPanel(Equipment._actor, drop.uuid);
            } catch (err) {
                Debug.Warn("Equipment | Unequip drop failed", err);
            }
        });
    }

    // --- Drag handle ---

    private makeDraggable(handle: HTMLElement) {
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        const onMouseMove = (event: MouseEvent) => {
            offsetX = event.clientX - mouseX;
            offsetY = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            const rect = Equipment.form.getBoundingClientRect();
            Equipment.form.style.left = rect.left + offsetX + "px";
            Equipment.form.style.top = rect.top + offsetY + "px";
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        handle.addEventListener("mousedown", (event: MouseEvent) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    // ==============================
    // Weapon Sets API
    // ==============================

    static async getWeaponSets(actor: any): Promise<WeaponSetsData> {
        const stored = actor.getFlag("fftweaks", WEAPON_FLAG);
        if (stored) return stored as WeaponSetsData;
        return JSON.parse(JSON.stringify(DEFAULT_WEAPONS));
    }

    static async setActiveSet(actor: any, index: number) {
        if (index < 0 || index > 2) return;
        const data = await this.getWeaponSets(actor);
        data.activeSet = index;
        await actor.setFlag("fftweaks", WEAPON_FLAG, data);
        await this._equipActiveWeaponSet(actor, data);
        await this._fireHook(actor, data);
        this.refresh();
    }

    static async setWeaponSlot(actor: any, setIndex: number, slot: "primary" | "secondary", itemUuid: string) {
        const data = await this.getWeaponSets(actor);
        data.sets[setIndex][slot] = itemUuid;
        await actor.setFlag("fftweaks", WEAPON_FLAG, data);
        if (setIndex === data.activeSet) {
            await this._equipActiveWeaponSet(actor, data);
            await this._fireHook(actor, data);
        }
        this.refresh();
    }

    static async swapWeaponSlots(
        actor: any,
        sourceSetIndex: number,
        sourceSlot: "primary" | "secondary",
        targetSetIndex: number,
        targetSlot: "primary" | "secondary"
    ) {
        if (sourceSetIndex === targetSetIndex && sourceSlot === targetSlot) return;
        const data = await this.getWeaponSets(actor);
        const sourceValue = data.sets[sourceSetIndex]?.[sourceSlot] ?? null;
        const targetValue = data.sets[targetSetIndex]?.[targetSlot] ?? null;
        data.sets[targetSetIndex][targetSlot] = sourceValue;
        data.sets[sourceSetIndex][sourceSlot] = targetValue;
        await actor.setFlag("fftweaks", WEAPON_FLAG, data);

        if (data.activeSet === sourceSetIndex || data.activeSet === targetSetIndex) {
            await this._equipActiveWeaponSet(actor, data);
            await this._fireHook(actor, data);
        }

        this.refresh();
    }

    static async clearWeaponSlot(actor: any, setIndex: number, slot: "primary" | "secondary") {
        const data = await this.getWeaponSets(actor);
        const oldUuid = data.sets[setIndex][slot];
        data.sets[setIndex][slot] = null;
        await actor.setFlag("fftweaks", WEAPON_FLAG, data);
        if (setIndex === data.activeSet && oldUuid) {
            const item = actor.items.find((i: any) => i.uuid === oldUuid);
            if (item?.system?.equipped) await item.update({ "system.equipped": false });
            await this._fireHook(actor, data);
        }
        this.refresh();
    }

    static async getActiveWeapons(actor: any): Promise<ActiveWeapons> {
        const data = await this.getWeaponSets(actor);
        const s = data.sets[data.activeSet];
        return {
            primary: s.primary ? actor.items.find((i: any) => i.uuid === s.primary) ?? null : null,
            secondary: s.secondary ? actor.items.find((i: any) => i.uuid === s.secondary) ?? null : null
        };
    }

    private static async _equipActiveWeaponSet(actor: any, data: WeaponSetsData) {
        const activeSet = data.sets[data.activeSet];
        const activeUuids = new Set([activeSet.primary, activeSet.secondary].filter(Boolean));
        const allSetUuids = new Set<string>();
        for (const set of data.sets) {
            if (set.primary) allSetUuids.add(set.primary);
            if (set.secondary) allSetUuids.add(set.secondary);
        }
        for (const item of actor.items) {
            if (!allSetUuids.has(item.uuid)) continue;
            const shouldEquip = activeUuids.has(item.uuid);
            if (item.system?.equipped !== shouldEquip) {
                await item.update({ "system.equipped": shouldEquip });
            }
        }
    }

    private static async _fireHook(actor: any, data: WeaponSetsData) {
        const weapons = await this.getActiveWeapons(actor);
        Hooks.callAll(HOOK_NAME as any, {
            actor, activeSet: data.activeSet, sets: data.sets,
            primary: weapons.primary, secondary: weapons.secondary
        });
    }

    // ==============================
    // Equipment Slots API
    // ==============================

    static async getEquipmentSlots(actor: any): Promise<EquipmentSlotsData> {
        const stored = actor.getFlag("fftweaks", EQUIP_FLAG);
        if (stored) return stored as EquipmentSlotsData;
        return JSON.parse(JSON.stringify(DEFAULT_EQUIP));
    }

    static async setEquipmentSlot(actor: any, slotName: keyof EquipmentSlotsData, itemUuid: string) {
        const newItem = actor.items.find((i: any) => i.uuid === itemUuid);
        if (!isValidEquipmentForSlot(newItem, slotName)) {
            ui.notifications?.warn("That item cannot be equipped in this slot.");
            return;
        }

        const data = await this.getEquipmentSlots(actor);
        // Unequip old item in this slot
        const oldUuid = data[slotName];
        if (oldUuid) {
            const oldItem = actor.items.find((i: any) => i.uuid === oldUuid);
            if (oldItem?.system?.equipped) await oldItem.update({ "system.equipped": false });
        }
        data[slotName] = itemUuid;
        await actor.setFlag("fftweaks", EQUIP_FLAG, data);
        // Equip new item
        if (newItem && !newItem.system?.equipped) await newItem.update({ "system.equipped": true });
        this.refresh();
    }

    private static async quickEquipItem(actor: any, item: any) {
        if (!item) return;

        if (item.type === "weapon") {
            const sets = await this.getWeaponSets(actor);
            const active = sets.activeSet;
            const set = sets.sets[active];
            const slot: "primary" | "secondary" = !set.primary ? "primary" : (!set.secondary ? "secondary" : "primary");
            await this.setWeaponSlot(actor, active, slot, item.uuid);
            return;
        }

        if (item.type === "equipment") {
            const category = getInventoryCategory(item);
            if (category === "armor") {
                await this.setEquipmentSlot(actor, "armor", item.uuid);
                return;
            }
            if (category === "clothing") {
                await this.setEquipmentSlot(actor, "clothes", item.uuid);
                return;
            }
            if (category === "trinkets") {
                const eq = await this.getEquipmentSlots(actor);
                const target = (Object.keys(eq) as (keyof EquipmentSlotsData)[])
                    .find((k) => k.startsWith("trinket") && !eq[k]) ?? "trinket1";
                await this.setEquipmentSlot(actor, target, item.uuid);
                return;
            }
            if (category === "weapons") {
                const sets = await this.getWeaponSets(actor);
                const active = sets.activeSet;
                const set = sets.sets[active];
                const slot: "primary" | "secondary" = !set.secondary ? "secondary" : (!set.primary ? "primary" : "secondary");
                await this.setWeaponSlot(actor, active, slot, item.uuid);
                return;
            }
        }

        if (item.system && typeof item.system.equipped !== "undefined") {
            await item.update({ "system.equipped": true });
            this.refresh();
            return;
        }

        ui.notifications?.warn("This item cannot be equipped.");
    }

    private static removeContextMenu() {
        const existing = document.getElementById(CONTEXT_MENU_ID);
        if (existing) existing.remove();
    }

    private static showInventoryItemContextMenu(item: any, x: number, y: number) {
        this.removeContextMenu();
        const menu = document.createElement("div");
        menu.id = CONTEXT_MENU_ID;
        Object.assign(menu.style, {
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
            zIndex: "10000",
            minWidth: "130px",
            background: "rgba(11,10,19,0.98)",
            border: "1px solid #2f3340",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            padding: "4px"
        });

        const addAction = (label: string, onClick: () => Promise<void> | void) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = label;
            Object.assign(btn.style, {
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "0",
                color: "#d3d7e2",
                fontSize: "12px",
                padding: "6px 8px",
                borderRadius: "3px",
                cursor: "pointer"
            });
            btn.addEventListener("mouseenter", () => (btn.style.background = "rgba(255,255,255,0.08)"));
            btn.addEventListener("mouseleave", () => (btn.style.background = "transparent"));
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeContextMenu();
                await onClick();
            });
            menu.appendChild(btn);
        };

        addAction("Equip", async () => {
            if (!this._actor) return;
            await this.quickEquipItem(this._actor, item);
        });

        addAction("Show Item", () => {
            item.sheet?.render(true);
        });

        addAction("Use", async () => {
            if (typeof item.use === "function") {
                await item.use();
                return;
            }
            if (typeof item.roll === "function") {
                await item.roll();
                return;
            }
            ui.notifications?.warn("This item has no use action.");
        });

        document.body.appendChild(menu);

        requestAnimationFrame(() => {
            const onDocClick = () => {
                this.removeContextMenu();
                document.removeEventListener("click", onDocClick, true);
                document.removeEventListener("contextmenu", onDocClick, true);
            };
            document.addEventListener("click", onDocClick, true);
            document.addEventListener("contextmenu", onDocClick, true);
        });
    }

    static async clearEquipmentSlot(actor: any, slotName: keyof EquipmentSlotsData) {
        const data = await this.getEquipmentSlots(actor);
        const oldUuid = data[slotName];
        if (!oldUuid) return;
        const item = actor.items.find((i: any) => i.uuid === oldUuid);
        if (item?.system?.equipped) await item.update({ "system.equipped": false });
        data[slotName] = null;
        await actor.setFlag("fftweaks", EQUIP_FLAG, data);
        this.refresh();
    }

    static async unequipItemWithinPanel(actor: any, itemUuid: string) {
        const item = actor.items.find((i: any) => i.uuid === itemUuid);
        if (item?.system?.equipped) {
            await item.update({ "system.equipped": false });
        }

        let weaponDataChanged = false;
        const weaponData = await this.getWeaponSets(actor);
        for (const set of weaponData.sets) {
            if (set.primary === itemUuid) {
                set.primary = null;
                weaponDataChanged = true;
            }
            if (set.secondary === itemUuid) {
                set.secondary = null;
                weaponDataChanged = true;
            }
        }
        if (weaponDataChanged) {
            await actor.setFlag("fftweaks", WEAPON_FLAG, weaponData);
            await this._equipActiveWeaponSet(actor, weaponData);
            await this._fireHook(actor, weaponData);
        }

        let equipDataChanged = false;
        const equipData = await this.getEquipmentSlots(actor);
        for (const key of Object.keys(equipData) as (keyof EquipmentSlotsData)[]) {
            if (equipData[key] === itemUuid) {
                equipData[key] = null;
                equipDataChanged = true;
            }
        }
        if (equipDataChanged) {
            await actor.setFlag("fftweaks", EQUIP_FLAG, equipData);
        }

        this.refresh();
    }

    // ==============================
    // UI Refresh
    // ==============================

    static async refresh() {
        if (!this.form || !this._actor) return;

        // --- Refresh weapon sets ---
        const wData = await this.getWeaponSets(this._actor);
        for (let i = 0; i < 3; i++) {
            const row = this.form.querySelector(`.fft-weapon-row[data-set-index="${i}"]`) as HTMLElement;
            if (!row) continue;
            const isActive = wData.activeSet === i;
            row.style.background = isActive ? "rgba(255,255,255,0.08)" : "transparent";
            const label = row.querySelector(".fft-equip-set-label") as HTMLElement;
            if (label) label.style.color = isActive ? "#ccc" : "#555";
        }

        // Update weapon slot contents
        const weaponSlots = this.form.querySelectorAll('.fft-equip-slot[data-slot-type="weapon"]') as NodeListOf<HTMLElement>;
        for (const slotEl of weaponSlots) {
            const setIdx = Number(slotEl.dataset.setIndex);
            const slotName = slotEl.dataset.slot as "primary" | "secondary";
            const uuid = wData.sets[setIdx]?.[slotName];
            this._renderSlotContent(slotEl, uuid, slotName === "primary" ? "fas fa-hand-fist" : "fas fa-shield-halved");
        }

        // --- Refresh equipment slots ---
        const eData = await this.getEquipmentSlots(this._actor);
        const equipSlots = this.form.querySelectorAll('.fft-equip-slot[data-slot-type="gear"]') as NodeListOf<HTMLElement>;
        for (const slotEl of equipSlots) {
            const slotName = slotEl.dataset.equipSlot as string;
            const uuid = (eData as any)[slotName];
            const meta = EQUIP_SLOT_META[slotName];
            this._renderSlotContent(slotEl, uuid, meta?.icon ?? "fas fa-gem");
        }

        // --- Refresh inventory ---
        this._refreshInventory();
    }

    private static _renderSlotContent(slotEl: HTMLElement, uuid: string | null, placeholderIcon: string) {
        slotEl.innerHTML = "";
        slotEl.dataset.itemUuid = uuid ?? "";
        const item = uuid ? this._actor.items.find((i: any) => i.uuid === uuid) : null;
        if (item) {
            const img = document.createElement("img");
            img.src = item.img;
            img.alt = item.name;
            img.draggable = false;
            Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", borderRadius: "3px" });
            img.addEventListener("dblclick", (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.sheet?.render(true);
            });
            slotEl.appendChild(img);
            slotEl.title = item.name;
        } else {
            const icon = document.createElement("i");
            icon.className = placeholderIcon;
            const iconSize = slotEl.dataset.slotSize === "big" ? "22px" : "14px";
            Object.assign(icon.style, { color: "#444", fontSize: iconSize });
            slotEl.appendChild(icon);
        }
    }

    private static _refreshInventory() {
        const container = this.form.querySelector("#fft-equip-inv-grid");
        if (!container || !this._actor) return;
        container.innerHTML = "";

        // Group equippable items by inventory category
        const grouped = new Map<string, any[]>();
        for (const item of this._actor.items) {
            if (!INVENTORY_ITEM_TYPES.has(item.type)) continue;
            const cat = getInventoryCategory(item);
            if (!cat) continue;
            if (!grouped.has(cat)) grouped.set(cat, []);
            grouped.get(cat)!.push(item);
        }

        // Render in category order
        for (const cat of INVENTORY_CATEGORIES) {
            const items = grouped.get(cat.key);
            if (!items || items.length === 0) continue;
            items.sort((a: any, b: any) => a.name.localeCompare(b.name));

            const collapsed = _collapsedCategories.has(cat.key);

            // Category header
            const header = document.createElement("div");
            Object.assign(header.style, {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 2px",
                cursor: "pointer",
                fontSize: "11px",
                color: "#999",
                borderBottom: "1px solid #222",
                marginBottom: "4px",
                userSelect: "none"
            });

            const arrow = document.createElement("i");
            arrow.className = collapsed ? "fas fa-caret-right" : "fas fa-caret-down";
            Object.assign(arrow.style, { fontSize: "10px", width: "10px", textAlign: "center", color: "#666" });
            header.appendChild(arrow);

            const catIcon = document.createElement("i");
            catIcon.className = cat.icon;
            Object.assign(catIcon.style, { fontSize: "11px", color: "#666" });
            header.appendChild(catIcon);

            const catLabel = document.createElement("span");
            catLabel.textContent = `${cat.label} (${items.length})`;
            header.appendChild(catLabel);

            header.addEventListener("click", () => {
                if (_collapsedCategories.has(cat.key)) {
                    _collapsedCategories.delete(cat.key);
                } else {
                    _collapsedCategories.add(cat.key);
                }
                this._refreshInventory();
            });

            container.appendChild(header);

            if (collapsed) continue;

            // Item grid for this category
            const grid = document.createElement("div");
            Object.assign(grid.style, {
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: "6px",
                alignContent: "flex-start"
            });

            for (const item of items) {
                const cell = document.createElement("div");
                Object.assign(cell.style, {
                    ...SLOT_STYLE,
                    cursor: "grab",
                    border: "1px solid #333"
                });
                cell.title = item.name;
                cell.draggable = true;

                cell.addEventListener("dragstart", (e: DragEvent) => {
                    e.dataTransfer?.setData("text/plain", JSON.stringify({ type: "Item", uuid: item.uuid }));
                });

                cell.addEventListener("dblclick", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.sheet?.render(true);
                });

                cell.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    Equipment.showInventoryItemContextMenu(item, e.clientX, e.clientY);
                });

                const img = document.createElement("img");
                img.src = item.img;
                img.alt = item.name;
                img.draggable = false;
                Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", borderRadius: "3px" });
                cell.appendChild(img);

                const qty = item.system?.quantity;
                if (qty && qty > 1) {
                    const badge = document.createElement("span");
                    badge.textContent = String(qty);
                    Object.assign(badge.style, {
                        position: "absolute",
                        bottom: "1px",
                        right: "2px",
                        fontSize: "9px",
                        color: "#fff",
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: "2px",
                        padding: "0 2px",
                        lineHeight: "1.2"
                    });
                    cell.appendChild(badge);
                }

                grid.appendChild(cell);
            }

            container.appendChild(grid);
        }

    }
}
