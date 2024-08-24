// equips or unequips an item on an actor
const isEquipped = item.system.equipped;
await actor.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.equipped": !isEquipped }]);