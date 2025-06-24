async function createDefaultLevels(start = 0, end = 0, height = 10): Promise<void> {
    const scene = game.scenes?.active;
    if (!scene) return;

    const levels = [];
    for (let i = start; i <= end; i++) {
        levels.push([i * height, (i + 1) * height, `${i}`]);
    }

    await (scene as any).setFlag("levels", "sceneLevels", levels);

    if (confirm("Levels created. Reload the scene now?")) {
        window.location.reload();
    }
}
