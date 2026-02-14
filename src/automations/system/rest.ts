type RestType = 'short' | 'long';

export class RestAutomation {
	private static pendingRestEffects = new Set<string>();

	static initialize() {
		(Hooks as any).on('dnd5e.shortRest', (actor: any, data: any) => {
			RestAutomation.handleRest(actor, 'short', data);
		});

		(Hooks as any).on('dnd5e.longRest', (actor: any, data: any) => {
			RestAutomation.handleRest(actor, 'long', data);
		});

		(Hooks as any).on('dnd5e.restCompleted', (actor: any, data: any) => {
			const inferredType = RestAutomation.inferRestType(data);
			if (!inferredType) return;

			RestAutomation.handleRest(actor, inferredType, data);
		});
	}

	private static inferRestType(data: any): RestType | null {
		if (!data) return null;

		const fromType = `${data?.restType ?? data?.type ?? data?.kind ?? ''}`.toLowerCase();
		if (fromType.includes('long')) return 'long';
		if (fromType.includes('short')) return 'short';

		if (data?.longRest === true) return 'long';
		if (data?.shortRest === true) return 'short';

		return null;
	}

	private static async handleRest(actor: any, restType: RestType, _data?: any) {
		if (!actor || actor?.type !== 'character') return;

		const actorId = actor?.id ?? actor?.uuid ?? actor?.name;
		const pendingKey = `${actorId}:${restType}`;
		if (RestAutomation.pendingRestEffects.has(pendingKey)) return;

		RestAutomation.pendingRestEffects.add(pendingKey);

		try {
			if (restType === 'long') {
				// Trigger Spellcasting activities
				const spellcastingItems = actor.items.filter((i: any) => i.name.toLowerCase() === "spellcasting" && i.system.activities?.size > 0);
				
				if (spellcastingItems.length > 0) {
					const confirmed = await Dialog.confirm({
						title: "Spellcasting",
						content: "<p>Do you want to change your spells?</p>",
						defaultYes: false
					});

					if (confirmed) {
						for (const item of spellcastingItems) {
							if (item.system.activities?.size) {
								for (const activity of item.system.activities) {
									// Execute the activity with configuration dialog (user needs to make choices if any)
									activity.use({ configure: true });
								}
							}
						}
					}
				}
			}

			const effectName = restType === 'long' ? 'Long Rested' : 'Short Rested';
			const oppositeName = restType === 'long' ? 'Short Rested' : 'Long Rested';
			const statusId = restType === 'long' ? 'fftweaks.long-rested' : 'fftweaks.short-rested';
			const tint = restType === 'long' ? '#ffffff' : '#646464';

			await RestAutomation.removeAllEffectsByName(actor, oppositeName);
			await RestAutomation.removeDuplicateEffectsByName(actor, effectName);

			const existing = RestAutomation.findEffectByName(actor, effectName);
			if (existing) return;

			await actor.createEmbeddedDocuments('ActiveEffect', [
				{
					name: effectName,
					label: effectName,
					img: 'icons/svg/sleep.svg',
					icon: 'icons/svg/sleep.svg',
					tint,
					statuses: [statusId],
					disabled: false,
					transfer: false,
					flags: {
						core: {
							overlay: false,
							statusId
						},
						fftweaks: {
							restType
						}
					},
					duration: {
						seconds: 6
					}
				}
			]);
		} finally {
			RestAutomation.pendingRestEffects.delete(pendingKey);
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

	private static async removeAllEffectsByName(actor: any, effectName: string) {
		const matches = RestAutomation.findAllEffectsByName(actor, effectName);
		for (const effect of matches) {
			await effect.delete();
		}
	}

	private static async removeDuplicateEffectsByName(actor: any, effectName: string) {
		const matches = RestAutomation.findAllEffectsByName(actor, effectName);
		if (matches.length <= 1) return;

		for (const effect of matches.slice(1)) {
			await effect.delete();
		}
	}
}
