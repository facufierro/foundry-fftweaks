async function distributeGold(): Promise<void> {
    const tokens = canvas.tokens?.controlled.filter(t => t.actor?.hasPlayerOwner);
    if (!tokens || tokens.length === 0) {
        ui.notifications?.warn("No player characters selected.");
        return;
    }

    new Dialog({
        title: "Distribute Gold",
        content: `
            <div style="text-align: center; margin: 10px 0;">
                <label for="gold">Enter amount of gold:</label><br>
                <input id="gold" type="number" value="0" style="width: 60%; text-align: center; margin-top: 5px;" placeholder="e.g. 100" />
                <div style="margin-top: 10px;">
                    <input type="checkbox" id="subtract" />
                    <label for="subtract">Subtract gold instead</label>
                </div>
            </div>
        `,
        buttons: {
            ok: {
                label: "Distribute",
                callback: async (html: JQuery<HTMLElement>) => {
                    const goldInput = html.find("#gold").val();
                    const subtractChecked = html.find("#subtract").is(":checked");

                    const inputGold = Number(goldInput);
                    if (isNaN(inputGold) || inputGold <= 0) return;

                    const isSubtraction = subtractChecked;
                    const totalGold = inputGold;
                    const numTokens = tokens.length;
                    const baseShare = Math.floor(totalGold / numTokens);
                    let remainder = totalGold % numTokens;

                    const shuffledTokens = tokens.slice().sort(() => Math.random() - 0.5);
                    const results: string[] = [];

                    for (let i = 0; i < shuffledTokens.length; i++) {
                        const token = shuffledTokens[i];
                        const actor = token.actor;
                        if (!actor) continue;

                        const extra = i < remainder ? 1 : 0;
                        const totalShare = baseShare + extra;

                        const currentGold = foundry.utils.getProperty(actor.system, "currency.gp") ?? 0;
                        const newGold = isSubtraction
                            ? Math.max(0, currentGold - totalShare)
                            : currentGold + totalShare;

                        const updateData: Record<string, unknown> = {};
                        foundry.utils.setProperty(updateData, "system.currency.gp", newGold);
                        await actor.update(updateData);

                        const portrait = actor.img;

                        results.push(`
                            <li class="item flexrow">
                                <div class="dice-roll flexcol">
                                    <div class="item-row flexrow">
                                        <div class="item-name flexrow">
                                            <div class="item-image" style="background-image:url('${portrait}'); background-size: cover;"></div>
                                            <h4>${actor.name}</h4>
                                        </div>
                                        <div class="dice-total xp-result flexrow noselect">
                                            ${isSubtraction ? "-" : "+"}${totalShare} gp
                                        </div>
                                    </div>
                                </div>
                            </li>
                        `);
                    }

                    const messageContent = `
                        <div class="monks-tokenbar assignxp chat-card item-card">
                            <header class="card-header flexrow">
                                <h3 class="item-name noborder">Gold Distribution</h3>
                                <div class="item-controls flexrow">
                                    <h3 class="noborder">Total: ${isSubtraction ? "-" : ""}${totalGold} gp</h3>
                                </div>
                            </header>
                            <div class="message-content" style="margin:5px 0px">
                                <div class="form-group sheet actor">
                                    <ol class="items-list inventory-list">
                                        <ol class="item-list">
                                            ${results.join("")}
                                        </ol>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    `;

                    await ChatMessage.create({
                        content: messageContent,
                        speaker: { alias: "" },
                    });
                }
            },
            cancel: { label: "Cancel" }
        },
        default: "ok"
    }).render(true);
}
