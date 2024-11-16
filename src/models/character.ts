namespace FFT {
    export class Character {
        actor: Actor;
        abilities: any;
        conditions: string[];

        constructor(actorId: string) {
            const actor = game.actors?.get(actorId);
            if (!actor) throw new Error(`Actor with ID ${actorId} not found.`);

            this.actor = actor;
            this.abilities = this.actor.system.abilities;
            FFT.Debug.Success(`Initialized character: ${this.actor.name}`);
            console.log(this.actor);
        }

    }
}