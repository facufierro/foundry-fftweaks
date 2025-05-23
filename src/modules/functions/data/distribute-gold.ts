async function distributeGold(): Promise<void> {
    const tokens = canvas.tokens?.controlled;
    if (!tokens || tokens.length === 0) {
        ui.notifications?.warn("No tokens selected.");
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

                    const share = Math.floor(totalGold / tokens.length);
                    const results: string[] = [];

                    for (const token of tokens) {
                        const actor = token.actor;
                        if (!actor) continue;

                        const currentGold = foundry.utils.getProperty(actor.system, "currency.gp") ?? 0;
                        const newGold = currentGold + share;

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
                                            +${share} gp
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
                        speaker: ChatMessage.getSpeaker(),
                    });
                }
            },
            cancel: { label: "Cancel" }
        },
        default: "ok"
    }).render(true);
}