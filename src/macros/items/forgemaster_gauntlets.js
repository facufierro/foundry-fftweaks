// if the weapon is melee add thrown porperty and set range to 20/60
(async () => {
    if (!actor) return;
    const weapon = actor.items.find(i => i.type === "weapon" && i.system.equipped);
    if (!weapon) return;

    const properties = Array.from(weapon.system.properties || []);
    const weaponType = weapon.system.type.value;

    // Check if the weapon is either martial melee or simple melee
    const isMartialMelee = weaponType === "martialM";
    const isSimpleMelee = weaponType === "simpleM";

    if ((isMartialMelee || isSimpleMelee) && !properties.includes("thr")) {
        properties.push("thr");
        await weapon.update({
            "system.properties": properties,
            "system.range.value": 20,
            "system.range.long": 60
        });
    }
})();


// if the weapon is melee remove thrown porperty and set normal range to 5
(async () => {
    if (!actor) return;
    const weapon = actor.items.find(i => i.type === "weapon" && i.system.equipped);
    if (!weapon) return;

    const properties = Array.from(weapon.system.properties || []);
    const weaponType = weapon.system.type.value;

    // Check if the weapon is either martial melee or simple melee
    const isMartialMelee = weaponType === "martialM";
    const isSimpleMelee = weaponType === "simpleM";

    if ((isMartialMelee || isSimpleMelee) && properties.includes("thr")) {
        properties.splice(properties.indexOf("thr"), 1);
        await weapon.update({
            "system.properties": properties,
            "system.range.value": 5,
            "system.range.long": null
        });
    }
})();
