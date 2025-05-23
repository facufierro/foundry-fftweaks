async function distributeGold(): Promise<void> {
    const tokens = canvas.tokens?.controlled.filter(t => t.actor?.hasPlayerOwner);
    if (!tokens || tokens.length === 0) {
        ui.notifications?.warn("No player characters selected.");
        return;
    }

    new Dialog({
        title: "Distribute Gold",
        content: `<p><input id="gold" type="number" value="0" style="width:100%" placeholder="Total Gold" /></p>`,
        buttons: {
            ok: {
                label: "Distribute",
                callback: async (html: JQuery<HTMLElement>) => {
                    const goldInput = html.find("#gold").val();
                    const totalGold = Number(goldInput);
                    if (isNaN(totalGold) || totalGold <= 0) return;

                    const numTokens = tokens.length;
                    const baseShare = Math.floor(totalGold / numTokens);
                    let remainder = totalGold % numTokens;

                    // Create a shuffled copy of the tokens list
                    const shuffledTokens = tokens.slice().sort(() => Math.random() - 0.5);
                    const results: string[] = [];

                    for (let i = 0; i < shuffledTokens.length; i++) {
                        const token = shuffledTokens[i];
                        const actor = token.actor;
                        if (!actor) continue;

                        // Add 1 extra gp for the first [remainder] characters
                        const extra = i < remainder ? 1 : 0;
                        const totalShare = baseShare + extra;

                        const currentGold = foundry.utils.getProperty(actor.system, "currency.gp") ?? 0;
                        const newGold = currentGold + totalShare;

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
                                            +${totalShare} gp
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
                                    <h3 class="noborder">Total: ${totalGold} gp</h3>
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
