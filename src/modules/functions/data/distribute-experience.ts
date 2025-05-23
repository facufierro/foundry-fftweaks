async function distributeExperience(): Promise<void> {
    const tokens = canvas.tokens?.controlled.filter(t => t.actor?.hasPlayerOwner);
    if (!tokens || tokens.length === 0) {
        ui.notifications?.warn("No player characters selected.");
        return;
    }

    new Dialog({
        title: "Distribute XP",
        content: `
            <div style="text-align: center; margin: 10px 0;">
                <label for="xp">Enter amount of XP:</label><br>
                <input id="xp" type="number" value="0" style="width: 60%; text-align: center; margin-top: 5px;" placeholder="e.g. 500" />
                <div style="margin-top: 10px;">
                    <input type="checkbox" id="subtract" />
                    <label for="subtract">Subtract XP instead</label>
                </div>
            </div>
        `,
        buttons: {
            ok: {
                label: "Distribute",
                callback: async (html: JQuery<HTMLElement>) => {
                    const xpInput = html.find("#xp").val();
                    const subtractChecked = html.find("#subtract").is(":checked");

                    const inputXP = Number(xpInput);
                    if (isNaN(inputXP) || inputXP <= 0) return;

                    const isSubtraction = subtractChecked;
                    const totalXP = inputXP;
                    const numTokens = tokens.length;
                    const baseShare = Math.floor(totalXP / numTokens);
                    let remainder = totalXP % numTokens;

                    const shuffledTokens = tokens.slice().sort(() => Math.random() - 0.5);
                    const results: string[] = [];

                    for (let i = 0; i < shuffledTokens.length; i++) {
                        const token = shuffledTokens[i];
                        const actor = token.actor;
                        if (!actor) continue;

                        const extra = i < remainder ? 1 : 0;
                        const totalShare = baseShare + extra;

                        const currentXP = foundry.utils.getProperty(actor.system, "details.xp.value") ?? 0;
                        const newXP = isSubtraction
                            ? Math.max(0, currentXP - totalShare)
                            : currentXP + totalShare;

                        const updateData: Record<string, unknown> = {};
                        foundry.utils.setProperty(updateData, "system.details.xp.value", newXP);
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
                                            ${isSubtraction ? "-" : "+"}${totalShare} XP
                                        </div>
                                    </div>
                                </div>
                            </li>
                        `);
                    }

                    const messageContent = `
                        <div class="monks-tokenbar assignxp chat-card item-card">
                            <header class="card-header flexrow">
                                <h3 class="item-name noborder">XP Distribution</h3>
                                <div class="item-controls flexrow">
                                    <h3 class="noborder">Total: ${isSubtraction ? "-" : ""}${totalXP} XP</h3>
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
