namespace FFT.Modules {
    export class SpellSelector {
        static isValidEvent(userId) {
            return game.user.isGM || userId === game.user.id;
        }

        static async showDialog(eventType: "add" | "remove", spellName: string, userId) {
            if (!this.isValidEvent(userId)) return;

            const content = `
                <p>Do you want to ${eventType} the spell "${spellName}"?</p>
            `;

            new FF.CustomDialog(
                `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Spell`,
                content,
                {
                    yes: {
                        label: "Yes",
                        callback: () => ui.notifications.info(`Spell "${spellName}" ${eventType}ed.`)
                    },
                    no: {
                        label: "No",
                        callback: () => ui.notifications.info(`Spell "${spellName}" was not ${eventType}ed.`)
                    }
                },
                "yes"
            ).render();
        }
    }
}
