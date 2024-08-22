const summon_name = "Grimdan's Echo";
canvas.scene.deleteEmbeddedDocuments("Token",
    canvas.tokens.placeables.filter(token => token.name === summon_name).map(token => token.id))