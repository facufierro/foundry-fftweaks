let action = null;

export function initialize() {
    Hooks.on('dnd5e.preUseActivity', (activity) => {
        action = new Action(activity);
        ui.notifications.info(action.checkDistance());
        action.rollAttack();
        console.log(activity);
        return false;
    });
}
class Action {
    constructor(activity) {
        this.actor = activity.actor;
        this.token = canvas.tokens.controlled[0];
        this.item = activity.item;
        this.activity = activity;
        this.targets = Array.from(game.user.targets);
    }

    checkDistance() {
        let activity_range = this.activity.range.value;
        if (activity_range == null) {
            activity_range = 5;
        }

        const start = { x: this.token.x, y: this.token.y };

        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            const end = { x: target.x, y: target.y };

            const result = canvas.grid.measurePath([start, end]);
            const distance = result.distance;

            if (distance <= activity_range) {
                return true;
            }
        }
        return false;
    }

    rollAttack() {
        const config = {
            advantage: "none", // Set to "none" for a normal roll (instead of "advantage" or "disadvantage")
            fastForward: true  // Force the roll to skip the dialog and execute immediately
        };

        const dialog = {
            useDialog: false  // Ensures that the dialog does not pop up
        };

        this.activity.rollAttack(config, dialog);
    }

}
