export function addControlButton(controls) {
    // Create a new control category
    const myCustomControls = {
        name: 'battlemapGenerator',
        title: 'Battlemap Generator',
        icon: 'fas fa-map',  // Category icon (Font Awesome)
        layer: 'TokenLayer',  // The layer this category interacts with
        tools: [],  // Start with an empty tools array
        visible: true  // Ensure the category is visible
    };

    // Define buttons for the new category
    const buttons = [
        { name: "generateForest", title: "Generate Forest", icon: "fas fa-tree", onClick: () => console.log("Generating Forest...") },
        { name: "generateCave", title: "Generate Cave", icon: "fas fa-mountain", onClick: () => console.log("Generating Cave...") },
        { name: "generateMountain", title: "Generate Mountain", icon: "fas fa-mountain", onClick: () => console.log("Generating Mountain...") },
        { name: "generateEncounters", title: "Generate Encounters", icon: "fas fa-skull", onClick: () => console.log("Generating Encounters...") }
    ];

    // Add each button to the custom control's tools array
    buttons.forEach(button => {
        myCustomControls.tools.push({
            name: button.name,
            title: button.title,
            icon: button.icon,
            button: true,  // Specify this as a button
            onClick: button.onClick
        });
    });

    // Add the new category to the controls
    controls.push(myCustomControls);
}
