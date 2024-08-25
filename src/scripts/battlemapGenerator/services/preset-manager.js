
export function getPresets(folder) {
    // Get all the presets from the folder
    const presets = [];
    // Return the list of presets
    return presets;
}
export async function spawnPresetByUUID(uuid, x, y, snapToGrid = true, hidden = false, layerSwitch = true) {
    try {
        await MassEdit.spawnPreset({
            uuid,
            x,
            y,
            snapToGrid,
            hidden,
            layerSwitch
        });
        ui.notifications.info(`Preset with UUID ${uuid} spawned successfully at (${x}, ${y}).`);
    } catch (err) {
        console.error("Error spawning preset:", err);
        ui.notifications.error("Failed to spawn preset.");
    }
}


