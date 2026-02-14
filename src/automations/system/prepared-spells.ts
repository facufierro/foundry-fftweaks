export class PreparedSpellsAutomation {
	static initialize() {
		Hooks.on('preUpdateItem', (item: any, changes: any) => {
			if (item.type !== 'spell') return;
			if (changes.system?.prepared === undefined) return;

			ui.notifications?.warn("Spell preparation is disabled.");
			return false;
		});
	}
}
