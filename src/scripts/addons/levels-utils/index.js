export function initialize() {
    Hooks.on("canvasReady", (canvas) => {
        if (!game.user.isGM) return; // Only proceed if the user is the GM

        const levelsControl = document.querySelector('li[data-control="levels"]');
        if (levelsControl) {
            console.log("Levels control found. Clicking the Levels control.");
            levelsControl.click();

            setTimeout(() => {
                const floorInput = document.querySelector('input.level-name[value="0"], input.level-name[value="ground floor"], input.level-name[value="Ground Floor"]');
                if (floorInput) {
                    console.log("Found floor level: " + floorInput.value + ". Selecting it.");
                    floorInput.click();

                    // After selecting the floor, switch back to Token Controls
                    const tokenControls = document.querySelector('li[data-control="token"][data-canvas-layer="tokens"]');
                    if (tokenControls) {
                        console.log("Switching back to Token Controls.");
                        tokenControls.click();
                    } else {
                        console.log("Token Controls not found.");
                    }

                } else {
                    console.log("No matching floor level (0 or 'ground floor') found.");
                }
            }, 200); // Delay to ensure the Levels UI loads
        } else {
            console.log("Levels control not found.");
        }
    });
}
