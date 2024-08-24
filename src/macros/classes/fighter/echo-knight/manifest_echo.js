const summon_name = "Grimdan's Echo";
let equippedItems = actor.items.filter(item => item.system.equipped);
let targetActor = game.actors.contents.find(a => a.name === summon_name);
let targetItems = targetActor.items.map(i => i.id);



summoned_token = warpgate.spawn(summon_name, {
    actor: {
        'data.attributes.hp': 1,
        'data.attributes.ac.value': 14 + actor.data.data.attributes.prof,
        'data.abilities': actor.data.data.abilities,
        'data.traits.weaponProf': actor.data.data.traits.weaponProf
    }
})

//delete duplicates
canvas.scene.deleteEmbeddedDocuments("Token",
    canvas.tokens.placeables.filter(token => token.name === summon_name && token.id != summoned_token).map(token => token.id))

//modify items
targetActor.deleteEmbeddedDocuments("Item", targetItems).then(() => {
    targetActor.createEmbeddedDocuments("Item", equippedItems);
});


