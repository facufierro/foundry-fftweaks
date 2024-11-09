import { addCharacterCreationButton } from "./ui/buttons/character-creation-button.js";

export async function initialize() {
    const backgroundFiles = await getBackgroundFiles();
    console.log("Background files retrieved:", backgroundFiles);

    // Process each background file if needed
    for (const file of backgroundFiles) {
        try {
            // Fetch each file’s data
            const response = await fetch(`/${file}`); // Ensure path is relative to the root
            const data = await response.json();
            console.log("Background data:", data);
        } catch (error) {
            console.error(`Error fetching file ${file}:`, error);
        }
    }

    Hooks.on("renderActorSheet", (app, html, data) => {
        addCharacterCreationButton(html, app.actor);
    });

    Hooks.on("createItem", (item) => {
        if (item.type === "background") {
            const actor = item.parent;
            ui.notifications.info(`${actor.name} has gained a new background: ${item.name}`);
        }
    });
}

async function getBackgroundFiles() {
    try {
        const backgroundFiles = await FilePicker.browse("data", "modules/fftweaks/src/scripts/modules/character-creation/data/backgrounds");
        return backgroundFiles.files.filter(file => file.endsWith(".json"));
    } catch (error) {
        console.error("Error accessing background files:", error);
        return [];
    }
}
