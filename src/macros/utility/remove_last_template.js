// removes the last template placed on the canvas

// Get the array of all templates in the current scene
const templates = canvas.templates.placeables;

// Check if there are any templates placed
if (templates.length === 0) {
    ui.notifications.warn("No templates found on this scene.");
} else {
    // Get the last placed template (the one with the highest ID)
    const lastTemplate = templates[templates.length - 1];

    // Delete the last placed template
    lastTemplate.document.delete();

    // ui.notifications.info("Last placed template has been removed.");
}