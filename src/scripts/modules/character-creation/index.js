import { UIManager } from './ui-manager.js'

export async function initialize() {
    Hooks.on("renderActorSheet", (app, html, data) => {
        console.log("Rendering Actor Sheet for:", app.actor);
        UIManager.addButtonToSheet(app.actor, html);
    });

    Hooks.on("createItem", (item) => {
        console.log("New item created:", item);
        if (item.type === "background") {
            const actor = item.parent;
            console.log("Actor receiving background:", actor);
            ui.notifications.info(`${actor.name} has gained a new background: ${item.name}`);
        }
    });

}
