const summon = "Mechanical Raven";
const intMod = actor.data.data.abilities.int.mod;
const artificerLevel = actor.items.find(i => i.type === "class" && i.name === "Artificer")?.data.data.levels || 0;
const proficiency = actor.data.data.attributes.prof;

await warpgate.spawn(summon, {
  actor: {
    'data.attributes.hp': {value: 1 + intMod + artificerLevel, max: 1 + intMod + artificerLevel},
    'data.attributes.prof': proficiency,
  },
  embedded: {
    Item: {
      "Force Strike": {
        type: "weapon",
        data: {
          description: { value: "Ranged Weapon Attack: your spell attack modifier to hit, range 30 ft., one target. Hit: 1d4 + PB force damage." },
          actionType: "rwak",
          attackBonus: intMod,
          damage: { parts: [["1d4 + " + proficiency, "force"]] },
          range: { normal: 30, units: 'ft' },
          target: { value: 1, type: 'creature' },
          ability: "none", 
        },
        flags: {"dnd5e": {"abilityMod": null}},
      }
    }
  },
  token: {
    elevation: 6,
  }
});