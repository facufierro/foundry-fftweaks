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

export async function spawnRandomPreset(list, sceneSize, padding = 0, presetNumber = 1) {
    if (!sceneSize || typeof sceneSize.width !== 'number' || typeof sceneSize.height !== 'number') {
        console.error("Invalid scene size provided:", sceneSize);
        return;
    }

    for (let i = 0; i < presetNumber; i++) {
        const preset = random.element(list);

        const x = random.number(padding, sceneSize.width - padding);
        const y = random.number(padding, sceneSize.height - padding);

        await spawnPresetByUUID(preset, x, y);
    }
}


