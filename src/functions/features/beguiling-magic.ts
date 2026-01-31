export async function beguilingMagic(item: any): Promise<void> {
    console.log("FFTweaks | beguilingMagic | Triggered", item);

    // Check if the item is a spell of Enchantment or Illusion school
    const school = item.system.school;
    console.log("FFTweaks | beguilingMagic | School:", school);
    if (school !== "enc" && school !== "ill") {
        console.log("FFTweaks | beguilingMagic | Wrong school");
        return;
    }

    // Check if it's 1st level or higher
    console.log("FFTweaks | beguilingMagic | Level:", item.system.level);
    if (item.system.level < 1) {
        console.log("FFTweaks | beguilingMagic | Too low level");
        return;
    }

    // Check if the actor has the Beguiling Magic feature
    const actor = item.actor;
    if (!actor) {
        console.log("FFTweaks | beguilingMagic | No actor");
        return;
    }
    const beguilingMagicFeature = actor.items.getName("Beguiling Magic");
    if (!beguilingMagicFeature) {
        console.log("FFTweaks | beguilingMagic | Missing feature 'Beguiling Magic'");
        return;
    }

    // Check if there are targets
    const targets = (game.user as any)?.targets;
    console.log("FFTweaks | beguilingMagic | Targets:", targets?.size);
    if (!targets || targets.size === 0) {
        console.log("FFTweaks | beguilingMagic | No targets");
        return;
    }

    // Prompt the user
    new Dialog({
        title: "Beguiling Magic",
        content: `<p>You cast an ${school === "enc" ? "Enchantment" : "Illusion"} spell and targeted a creature.</p><p>Do you want to use <strong>Beguiling Magic</strong>?</p>`,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: "Yes",
                callback: async () => {
                    await beguilingMagicFeature.use();
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "No"
            }
        },
        default: "yes"
    }).render(true);
}
