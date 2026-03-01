export class Runesmith {
	static initialize() {
		Runesmith.toolsOfTheTrade();
		Runesmith.runesmithSpells();
		Runesmith.battleRune();
		Runesmith.runicInscription();
		Runesmith.extraAttack();
		Runesmith.arcaneInscription();
		Runesmith.perfectedRunes();
	}

	private static toolsOfTheTrade() {}

	private static runesmithSpells() {}

	private static battleRune() {}

	private static runicInscription() {
		Hooks.on('createActiveEffect', async (effect: any) => {
			if (effect.name !== 'Glyph') return;
			const targetItem = effect.parent;
			if (!targetItem || targetItem.documentName !== 'Item') return;
			if (targetItem.name === 'Runic Inscription') return;
			const actor = targetItem.parent;
			if (!actor) return;
			const runicInscription = actor.items?.find((i: any) => i.name === 'Runic Inscription');
			if (!runicInscription) return;
			Runesmith.handleRunicInscription(targetItem, actor);
		});

		Hooks.on('deleteActiveEffect', async (effect: any) => {
			if (effect.name !== 'Glyph') return;
			const item = effect.parent;
			if (!item || item.documentName !== 'Item') return;
			if (item.name === 'Runic Inscription') return;
			await Runesmith.removeRunicCastActivities(item);
		});

		Hooks.on('updateActiveEffect', async (effect: any, changes: any) => {
			if (effect.name !== 'Glyph' || !changes.disabled) return;
			const item = effect.parent;
			if (!item || item.documentName !== 'Item') return;
			if (item.name === 'Runic Inscription') return;
			await Runesmith.removeRunicCastActivities(item);
		});
	}

	private static async removeRunicCastActivities(item: any) {
		if (!item) return;
		const runicEntries = Object.entries(item.system.activities ?? {})
			.filter(([_, a]: [string, any]) => a.flags?.fftweaks?.runicInscription);
		for (const [id] of runicEntries) {
			await item.deleteActivity(id);
		}
	}

	private static async handleRunicInscription(targetItem: any, owningActor: any) {
		if (!targetItem || !owningActor) return;

		const spellMap = new Map<string, any>();
		for (const item of owningActor.items) {
			const level = item.system?.level;
			if (item.type !== 'spell' || typeof level !== 'number' || level < 1) continue;
			const key = `${item.name}::${level}`;
			if (!spellMap.has(key)) spellMap.set(key, item);
		}
		const spells = [...spellMap.values()];

		if (spells.length === 0) {
			ui.notifications?.warn('No eligible spells found.');
			return;
		}

		const dialogStyle = `
			<style>
				.fft-dialog .fft-container {
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
				}
				.fft-dialog .header {
					position: sticky;
					top: 0;
					z-index: 10;
				}
				.fft-dialog .filter-row {
					display: flex;
					align-items: center;
					padding: 0 8px;
					box-sizing: border-box;
					background: #222;
					color: #fff;
					border-bottom: 1px solid #444;
					height: 40px;
				}
				.fft-dialog .filter-row label {
					white-space: nowrap;
				}
				.fft-dialog .filter-row input {
					height: 24px;
					margin: 0 8px 0 4px;
					background: transparent;
					color: #fff;
					border: 1px solid #444;
					padding: 0 4px;
				}
				.fft-dialog .data-container {
					flex: 1;
					overflow: auto;
				}
				.fft-dialog .data-table {
					width: 100%;
					border-collapse: collapse;
					table-layout: fixed;
					font-size: 0.9em;
				}
				.fft-dialog .data-table col:nth-child(1) {
					width: 50px;
				}
				.fft-dialog .data-table tbody tr td {
					border: 1px solid #444;
					text-align: center;
					padding: 2px 4px;
				}
				.fft-dialog .spell-name-cell {
					text-align: left !important;
					padding-left: 4px;
				}
				.fft-dialog .button-row {
					flex: 0 0 40px;
					position: sticky;
					bottom: 0;
					z-index: 10;
					display: flex;
					justify-content: center;
					align-items: center;
					background: #222;
					border-top: 1px solid #444;
				}
				.fft-dialog #accept-btn {
					width: 100px;
					height: 28px;
				}
			</style>
		`;

		const chosenSpellUUID = await new Promise<string | null>((resolve) => {
			const dialogInstance: any = new Dialog({
				title: 'Select a Spell for Glyph',
				content: `
					<div class="fft-dialog">
						${dialogStyle}
						<div class="fft-container">
							<div class="header">
								<div class="filter-row">
									<label for="spell-filter">Filter:</label>
									<input type="text" id="spell-filter" placeholder="Search spell name..." />
								</div>
							</div>
							<div class="data-container">
								<table class="data-table">
									<colgroup>
										<col style="width: 30px;" />
										<col />
										<col style="width: 80px;" />
									</colgroup>
									<tbody id="spell-list">
										${spells.map((spell: any) => `
											<tr>
												<td><input type="radio" name="spell-choice" value="${spell.uuid}" /></td>
												<td class="spell-name-cell item-tooltip rollable"
													data-uuid="${spell.uuid}"
													role="button"
													data-action="use"
													aria-label="${spell.name}"
													data-tooltip="<section class='loading' data-uuid='${spell.uuid}'><i class='fas fa-spinner fa-spin-pulse'></i></section>"
													data-tooltip-class="dnd5e2 dnd5e-tooltip item-tooltip"
													data-tooltip-direction="LEFT">
													${spell.name}
												</td>
												<td>[${spell.system.level}]</td>
											</tr>
										`).join('')}
									</tbody>
								</table>
							</div>
							<div class="button-row">
								<button id="accept-btn" type="button">Accept</button>
							</div>
						</div>
					</div>
				`,
				buttons: {},
				render: (html: JQuery) => {
					game.tooltip.activate(html[0]);

					html.find('.spell-name-cell').on('click', async function () {
						const uuid = $(this).data('uuid');
						if (!uuid) return;
						const spellItem = await fromUuid(uuid);
						if (spellItem instanceof Item) spellItem.sheet.render(true);
					});

					html.find('#spell-filter').on('input', function () {
						const term = (this as HTMLInputElement).value.toLowerCase();
						html.find('#spell-list tr').each((_, row) => {
							const name = $(row).find('.spell-name-cell').text().toLowerCase();
							$(row).toggle(name.includes(term));
						});
					});

					html.find('#accept-btn').on('click', () => {
						const selected = html.find("input[name='spell-choice']:checked").val();
						if (!selected || typeof selected !== 'string') {
							ui.notifications?.warn('Select a spell first.');
							return;
						}
						resolve(selected);
						dialogInstance.close();
					});
				},
				close: () => resolve(null)
			}).render(true);
		});

		if (!chosenSpellUUID) return;

		await Runesmith.removeRunicCastActivities(targetItem);

		const activityId = foundry.utils.randomID();
		const activities = foundry.utils.duplicate(targetItem.system.toObject().activities ?? {});
		activities[activityId] = {
			type: 'cast',
			_id: activityId,
			spell: { uuid: chosenSpellUUID },
			uses: {
				max: '@scale.runesmith.rune-charges',
				spent: 0,
				recovery: [{ period: 'sr', type: 'recoverAll' }]
			},
			flags: { fftweaks: { runicInscription: true } }
		};

		await targetItem.update({ 'system.activities': activities });
		ui.notifications?.info(`Runic Inscription applied to ${targetItem.name}.`);
	}

	private static extraAttack() {}

	private static arcaneInscription() {}

	private static perfectedRunes() {}
}
