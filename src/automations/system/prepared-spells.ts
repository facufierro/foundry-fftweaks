
export class PreparedSpellsAutomation {
	static initialize() {
		Hooks.on('preUpdateItem', (item: any, changes: any, options: any, userId: string) => {
			if (item.type !== 'spell') return;

			// Handle both nested and flattened data for 'prepared'
			const preparedUpdate = changes.system?.prepared ?? changes['system.prepared'];
			if (preparedUpdate === undefined) return;

			// Always allow un-preparing (setting to 0 or false)
			// dnd5e v5 uses 0/1 for prepared status
			if (!preparedUpdate) return;

			const actor = item.actor;
			if (!actor) return;

			// Get scale values
			const maxPrepared = foundry.utils.getProperty(actor, "system.scale.spellcasting.prepared-spells");
			const maxCantrips = foundry.utils.getProperty(actor, "system.scale.spellcasting.known-cantrips");

			const isCantrip = item.system.level === 0;
			const limit = isCantrip ? maxCantrips : maxPrepared;

			// If no limit is set via scale, allow it (or block if you want strict enforcement)
			if (limit === undefined) return;

			// Count currently prepared spells of relevant type (excluding the one being updated if it was already prepared, though preUpdate implies it wasn't)
			const currentPrepared = actor.items.filter((i: any) => 
				i.type === 'spell' && 
				i.system.prepared === 1 && 
				(isCantrip ? i.system.level === 0 : i.system.level > 0) &&
				i.id !== item.id // Exclude self to be safe, though preUpdate implies it's not yet prepared
			).length;

			if (currentPrepared >= limit) {
				const type = isCantrip ? "Cantrips" : "Spells";
				ui.notifications?.warn(`Maximum ${type} Preparation Limit Reached (${limit}).`);
				return false;
			}
		});
	}
}
