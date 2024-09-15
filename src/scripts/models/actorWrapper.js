// models/actorWrapper.js

export class ActorWrapper {
    constructor(actor) {
        this.actor = actor;
        this.hp = actor.system.attributes.hp.value; // Use the current HP value
    }

    // A method to update the actor's HP
    async setHP(newHP) {
        await this.actor.update({ 'system.attributes.hp.value': newHP });
        ui.notifications.info(`${this.actor.name}'s HP changed to: ${newHP}`);
    }
}