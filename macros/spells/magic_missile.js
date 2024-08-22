const spells = ["Magic Missile", "Magic Missile: 2nd Dart", "Magic Missile: 3rd Dart"];

async function addSpell(actor, spellName) {
    let pack = game.packs.get("fftweaks.spells");
    let spell = await pack.getDocuments().then(docs => docs.find(d => d.name === spellName));
    if (spell) await actor.createEmbeddedDocuments("Item", [spell.toObject()]);
}

async function manageMagicMissile(actor) {
    let currentSpell = spells.find(s => actor.items.some(i => i.name === s));
    let nextSpell = spells[(spells.indexOf(currentSpell) + 1) % spells.length];
    await addSpell(actor, nextSpell);
    await actor.deleteEmbeddedDocuments("Item", [actor.items.find(i => i.name === currentSpell).id]);
}

manageMagicMissile(actor);
