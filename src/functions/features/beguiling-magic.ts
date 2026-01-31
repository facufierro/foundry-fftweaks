// Check if the item is a spell of Enchantment or Illusion school
const school = item.system.school;
if (school !== "enc" && school !== "ill") return;

// Check if it's 1st level or higher
if (item.system.level < 1) return;

// Check if the actor has the Beguiling Magic feature
const actor = item.actor;
if (!actor) return;
const beguilingMagicFeature = actor.items.getName("Beguiling Magic");
if (!beguilingMagicFeature) return;

// Check if there are targets
const targets = (game.user as any)?.targets;
if (!targets || targets.size === 0) return;

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
