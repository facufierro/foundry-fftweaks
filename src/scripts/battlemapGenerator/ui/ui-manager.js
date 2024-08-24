export function renderButtons(controls) {
    controls.push({
        name: "battlemapGenerator",
        title: "Battlemap Generator",
        icon: "fas fa-map",
        layer: "controls",
        tools: [
            {
                name: "generateTerrain",
                title: "Generate Terrain",
                icon: "fas fa-mountain",
                onClick: () => {
                    ui.notifications.info("Generating Terrain...");
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
        activeTool: "generateTerrain"  
    });
}
