import { Debug } from "../../utils/debug";

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

const FLAG_KEY = "weaponSets";
const HOOK_NAME = "fftweaks.weaponSetChanged";
const DEFAULT_DATA: WeaponSetsData = {
    activeSet: 0,
    sets: [
        { primary: null, secondary: null },
        { primary: null, secondary: null },
        { primary: null, secondary: null }
    ]
};

export class Equipment {
    private static form: HTMLElement;
    private static _actor: any = null;

    static initialize() {
        new Equipment();

        Hooks.on("controlToken" as any, (token: any, controlled: boolean) => {
            if (controlled && token.actor?.type === "character") {
                this._actor = token.actor;
                this.refresh();
            }
        });

        Hooks.on("updateItem" as any, async (item: any, updateData: any) => {
            const actor = item.actor;
            if (!actor || actor.type !== "character") return;
            if (!updateData?.system?.equipped) return;

            const data = await this.getWeaponSets(actor);
            const itemUuid = item.uuid;
            for (const set of data.sets) {
                if (set.primary === itemUuid || set.secondary === itemUuid) {
                    await this._fireHook(actor, data);
                    break;
                }
            }
        });

        Debug.Log("Equipment | Initialized");
    }

    private constructor() {
        const existing = document.getElementById("fft-equipment-panel");
        if (existing) existing.remove();

        Equipment.form = document.createElement("div");
        Equipment.form.id = "fft-equipment-panel";
        Object.assign(Equipment.form.style, {
            position: "fixed",
            top: "300px",
            left: "150px",
            zIndex: "60",
            display: "flex",
            flexDirection: "column",
            padding: "0px",
            background: "rgb(11 10 19 / 75%)",
            border: "1px solid #111",
            boxShadow: "0 0 5px rgba(0,0,0,0.5)"
        });

        this.buildUI();
        document.body.appendChild(Equipment.form);
    }

    private buildUI() {
        // Drag handle
        const handle = document.createElement("div");
        Object.assign(handle.style, {
            height: "20px",
            background: "rgb(0 0 0 / 50%)",
            cursor: "move",
            borderBottom: "1px solid #111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#888",
            letterSpacing: "0.5px",
            textTransform: "uppercase" as any
        });
        handle.textContent = "Weapon Sets";
        Equipment.form.appendChild(handle);
        this.makeDraggable(handle);

        // 3 weapon set rows
        for (let i = 0; i < 3; i++) {
            const row = document.createElement("div");
            row.dataset.setIndex = String(i);
            Object.assign(row.style, {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "4px",
                padding: "4px",
                cursor: "pointer",
                borderBottom: "1px solid #222"
            });

            // Set number label
            const label = document.createElement("div");
            label.className = "fft-equip-set-label";
            label.textContent = String(i + 1);
            Object.assign(label.style, {
                fontSize: "11px",
                fontWeight: "bold",
                color: "#555",
                width: "14px",
                textAlign: "center"
            });
            row.appendChild(label);

            // Primary slot
            row.appendChild(this.createSlot(i, "primary"));
            // Secondary slot
            row.appendChild(this.createSlot(i, "secondary"));

            // Click row to switch active set
            row.addEventListener("click", (e) => {
                if ((e.target as HTMLElement).closest(".fft-equip-slot")) return;
                if (!Equipment._actor) return;
                Equipment.setActiveSet(Equipment._actor, i);
            });

            Equipment.form.appendChild(row);
        }
    }

