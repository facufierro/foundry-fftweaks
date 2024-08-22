// Macro to toggle automatic clearing of notifications in Foundry VTT

// Check if the interval is already running
if (window.clearNotificationsInterval) {
    clearInterval(window.clearNotificationsInterval);
    delete window.clearNotificationsInterval;
    ui.notifications.info("Notification clearing deactivated.");
  } else {
    // Set an interval to clear notifications every second (or your desired interval)
    window.clearNotificationsInterval = setInterval(() => {
      if (ui.notifications.active.length > 0) {
        ui.notifications.active.forEach(notification => notification.remove());
        ui.notifications.active = [];
        ui.notifications.clear();
      }
    }, 10); // Adjust the interval (in milliseconds) as needed
  
    ui.notifications.info("Notification clearing activated.");
  }