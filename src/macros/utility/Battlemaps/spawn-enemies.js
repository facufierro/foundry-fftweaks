let actorId = "Cji12Psjn1U1OxiE"; // Replace with the actor's ID
let actor = game.actors.get(actorId);

if (actor) {
  let tokenData = duplicate(actor.prototypeToken);
  tokenData.x = 600; // Replace with desired X coordinate
  tokenData.y = 600; // Replace with desired Y coordinate
  tokenData.actorId = actor.id;
  tokenData.name = actor.name;

  canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
} else {
  ui.notifications.error("Actor not found");
}

