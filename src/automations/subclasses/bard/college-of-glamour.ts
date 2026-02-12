import { ActorUtility } from '../../../utils/actor-utility';

export class CollegeOfGlamour {
	static initialize() {
		CollegeOfGlamour.mantleOfInspiration();
		CollegeOfGlamour.mantleOfMajesty();
		CollegeOfGlamour.unbreakableMajesty();

		(Hooks as any).on('dnd5e.useItem', (item: any) => {
			CollegeOfGlamour.beguilingMagic(item);
		});

		(Hooks as any).on('dnd5e.postUseActivity', (activity: any) => {
			if (activity?.item) {
				CollegeOfGlamour.beguilingMagic(activity.item);
			}
		});
	}

	private static mantleOfInspiration() {}

	private static mantleOfMajesty() {}

	private static unbreakableMajesty() {}

	private static async beguilingMagic(item: any) {
		const school = item?.system?.school;
		if (school !== 'enc' && school !== 'ill') return;

		if ((item?.system?.level ?? 0) < 1) return;

		const actor = item?.actor;
		if (!actor) return;

		const beguilingMagicFeature = ActorUtility.getItemByName(actor, 'Beguiling Magic');
		if (!beguilingMagicFeature) return;

		const targets = (game.user as any)?.targets;
		if (!targets || targets.size === 0) return;

		new Dialog({
			title: 'Beguiling Magic',
			content: `<p>You cast an ${school === 'enc' ? 'Enchantment' : 'Illusion'} spell and targeted a creature.</p><p>Do you want to use <strong>Beguiling Magic</strong>?</p>`,
			buttons: {
				yes: {
					icon: '<i class="fas fa-check"></i>',
					label: 'Yes',
					callback: async () => {
						await beguilingMagicFeature.use();
					}
				},
				no: {
					icon: '<i class="fas fa-times"></i>',
					label: 'No'
				}
			},
			default: 'yes'
		}).render(true);
	}
}
