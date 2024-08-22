Hooks.on("updateToken", async (tokenDocument, updateData, options, userId) => {
  // Check if the token moved
  if (updateData.x !== undefined || updateData.y !== undefined) {
    // Check if the token belongs to the actor of interest and if the dialog has not been shown yet
    if (tokenDocument.actor.id === actor.id && !await tokenDocument.actor.getFlag('myModuleName', 'dialogShown')) {
      const willingly = await showDialog();
      // After showing the dialog, set a flag to indicate it has been shown
      await tokenDocument.actor.setFlag('myModuleName', 'dialogShown', true);
      
      if (willingly) {
        // The actor moved willingly, apply 1d8 thunder damage once
        let damage = new Roll("1d8").roll().total; // Roll 1d8 for thunder damage
        await tokenDocument.actor.applyDamage(damage); // Apply the damage to the actor
        ui.notifications.info(`Actor ${actor.name} has moved willingly and takes ${damage} thunder damage.`);
      } else {
        // The actor did not move willingly, no damage applied
        ui.notifications.info(`Actor ${actor.name} has moved not willingly.`);
      }
      
      // Here you might reset the flag based on certain conditions or actions
      // For example, after a certain timeout or event indicating the end of the movement/action phase
      // await tokenDocument.actor.unsetFlag('myModuleName', 'dialogShown');
    }
  }
});



async function showDialog(title = "Confirm", content = "Proceed?") {
  return new Promise(r => new Dialog({
    title,
    content: `<p>${content}</p>`,
    buttons: {
      yes: { label: "Yes", callback: () => r(true) },
      no: { label: "No", callback: () => r(false) }
    },
    default: "no"
  }).render(true));
}