    private createSlot(setIndex: number, slot: "primary" | "secondary"): HTMLElement {
        const el = document.createElement("div");
        el.className = "fft-equip-slot";
        el.dataset.setIndex = String(setIndex);
        el.dataset.slot = slot;
        el.title = slot === "primary" ? "Main Hand" : "Off Hand";
        Object.assign(el.style, {
            width: "36px",
            height: "36px",
            border: "1px solid #444",
            borderRadius: "4px",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
        });

        // Placeholder icon
        const placeholder = document.createElement("i");
        placeholder.className = slot === "primary" ? "fas fa-hand-fist" : "fas fa-shield-halved";
        Object.assign(placeholder.style, { color: "#444", fontSize: "14px" });
        el.appendChild(placeholder);

        // Right-click to clear
        el.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!Equipment._actor) return;
            await Equipment.clearSlot(Equipment._actor, setIndex, slot);
        });

        // Drop
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
            if (!Equipment._actor) return;
            try {
                const raw = e.dataTransfer?.getData("text/plain");
                if (!raw) return;
                const drop = JSON.parse(raw);
                if (drop.type === "Item" && drop.uuid) {
                    const item = Equipment._actor.items.find((i: any) => i.uuid === drop.uuid);
                    if (item && (item.type === "weapon" || item.type === "equipment")) {
                        await Equipment.setSlot(Equipment._actor, setIndex, slot, drop.uuid);
                    }
                }
            } catch (err) {
                Debug.Warn("Equipment | Drop failed", err);
            }
        });

        return el;
    }

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

    // --- Flag API ---

    static async getWeaponSets(actor: any): Promise<WeaponSetsData> {
        const stored = actor.getFlag("fftweaks", FLAG_KEY);
        if (stored) return stored as WeaponSetsData;
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    static async setActiveSet(actor: any, index: number) {
        if (index < 0 || index > 2) return;
        const data = await this.getWeaponSets(actor);
        data.activeSet = index;
        await actor.setFlag("fftweaks", FLAG_KEY, data);

        // Equip items from the new active set
        await this._equipActiveSet(actor, data);
        await this._fireHook(actor, data);
        this.refresh();
    }

    static async setSlot(actor: any, setIndex: number, slot: "primary" | "secondary", itemUuid: string) {
        const data = await this.getWeaponSets(actor);
        data.sets[setIndex][slot] = itemUuid;
        await actor.setFlag("fftweaks", FLAG_KEY, data);
        if (setIndex === data.activeSet) {
            await this._equipActiveSet(actor, data);
            await this._fireHook(actor, data);
        }
        this.refresh();
    }

    static async clearSlot(actor: any, setIndex: number, slot: "primary" | "secondary") {
        const data = await this.getWeaponSets(actor);
        const oldUuid = data.sets[setIndex][slot];
        data.sets[setIndex][slot] = null;
        await actor.setFlag("fftweaks", FLAG_KEY, data);
        if (setIndex === data.activeSet && oldUuid) {
            // Unequip the removed item
            const item = actor.items.find((i: any) => i.uuid === oldUuid);
            if (item && item.system?.equipped) {
                await item.update({ "system.equipped": false });
            }
            await this._fireHook(actor, data);
        }
        this.refresh();
    }

    static async getActiveWeapons(actor: any): Promise<ActiveWeapons> {
        const data = await this.getWeaponSets(actor);
        const activeSet = data.sets[data.activeSet];
        return {
            primary: activeSet.primary ? actor.items.find((i: any) => i.uuid === activeSet.primary) ?? null : null,
            secondary: activeSet.secondary ? actor.items.find((i: any) => i.uuid === activeSet.secondary) ?? null : null
        };
    }

    // --- Equip/Unequip ---

    private static async _equipActiveSet(actor: any, data: WeaponSetsData) {
        const activeSet = data.sets[data.activeSet];
        const activeUuids = new Set([activeSet.primary, activeSet.secondary].filter(Boolean));

        // Collect all UUIDs across all sets
        const allSetUuids = new Set<string>();
        for (const set of data.sets) {
            if (set.primary) allSetUuids.add(set.primary);
            if (set.secondary) allSetUuids.add(set.secondary);
        }

        // Unequip items in other sets, equip items in active set
        for (const item of actor.items) {
            if (!allSetUuids.has(item.uuid)) continue;
            const shouldEquip = activeUuids.has(item.uuid);
            if (item.system?.equipped !== shouldEquip) {
                await item.update({ "system.equipped": shouldEquip });
            }
        }
    }

    // --- Hook ---

    private static async _fireHook(actor: any, data: WeaponSetsData) {
        const weapons = await this.getActiveWeapons(actor);
        Hooks.callAll(HOOK_NAME as any, {
            actor,
            activeSet: data.activeSet,
            sets: data.sets,
            primary: weapons.primary,
            secondary: weapons.secondary
        });
    }

    // --- UI Refresh ---

    static async refresh() {
        if (!this.form || !this._actor) return;
        const data = await this.getWeaponSets(this._actor);

        const rows = this.form.querySelectorAll("[data-set-index]") as NodeListOf<HTMLElement>;
        // Update set rows (skip slots, just update row highlights)
        for (let i = 0; i < 3; i++) {
            const row = this.form.children[i + 1] as HTMLElement; // +1 for handle
            if (!row) continue;
            const isActive = data.activeSet === i;
            row.style.background = isActive ? "rgba(255,255,255,0.08)" : "transparent";
            const label = row.querySelector(".fft-equip-set-label") as HTMLElement;
            if (label) label.style.color = isActive ? "#ccc" : "#555";
        }

        // Update slot contents
        const slots = this.form.querySelectorAll(".fft-equip-slot") as NodeListOf<HTMLElement>;
        for (const slotEl of slots) {
            const setIdx = Number(slotEl.dataset.setIndex);
            const slotName = slotEl.dataset.slot as "primary" | "secondary";
            const uuid = data.sets[setIdx]?.[slotName];
            const item = uuid ? this._actor.items.find((i: any) => i.uuid === uuid) : null;

            slotEl.innerHTML = "";
            if (item) {
                const img = document.createElement("img");
                img.src = item.img;
                img.alt = item.name;
                img.draggable = false;
                Object.assign(img.style, {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "3px"
                });
                slotEl.appendChild(img);
                slotEl.title = `${item.name} (${slotName === "primary" ? "Main Hand" : "Off Hand"})`;
            } else {
                const icon = document.createElement("i");
                icon.className = slotName === "primary" ? "fas fa-hand-fist" : "fas fa-shield-halved";
                Object.assign(icon.style, { color: "#444", fontSize: "14px" });
                slotEl.appendChild(icon);
                slotEl.title = slotName === "primary" ? "Main Hand" : "Off Hand";
            }
        }
    }
}
