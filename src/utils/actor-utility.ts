export class ActorUtility {
	static getItemByName(actor: any, itemName: string) {
		if (!actor?.items || !itemName) return null;

		return actor.items.getName(itemName) ?? null;
	}

	static hasItemByName(actor: any, itemName: string) {
		return !!ActorUtility.getItemByName(actor, itemName);
	}
}
