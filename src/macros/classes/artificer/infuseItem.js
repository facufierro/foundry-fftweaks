const filteredItems = actor.items.filter(i => i.name.includes("Infusions:")).sort((a, b) => a.name.localeCompare(b.name));
window.fftweaks.createItemDialog(filteredItems, "Infusions");