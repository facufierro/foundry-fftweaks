import * as battlemapManager from "../services/battlemap-manager.js";

export function renderButtons(controls) {

    controls.push({
        name: "battlemapGenerator",
        title: "Battlemap Generator",
        icon: "fas fa-compass-drafting",
        layer: "controls",
        tools: [

            {
                name: "generateForest",
                title: "Generate Forest",
                icon: "fas fa-trees",
                onClick: () => {
                    battlemapManager.generateTerrain("forest");
                },
                button: true
            },
            {
                name: "generateCave",
                title: "Generate Cave",
                icon: "fas fa-icicles",
                onClick: () => {
                    ui.notifications.info("Generating Cave Terrain...");
                },
                button: true
            },
            {
                name: "generateMountain",
                title: "Generate Mountain",
                icon: "fas fa-mountains",
                onClick: () => {
                    ui.notifications.info("Generating Mountain Terrain...");
                },
                button: true
            },
            {
                name: "generateEncounters",
                title: "Generate Encounters",
                icon: "fas fa-users",
                onClick: () => {
                    ui.notifications.info("Generating Encounters...");
                },
                button: true
            }
        ],
        visible: true,
        activeTool: "generateForest"
    });
}
