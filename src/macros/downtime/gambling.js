if (actor) {
  showSliderDialog(10); // Start with a default amount of 10
} else {
  ui.notifications.warn("No actor selected!");
}

function showSliderDialog(defaultAmount = 10) {
  let dialogTemplate = `
  <form>
    <div class="form-group">
      <label for="amount-range">Select Amount:</label>
      <input type="range" id="amount-range" name="amount" value="${defaultAmount}" min="1" max="1500" oninput="this.nextElementSibling.value = this.value">
      <output>${defaultAmount}</output>
    </div>
  </form>
  `;

  new Dialog({
    title: "Select Amount",
    content: dialogTemplate,
    buttons: {
      ok: {
        icon: "<i class='fas fa-check'></i>",
        label: "Submit",
        callback: html => {
          let amount = parseInt(html.find("input[name='amount']").val());
          if (!hasEnoughCurrency(actor, amount)) {
            ui.notifications.error("Insufficient funds for gambling.");
            showSliderDialog(amount); // Reshow the dialog with the last attempted amount
          } else {
            confirmGamble(amount);
          }
        }
      }
    },
    default: "ok"
  }).render(true);
}

function hasEnoughCurrency(actor, amount) {
  // Example check for D&D 5e system. Adjust according to your system's currency structure
  let currentGold = actor.data.data.currency.gp || 0;
  return currentGold >= amount;
}
function confirmGamble(amount) {
  new Dialog({
    title: "Confirm Gamble",
    content: `<p>Do you want to gamble <strong>${amount} gp</strong>?</p>`,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: "Yes",
        callback: () => performSkillChecks(amount)
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: "No"
      }
    },
    default: "no"
  }).render(true);
}
function performSkillChecks(amount) {
  let insight_dc = new Roll("2d10+5").evaluate({ async: false }).total;
  let deception_dc = new Roll("2d10+5").evaluate({ async: false }).total;
  let intimidation_dc = new Roll("2d10+5").evaluate({ async: false }).total;
  let insight_check = new Roll("1d20 + @mod", { mod: actor.data.data.skills.ins.mod }).evaluate({ async: false }).total;
  let deception_check = new Roll("1d20 + @mod", { mod: actor.data.data.skills.dec.mod }).evaluate({ async: false }).total;
  let intimidation_check = new Roll("1d20 + @mod", { mod: actor.data.data.skills.itm.mod }).evaluate({ async: false }).total;

  let successes = 0;
  successes += insight_check >= insight_dc ? 1 : 0;
  successes += deception_check >= deception_dc ? 1 : 0;
  successes += intimidation_check >= intimidation_dc ? 1 : 0;

  let result = 0;
  if (successes === 3) result = 2 * amount;
  else if (successes === 2) result = 1.5 * amount;
  else if (successes === 1) result = 0.5 * amount;

  adjustCurrency(result - amount);

  // Calculate net gain or loss
  let netResult = result - amount;
  let resultText = netResult === 0 ? "break even" : (netResult > 0 ? `win <strong>${Math.abs(netResult)} gp.</strong>` : `lose <strong>${Math.abs(netResult)} gp.</strong>`);

  ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `You gamble <strong>${amount} gp.</strong>`
      + `<br>Insight check: <strong>${insight_check}</strong> vs. DC <strong>${insight_dc}</strong>`
      + `<br>Deception check: <strong>${deception_check}</strong> vs. DC <strong>${deception_dc}</strong>`
      + `<br>Intimidation check: <strong>${intimidation_check}</strong> vs. DC <strong>${intimidation_dc}</strong>`
      + `<br><strong>Result:</strong> You ${resultText}`
  });
}


function adjustCurrency(amount) {
  // Example path for D&D 5e. Adjust according to your system
  let currentGold = actor.data.data.currency.gp;
  let updatedGold = currentGold + amount;
  actor.update({ "data.currency.gp": updatedGold });

  // Log the adjustment for verification
  console.log(`Adjusted currency by ${amount}. New total: ${updatedGold} gp.`);
}
