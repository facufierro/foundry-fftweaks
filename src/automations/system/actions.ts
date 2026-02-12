type ActionType = 'action' | 'bonus' | 'reaction';

export class ActionsAutomation {
	private static recentApplications = new Map<string, number>();

	static initialize() {
		(Hooks as any).on('dnd5e.useItem', (item: any) => {
			ActionsAutomation.handleItemUse(item?.actor, item, null);
		});

		(Hooks as any).on('dnd5e.postUseActivity', (activity: any) => {
			ActionsAutomation.handleItemUse(activity?.actor ?? activity?.item?.actor, activity?.item, activity);
		});

		(Hooks as any).on('updateCombat', (combat: any, changed: any) => {
			if (changed?.round === undefined) return;
			ActionsAutomation.clearEffectsAtRoundStart(combat);
		});
	}

	private static async handleItemUse(actor: any, item: any, activity: any) {
		if (!actor || actor?.type !== 'character' || !item) return;
		if (!ActionsAutomation.isActorInCombat(actor)) return;

		const actionType = ActionsAutomation.getActionType(item, activity);
		if (!actionType) return;

		const actorId = actor?.id ?? actor?.uuid ?? actor?.name;
		const itemId = item?.id ?? item?.uuid ?? item?.name;
		const dedupeKey = `${actorId}:${itemId}:${actionType}`;
		const now = Date.now();
		const lastApplied = ActionsAutomation.recentApplications.get(dedupeKey) ?? 0;
		if (now - lastApplied < 400) return;
		ActionsAutomation.recentApplications.set(dedupeKey, now);

		const effectName = ActionsAutomation.getEffectName(actionType);
		const statusId = `fftweaks.${actionType}-used`;
		const icon = ActionsAutomation.getEffectIcon(actionType);

		await ActionsAutomation.removeDuplicateEffectsByName(actor, effectName);

		const existing = ActionsAutomation.findEffectByName(actor, effectName);
		if (existing) return;

		await actor.createEmbeddedDocuments('ActiveEffect', [
			{
				name: effectName,
				label: effectName,
				img: icon,
				icon: icon,
				statuses: [statusId],
				disabled: false,
				transfer: false,
				flags: {
					core: {
						overlay: false,
						statusId
					},
					fftweaks: {
						actionType
					}
				}
			}
		]);
	}

	private static getActionType(item: any, activity: any): ActionType | null {
		const parseType = (value: any): ActionType | null => {
			const text = `${value ?? ''}`.toLowerCase();
			if (text.includes('reaction') || text.includes('react')) return 'reaction';
			if (text.includes('bonus')) return 'bonus';
			if (text.includes('action')) return 'action';
			return null;
		};

		const fromActivity = parseType(activity?.activation?.type ?? activity?.activationType ?? activity?.type);
		if (fromActivity) return fromActivity;

		const fromItem = parseType(item?.system?.activation?.type ?? item?.system?.activation?.cost);
		if (fromItem) return fromItem;

		const activities = item?.system?.activities;
		if (activities) {
			const values = Array.isArray(activities) ? activities : Object.values(activities);
			for (const entry of values) {
				const parsed = parseType((entry as any)?.activation?.type ?? (entry as any)?.type);
				if (parsed) return parsed;
			}
		}

		return null;
	}

	private static getEffectName(actionType: ActionType) {
		if (actionType === 'bonus') return 'Bonus Action Used';
		if (actionType === 'reaction') return 'Reaction Used';
		return 'Action Used';
	}

	private static getRoundResetEffectNames() {
		return ['Action Used', 'Bonus Action Used', 'Reaction Used'];
	}

	private static getEffectIcon(actionType: ActionType) {
		if (actionType === 'bonus') return 'assets\\fftweaks\\icons\\resources\\bap_d.webp';
		if (actionType === 'reaction') return 'assets\\fftweaks\\icons\\resources\\ico_mini_spellSlot_reaction_d.webp';
		return 'assets\\fftweaks\\icons\\resources\\ap_d.webp';
	}

	private static isActorInCombat(actor: any) {
		if (actor?.inCombat === true) return true;
		if (actor?.combatant) return true;

		const combat = game?.combat;
		if (!combat?.combatants) return false;

		const actorId = actor?.id;
		if (!actorId) return false;

		return combat.combatants.some((combatant: any) => combatant?.actorId === actorId && !combatant?.defeated);
	}

	private static async clearEffectsAtRoundStart(combat: any) {
		if (!combat?.combatants) return;

		const effectNames = ActionsAutomation.getRoundResetEffectNames();
		for (const combatant of combat.combatants) {
			const actor = combatant?.actor;
			if (!actor || actor?.type !== 'character') continue;

			for (const effectName of effectNames) {
				await ActionsAutomation.removeAllEffectsByName(actor, effectName);
			}
		}
	}

	private static findEffectByName(actor: any, effectName: string) {
		const applied = actor?.appliedEffects?.find?.((effect: any) => effect?.name === effectName || effect?.label === effectName);
		if (applied) return applied;

		const embedded = actor?.effects?.find?.((effect: any) => effect?.name === effectName || effect?.label === effectName);
		if (embedded) return embedded;

		return null;
	}

	private static findAllEffectsByName(actor: any, effectName: string) {
		const matches = new Map<string, any>();

		const collect = (effect: any) => {
			if (!effect) return;
			if (effect?.name !== effectName && effect?.label !== effectName) return;

			const id = effect?.id ?? effect?._id ?? effect?.uuid ?? `${effectName}-${matches.size}`;
			if (!matches.has(id)) {
				matches.set(id, effect);
			}
		};

		actor?.appliedEffects?.forEach?.((effect: any) => collect(effect));
		actor?.effects?.forEach?.((effect: any) => collect(effect));

		return Array.from(matches.values());
	}

	private static async removeDuplicateEffectsByName(actor: any, effectName: string) {
		const matches = ActionsAutomation.findAllEffectsByName(actor, effectName);
		if (matches.length <= 1) return;

		for (const effect of matches.slice(1)) {
			await effect.delete();
		}
	}

	private static async removeAllEffectsByName(actor: any, effectName: string) {
		const matches = ActionsAutomation.findAllEffectsByName(actor, effectName);
		for (const effect of matches) {
			await effect.delete();
		}
	}
}
