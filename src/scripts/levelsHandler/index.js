export function initialize() {
    Hooks.on("canvasReady", (canvas) => {
        const levelsControl = document.querySelector('li[data-control="levels"]');
        if (levelsControl) {
            console.log("Levels control found. Clicking the Levels control.");
            levelsControl.click();

            setTimeout(() => {
                const floorInput = document.querySelector('input.level-name[value="0"], input.level-name[value="ground floor"], input.level-name[value="Ground Floor"]');
                if (floorInput) {
                    console.log("Found floor level: " + floorInput.value + ". Selecting it.");
                    floorInput.click();
                } else {
                    console.log("No matching floor level (0 or 'ground floor') found.");
                }
            }, 200);
        } else {
            console.log("Levels control not found.");
        }
    });
}
