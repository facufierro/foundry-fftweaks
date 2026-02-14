
export class PreparedSpellsAutomation {
	static initialize() {
		Hooks.on('preUpdateItem', (item: any, changes: any, options: any, userId: string) => {
			if (item.type !== 'spell') return;

			// Handle both nested and flattened data for 'prepared'
			const preparedUpdate = changes.system?.prepared ?? changes['system.prepared'];
			if (preparedUpdate === undefined) return;

			// Always allow un-preparing (setting to 0 or false)
			if (!preparedUpdate) return;

            // Cantrips are always allowed
            if (item.system.level === 0) return;

			const actor = item.actor;
			if (!actor) return;

			// Identify source class
			const sourceClass = item.system.sourceClass;
			if (!sourceClass) return; // If no source class, we can't enforce class-specific limits

			// Get scale values dynamically based on class identifier
			const maxPrepared = foundry.utils.getProperty(actor, `system.scale.${sourceClass}.prepared-spells`);

			// If no limit is set via scale for this class, allow it
			if (maxPrepared === undefined) return;

			// Count currently prepared spells of relevant type AND same source class
			const currentPrepared = actor.items.filter((i: any) => 
				i.type === 'spell' && 
				i.system.prepared === 1 && 
				i.system.level > 0 && // Only count leveled spells
				i.system.sourceClass === sourceClass && // Only count spells from the same class
				i.id !== item.id
			).length;

			if (currentPrepared >= maxPrepared) {
				// Title case the class name for the message if possible, or just use identifier
				const className = sourceClass.charAt(0).toUpperCase() + sourceClass.slice(1);
				ui.notifications?.warn(`Maximum ${className} Spells Preparation Limit Reached (${maxPrepared}).`);
				return false;
			}
		});
	}
}
