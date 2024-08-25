let notificationsEnabled = true;
let originalInfo;
let toggleTimeout;

export function toggle(delay = 10) {
    delay *= 1000; // Convert the delay to milliseconds
    if (notificationsEnabled) {
        disable(); // Explicitly call the disable function
        // Set a timeout to re-enable notifications after the delay
        toggleTimeout = setTimeout(() => {
            enable();
        }, delay);
    } else {
        // Clear the previous timeout to extend the disable time
        clearTimeout(toggleTimeout);

        // Set a new timeout to re-enable notifications after the delay
        toggleTimeout = setTimeout(() => {
            enable();
        }, delay);
    }
}

export function disable() {
    if (notificationsEnabled) {
        // Save the original info method
        originalInfo = ui.notifications.info;

        // Disable only the info notifications by replacing the method with a no-op
        ui.notifications.info = () => { };
        notificationsEnabled = false;
        console.warn("Info notifications are now disabled.");
    }
}

export function enable() {
    if (!notificationsEnabled) {
        // Restore the original info method
        ui.notifications.info = originalInfo;
        notificationsEnabled = true;
        console.info("Info notifications are now enabled.");
    }
}
