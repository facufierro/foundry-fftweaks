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
    armor: { label: "Armor", icon: "fas fa-shield-halved" },
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
    border: "1px solid #444",
    borderRadius: "4px",
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative" as any,
    flexShrink: "0"
};

const SECTION_LABEL_STYLE = {
    fontSize: "9px",
    color: "#666",
    textTransform: "uppercase" as any,
    letterSpacing: "0.5px",
    padding: "4px 4px 2px",
    textAlign: "center" as any
};

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
        document.body.appendChild(Equipment.form);
    }

    // --- Build UI ---

    private buildUI() {
        // Handle bar
        const handle = document.createElement("div");
        Object.assign(handle.style, {
            height: "22px",
            background: "rgb(0 0 0 / 50%)",
            cursor: "move",
            borderBottom: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 6px",
            fontSize: "10px",
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
        Object.assign(closeBtn.style, { cursor: "pointer", fontSize: "14px", color: "#888" });
        closeBtn.addEventListener("click", () => Equipment.toggle());
        handle.appendChild(closeBtn);

        Equipment.form.appendChild(handle);
        this.makeDraggable(handle);

        // Body — 3 columns
        const body = document.createElement("div");
        Object.assign(body.style, {
            display: "flex",
            flexDirection: "row"
        });

        body.appendChild(this.buildWeaponSetsColumn());
        body.appendChild(this.buildSeparator());
        body.appendChild(this.buildEquipmentSlotsColumn());
        body.appendChild(this.buildSeparator());
        body.appendChild(this.buildInventoryColumn());

        Equipment.form.appendChild(body);
    }

    private buildSeparator(): HTMLElement {
        const sep = document.createElement("div");
        Object.assign(sep.style, { width: "1px", background: "#222", flexShrink: "0" });
        return sep;
    }

    // --- Left Column: Weapon Sets ---

    private buildWeaponSetsColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-weapons";
        Object.assign(col.style, { display: "flex", flexDirection: "column", padding: "0" });

        const label = document.createElement("div");
        Object.assign(label.style, SECTION_LABEL_STYLE);
        label.textContent = "Weapons";
        col.appendChild(label);

        for (let i = 0; i < 3; i++) {
            const row = document.createElement("div");
            row.dataset.setIndex = String(i);
            row.className = "fft-weapon-row";
            Object.assign(row.style, {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "3px",
                padding: "3px 4px",
                cursor: "pointer"
            });

            const num = document.createElement("div");
            num.className = "fft-equip-set-label";
            num.textContent = String(i + 1);
            Object.assign(num.style, {
                fontSize: "10px", fontWeight: "bold", color: "#555",
                width: "12px", textAlign: "center"
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

        this.makeDropTarget(el, async (uuid) => {
            if (!Equipment._actor) return;
            const item = Equipment._actor.items.find((i: any) => i.uuid === uuid);
            if (item && (item.type === "weapon" || item.type === "equipment")) {
                await Equipment.setWeaponSlot(Equipment._actor, setIndex, slot, uuid);
            }
        });

        return el;
    }

    // --- Center Column: Equipment Slots ---

    private buildEquipmentSlotsColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-gear";
        Object.assign(col.style, { display: "flex", flexDirection: "column", padding: "0" });

        const label = document.createElement("div");
        Object.assign(label.style, SECTION_LABEL_STYLE);
        label.textContent = "Gear";
        col.appendChild(label);

        const grid = document.createElement("div");
        Object.assign(grid.style, {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3px",
            padding: "3px 4px"
        });

        for (const slotName of ["armor", "clothes", "trinket1", "trinket2", "trinket3", "trinket4"]) {
            grid.appendChild(this.createEquipSlot(slotName));
        }

        col.appendChild(grid);
        return col;
    }

    private createEquipSlot(slotName: string): HTMLElement {
        const meta = EQUIP_SLOT_META[slotName];
        const el = document.createElement("div");
        el.className = "fft-equip-slot";
        el.dataset.equipSlot = slotName;
        el.dataset.slotType = "gear";
        el.title = meta.label;
        Object.assign(el.style, SLOT_STYLE);

        const icon = document.createElement("i");
        icon.className = meta.icon;
        Object.assign(icon.style, { color: "#444", fontSize: "14px" });
        el.appendChild(icon);

        el.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!Equipment._actor) return;
            await Equipment.clearEquipmentSlot(Equipment._actor, slotName as keyof EquipmentSlotsData);
        });

        this.makeDropTarget(el, async (uuid) => {
            if (!Equipment._actor) return;
            const item = Equipment._actor.items.find((i: any) => i.uuid === uuid);
            if (item && item.type === "equipment") {
                await Equipment.setEquipmentSlot(Equipment._actor, slotName as keyof EquipmentSlotsData, uuid);
            }
        });

        return el;
    }

    // --- Right Column: Inventory ---

    private buildInventoryColumn(): HTMLElement {
        const col = document.createElement("div");
        col.id = "fft-equip-inventory";
        Object.assign(col.style, { display: "flex", flexDirection: "column", padding: "0" });

        const label = document.createElement("div");
        Object.assign(label.style, SECTION_LABEL_STYLE);
        label.textContent = "Inventory";
        col.appendChild(label);

        const grid = document.createElement("div");
        grid.id = "fft-equip-inv-grid";
        Object.assign(grid.style, {
            display: "flex",
            flexWrap: "wrap",
            gap: "3px",
            padding: "3px 4px",
            overflowY: "auto",
            maxHeight: "250px",
            width: "210px",
            alignContent: "flex-start"
        });

        col.appendChild(grid);
        return col;
    }

    // --- Shared: drop target helper ---

    private makeDropTarget(el: HTMLElement, onDrop: (uuid: string) => Promise<void>) {
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
                    await onDrop(drop.uuid);
                }
            } catch (err) {
                Debug.Warn("Equipment | Drop failed", err);
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
        const newItem = actor.items.find((i: any) => i.uuid === itemUuid);
        if (newItem && !newItem.system?.equipped) await newItem.update({ "system.equipped": true });
        this.refresh();
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
        const item = uuid ? this._actor.items.find((i: any) => i.uuid === uuid) : null;
        if (item) {
            const img = document.createElement("img");
            img.src = item.img;
            img.alt = item.name;
            img.draggable = false;
            Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", borderRadius: "3px" });
            slotEl.appendChild(img);
            slotEl.title = item.name;
        } else {
            const icon = document.createElement("i");
            icon.className = placeholderIcon;
            Object.assign(icon.style, { color: "#444", fontSize: "14px" });
            slotEl.appendChild(icon);
        }
    }

    private static _refreshInventory() {
        const grid = this.form.querySelector("#fft-equip-inv-grid");
        if (!grid || !this._actor) return;
        grid.innerHTML = "";

        const items = [...this._actor.items].sort((a: any, b: any) => a.name.localeCompare(b.name));
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

            const img = document.createElement("img");
            img.src = item.img;
            img.alt = item.name;
            img.draggable = false;
            Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", borderRadius: "3px" });
            cell.appendChild(img);

            // Quantity badge
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
    }
}
