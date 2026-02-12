import { ActorUtility } from '../../utils/actor-utility';

export class Bard {
	static initialize() {
		Bard.bardicInspiration();
		Bard.spellcasting();
		Bard.expertise();
		Bard.fontOfInspiration();
		Bard.countercharm();
		Bard.magicalSecrets();
		Bard.superiorInspiration();
		Bard.wordsOfCreation();

		(Hooks as any).on('dnd5e.useItem', (item: any) => {
			Bard.jackOfAllTrades({ item, actor: item?.actor });
		});

		(Hooks as any).on('dnd5e.postUseActivity', (activity: any) => {
			Bard.jackOfAllTrades({ item: activity?.item, actor: activity?.actor });
		});

		(Hooks as any).on('dnd5e.preRollSkill', (config: any) => {
			Bard.jackOfAllTrades({ config });
		});

		(Hooks as any).on('dnd5e.preRollAbilityCheck', (config: any) => {
			Bard.jackOfAllTrades({ config });
		});
	}

	private static bardicInspiration() {}

	private static spellcasting() {}

	private static expertise() {}

	private static fontOfInspiration() {}

	private static countercharm() {}

	private static magicalSecrets() {}

	private static superiorInspiration() {}

	private static wordsOfCreation() {}

	private static jackOfAllTrades(data: { item?: any; actor?: any; config?: any }) {
		const { item, actor, config } = data;

		if (item?.name === 'Jack of All Trades' && ActorUtility.hasItemByName(actor, 'Jack of All Trades')) {
			actor?.setFlag('fftweaks', 'joat', true);
			return;
		}

		if (!config) return;

		const rollActor = config.subject;
		if (!rollActor?.getFlag?.('fftweaks', 'joat') || config._joat) return;

		if ((config.skill && rollActor.system.skills[config.skill]?.value < 1) || (!config.skill && config.ability)) {
			config._joat = true;
			const bonus = Math.floor((rollActor.system.attributes.prof ?? 0) / 2);
			const roll = (config.rolls = config.rolls || [{}])[0];
			(roll.parts = roll.parts || []).push(`${bonus}`);
			rollActor.unsetFlag('fftweaks', 'joat');
			ui.notifications?.info(`Jack of All Trades (+${bonus})`);
		}
	}
}
