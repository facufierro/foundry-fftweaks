import * as random from '../../utils/random.js';
import * as notifications from '../../utils/notifications.js';

export async function spawnPresetByUUID(uuid, x, y, snapToGrid = true, hidden = false, layerSwitch = true) {
    try {
        notifications.toggle();
        await MassEdit.spawnPreset({
            uuid,
            x,
            y,
            snapToGrid,
            hidden,
            layerSwitch
        });
    } catch (err) {
        console.error("Error spawning preset:", err);
    }
}

export async function spawnRandomPreset(list, sceneSize) {
    if (!sceneSize || typeof sceneSize.width !== 'number' || typeof sceneSize.height !== 'number') {
        console.error("Invalid scene size provided:", sceneSize);
        return;
    }

    const preset = random.element(list);
    const x = random.number(0, sceneSize.width);
    const y = random.number(0, sceneSize.height);

    await spawnPresetByUUID(preset, x, y);
}
