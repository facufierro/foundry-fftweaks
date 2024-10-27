export function openAbilityPointBuyDialog(actor) {

    const pointBuy = {
        points: 27,
        costs: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 },
        scores: {
            "STR": 8,
            "DEX": 8,
            "CON": 8,
            "INT": 8,
            "WIS": 8,
            "CHA": 8
        }
    };

    // Calculate current point total
    function calculatePoints(scores) {
        return Object.values(scores).reduce((sum, score) => sum + pointBuy.costs[score], 0);
    }

    // Update the dialog display with the current points
    function updateDialogContent(html, scores, remainingPoints) {
        for (let [ability, score] of Object.entries(scores)) {
            html.find(`#${ability}-score`).text(score);
        }
        html.find("#remaining-points").text(remainingPoints);
    }

    // Open the dialog with point-buy options
    new Dialog({
        title: "D&D 5e Point Buy System",
        content: `
            <p>Use the point-buy system to allocate ability scores. You have a total of 27 points.</p>
            <p>Remaining Points: <span id="remaining-points">27</span></p>
            <table>
                <tr><th>Ability</th><th>Score</th><th>Increase</th><th>Decrease</th></tr>
                ${Object.keys(pointBuy.scores).map(ability => `
                    <tr>
                        <td>${ability}</td>
                        <td id="${ability}-score">8</td>
                        <td><button id="${ability}-increase">+</button></td>
                        <td><button id="${ability}-decrease">-</button></td>
                    </tr>
                `).join('')}
            </table>
        `,
        buttons: {
            ok: {
                label: "Confirm",
                callback: async (html) => {
                    // Apply the point-buy scores to the actor's abilities
                    const updates = {};
                    for (const [ability, score] of Object.entries(pointBuy.scores)) {
                        updates[`system.abilities.${ability.toLowerCase()}.value`] = score; // Note: using "system" instead of "data" if applicable
                    }
                    await actor.update(updates);
                    ui.notifications.info("Ability scores have been updated on the character sheet.");
                }
            },
            cancel: {
                label: "Cancel",
                callback: () => console.log("Point buy canceled.")
            }
        },
        render: (html) => {
            for (let ability of Object.keys(pointBuy.scores)) {
                // Event listeners for increase button
                html.find(`#${ability}-increase`).click(() => {
                    if (pointBuy.scores[ability] < 15) {
                        let newScore = pointBuy.scores[ability] + 1;
                        let currentPoints = calculatePoints({ ...pointBuy.scores, [ability]: newScore });
                        if (currentPoints <= pointBuy.points) {
                            pointBuy.scores[ability] = newScore;
                            updateDialogContent(html, pointBuy.scores, pointBuy.points - currentPoints);
                        }
                    }
                });
                // Event listeners for decrease button
                html.find(`#${ability}-decrease`).click(() => {
                    if (pointBuy.scores[ability] > 8) {
                        let newScore = pointBuy.scores[ability] - 1;
                        pointBuy.scores[ability] = newScore;
                        let currentPoints = calculatePoints(pointBuy.scores);
                        updateDialogContent(html, pointBuy.scores, pointBuy.points - currentPoints);
                    }
                });
            }
        }
    }).render(true);
}
