export function renderButtons(controls) {
    controls.push({
        name: "battlemapGenerator",
        title: "Battlemap Generator",
        icon: "fas fa-map",  // Icon for the category
        layer: "controls",   // You can choose an appropriate layer or omit if not needed
        tools: [
            {
                name: "generateTerrain",
                title: "Generate Terrain",
                icon: "fas fa-mountain",  // Icon for Generate Terrain button
                onClick: () => {
                    ui.notifications.info("Generating Terrain...");
                    // Add your terrain generation logic here
                },
                button: true
            },
            {
                name: "generateEncounters",
                title: "Generate Encounters",
                icon: "fas fa-users",  // Icon for Generate Encounters button
                onClick: () => {
                    ui.notifications.info("Generating Encounters...");
                    // Add your encounter generation logic here
                },
                button: true
            }
        ],
        visible: true,
        activeTool: "generateTerrain"  // Set default active tool if needed
    });
}
