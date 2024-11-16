export async function initializeData() {
    const data = await (await fetch('modules/fftweaks/src/scripts/battlemapGenerator/data/preset-data.json')).json();
    return data;  // Return the entire data object
}

