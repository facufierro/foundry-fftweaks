const toolID = "Smith's Tools";
const DC = 12;

const result = await actor.rollToolCheck(toolID);
return {
    success: result.total >= DC,
    consume: true
};

const hasGold = actor.system.spells.spell1.value > 0;
if (!hasSpellslot) {
    ui.notifications.error("No Spellslot")
    return {
        success: false,
        consume: false,
    };
}