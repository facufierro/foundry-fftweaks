export class UIManager {
    static addButtonToSheet(actor, html) {
        console.log("addButtonToSheet called for:", actor.name);

        if (actor.system?.details?.level > 0) {
            console.log("Actor level is greater than 0, button not added.");
            return;
        }

        if (html.find('.character-creation-button').length > 0) {
            console.log("Button already exists on sheet.");
            return;
        }

        const characterCreationButton = FFT.UI.createButton({
            classes: ['character-creation-button', 'gold-button'],
            icon: 'fas fa-arrow-alt-circle-up',
            tooltip: 'Character Creation',
            onClick: () => UIManager.renderDialog()
        }).css({
            margin: "0 3px"
        });

        const buttonContainer = html.find('.sheet-header-buttons');
        if (buttonContainer.length) {
            console.log("Button container found, appending button.");
            buttonContainer.append(characterCreationButton);
            buttonContainer.css({
                display: "flex",
                alignItems: "center",
                gap: "3px",
                marginBottom: "2px"
            });
        } else {
            console.warn("Button container (.sheet-header-buttons) not found.");
        }
    }

    static renderDialog() {
        const pointBuy = {
            pointsRemaining: 27,
            attributes: {
                STR: 8,
                DEX: 8,
                CON: 8,
                INT: 8,
                WIS: 8,
                CHA: 8
            }
        };

        const calculateCost = (score) => {
            if (score <= 8) return 0;
            return [0, 1, 2, 3, 4, 5, 7, 9][score - 8];
        };

        const updatePointsRemaining = (html) => {
            let pointsSpent = 0;
            for (const score of Object.values(pointBuy.attributes)) {
                pointsSpent += calculateCost(score);
            }
            pointBuy.pointsRemaining = 27 - pointsSpent;
            html.find("#points-remaining").text(`Points Remaining: ${pointBuy.pointsRemaining}`);
            html.find(".increase").prop("disabled", pointBuy.pointsRemaining <= 0);
            for (const [attr, score] of Object.entries(pointBuy.attributes)) {
                html.find(`#${attr}-increase`).prop("disabled", score >= 15 || pointBuy.pointsRemaining < calculateCost(score + 1) - calculateCost(score));
                html.find(`#${attr}-decrease`).prop("disabled", score <= 8);
            }
        };

        const dialogContent = `
            <style>
                .dialog-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-family: Arial, sans-serif;
                }
                .points-remaining {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 10px;
                    color: #444;
                }
                .attribute-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 8px;
                    margin: 4px 0;
                    background-color: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .attribute-row span {
                    width: 50px;
                    font-size: 14px;
                    color: #333;
                    font-weight: bold;
                }
                .attribute-row button {
                    width: 30px;
                    height: 30px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    color: #fff;
                    background-color: #555; /* Changed to dark gray */
                }
                .attribute-row button:disabled {
                    background-color: #bbb;
                    cursor: not-allowed;
                }
                .attribute-row #score {
                    width: 40px;
                    text-align: center;
                    font-size: 16px;
                    color: #444;
                }
                .confirm-button {
                    margin-top: 10px;
                    padding: 8px 16px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #4CAF50;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
            <div class="dialog-container">
                <h2 style="margin: 0; padding-bottom: 10px; font-size: 18px; color: #222;">27-Point Buy System</h2>
                <div class="points-remaining" id="points-remaining">Points Remaining: ${pointBuy.pointsRemaining}</div>
                ${Object.keys(pointBuy.attributes).map(attr => `
                    <div class="attribute-row">
                        <span>${attr}</span>
                        <button id="${attr}-decrease" class="decrease" data-attr="${attr}">-</button>
                        <span id="${attr}-score">${pointBuy.attributes[attr]}</span>
                        <button id="${attr}-increase" class="increase" data-attr="${attr}">+</button>
                    </div>
                `).join('')}
            </div>
        `;

        const dialog = new Dialog({
            title: "Point Buy Character Creation",
            content: dialogContent,
            buttons: {
                confirm: {
                    label: "Confirm",
                    callback: () => {
                        console.log("Final Attributes:", pointBuy.attributes);
                        console.log("Remaining Points:", pointBuy.pointsRemaining);
                        // Logic to update the actor with the selected attributes
                    },
                    icon: '<i class="fas fa-check"></i>'
                }
            },
            render: (html) => {
                updatePointsRemaining(html);

                html.find(".increase").on("click", (event) => {
                    const attr = event.currentTarget.dataset.attr;
                    if (pointBuy.attributes[attr] < 15) {
                        pointBuy.attributes[attr]++;
                        html.find(`#${attr}-score`).text(pointBuy.attributes[attr]);
                        updatePointsRemaining(html);
                    }
                });

                html.find(".decrease").on("click", (event) => {
                    const attr = event.currentTarget.dataset.attr;
                    if (pointBuy.attributes[attr] > 8) {
                        pointBuy.attributes[attr]--;
                        html.find(`#${attr}-score`).text(pointBuy.attributes[attr]);
                        updatePointsRemaining(html);
                    }
                });
            },
            close: (html) => {
                // Optionally, clear event listeners here if needed
            }
        }, {
            width: 300,
            height: 500
        });

        dialog.render(true);
    }
}
