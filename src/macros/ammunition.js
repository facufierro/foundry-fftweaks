let ammo = actor.items.find(i => 
    i.name.toLowerCase().includes(item.system.ammunition?.type.toLowerCase()) && 
    i.system.quantity > 0 && 
    i.system.equipped
  );
  
  if (!ammo) {
    ui.notifications.error(`No equipped ${item.system.ammunition.type} available. Attack stopped.`);
    let hookId = Hooks.on("dnd5e.preRollAttack", () => false);
    setTimeout(() => Hooks.off("dnd5e.preRollAttack", hookId), 0); // Remove the hook immediately
    return;
  }
  
  ammo.update({ "system.quantity": ammo.system.quantity - 1 });
  