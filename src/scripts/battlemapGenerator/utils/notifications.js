
let notificationsEnabled = true;

export function toggle(delay = 0) {
    if (notificationsEnabled) {
        // Disable notifications by replacing the methods with no-ops
        ui.notifications.info = () => { };
        ui.notifications.warn = () => { };
        ui.notifications.error = () => { };
        ui.notifications.success = () => { };
        notificationsEnabled = false;
        console.warn("Notifications are now disabled.");

        if (delay > 0) {
            setTimeout(() => {
                toggle(); // Re-enable after delay
            }, delay);
        }
    } else {
        // Restore the original methods
        ui.notifications.info = Notifications.prototype.info;
        ui.notifications.warn = Notifications.prototype.warn;
        ui.notifications.error = Notifications.prototype.error;
        ui.notifications.success = Notifications.prototype.success;
        notificationsEnabled = true;
        console.info("Notifications are now enabled.");
    }
}
