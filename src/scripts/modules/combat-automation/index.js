let action = null;

export function initialize() {
    Hooks.on('dnd5e.preUseActivity', (activity) => {
        action = new Action(activity);
        if (action.checkDistance()) {
            action.rollAttack().then(isSuccessful => {
                if (isSuccessful) {
                    action.rollDamage();
                }
            });
        }
        return false;
    });
}

class Action {
    constructor(activity) {
        this.actor = activity.actor;
        this.token = canvas.tokens.controlled[0];

        if (!this.token) {
            ui.notifications.warn("Please select a controlled token.");
            return;
        }

        this.item = activity.item;
        this.activity = activity;
        this.target = this._getSingleTarget();
    }

    _getSingleTarget() {
        const targets = Array.from(game.user.targets);
        if (targets.length !== 1) {
            ui.notifications.warn("Please try again selecting a single target.");
            return null;
        }
        return targets[0];
    }

    checkDistance() {
        if (!this.target) return false;

        let activity_range = this.activity.range.value ?? 5;
        const start = { x: this.token.center.x, y: this.token.center.y };
        const end = { x: this.target.center.x, y: this.target.center.y };
        const distance = canvas.grid.measureDistance(start, end);

        if (distance <= activity_range) {
            return true;
        }
        ui.notifications.info("Target is out of range.");
        return false;
    }

    rollAttack() {
        if (!this.target) return Promise.resolve(false);

        return this.activity.rollAttack({}, { configure: false }).then(rollResults => {
            if (!rollResults || rollResults.length === 0) return false;

            const attackRoll = rollResults[0].total;
            const targetAC = this.target.actor.system.attributes.ac.value;
            return attackRoll >= targetAC;
        });
    }

    rollDamage() {
        this.activity.rollDamage({}, { configure: false });
    }
}
