let equippedWeapons = actor.items.filter(i => i.type === "weapon" && i.system.equipped);
if (equippedWeapons.length > 0) {
    let firstEquippedWeapon = equippedWeapons[0].name;
    dnd5e.documents.macro.rollItem(firstEquippedWeapon, { actorId: actor.id });
} else {
    ui.notifications.warn("No equipped weapons found.");
}

