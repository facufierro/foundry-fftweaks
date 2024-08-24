// Number of presets to spawn
const preset_number = 5;

// List of preset names
const presetList = [
  "WILDERNESS Tree 01",
  "WILDERNESS Tree 02",
  "WILDERNESS Tree 03",
  "WILDERNESS Tree 01 Large",
  "WILDERNESS Tree 02 Large",
  "WILDERNESS Tree 03 Large",
];

// Function to spawn random presets
async function spawnPresets(preset_number) {
  for (let i = 0; i < preset_number; i++) {
    // Select a random preset from the list
    const preset = presetList[Math.floor(Math.random() * presetList.length)];

    // Generate random coordinates within the canvas
    const x = Math.floor(Math.random() * canvas.scene.dimensions.width);
    const y = Math.floor(Math.random() * canvas.scene.dimensions.height);

    // Spawn the selected preset at the random coordinates
    await MassEdit.spawnPreset({ name: preset, x, y });
  }
}
