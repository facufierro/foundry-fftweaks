async function enhanceArmorAC(item) {
    if (!item || item.type !== "equipment") {
        ui.notifications.warn("Selected item is not valid equipment.");
        return;
    }

    // Check if the item already has the "Infused" prefix to avoid duplicating the effect
    if (!item.name.startsWith("Infused ")) {
        // Rename the item to include "Infused" prefix
        await item.update({name: `Infused ${item.name}`});
        ui.notifications.info(`${item.name} has been renamed.`);
    }

    // Assuming the system supports passive effects directly on the item
    // Here, we're adding a generic effect. You'll need to adjust this to match
    // your system's requirements for how effects are structured and applied.
    const effectData = {
        label: "Armor Class Enhancement",
        icon: "icons/svg/shield.svg", // Example icon, replace with appropriate path
        changes: [
            {
                key: "data.attributes.ac.value", // This key path will depend on the system's data model
                value: 2,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD, // Foundry VTT specific; adjust for your system
                priority: 20
            }
        ],
        duration: { 
            seconds: null, // Permanent effect
        },
        disabled: false,
        flags: {"fftweaks.infused": true} // Custom flag to identify the effect
    };

    // Add the effect to the item
    await item.createEmbeddedDocuments("ActiveEffect", [effectData]);
    ui.notifications.info("Armor Class increased by 2.");
}


// Define enhanceArmorAC in a scope that's accessible
function enhanceArmorAC(item) {
    console.log("Enhancing AC for:", item.name); // Additional log for debugging
    ui.notifications.warn("Test");
}

const filteredItems = actor.items.filter(i => i.type === "equipment").sort((a, b) => a.name.localeCompare(b.name));
// Make sure 'actor' is defined and contains the items you expect

// Example usage:
window.fftweaks.createItemDialog(filteredItems, "Select Armor to Enhance", enhanceArmorAC);
