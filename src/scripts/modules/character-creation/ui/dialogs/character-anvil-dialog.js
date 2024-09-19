import { extractBackgroundData } from '../../services/compendium-service.js';
import { renderDialogTemplate } from '../ui-manager.js';

export async function openCharacterAnvilDialog() {
    // Render the existing template for the Character Anvil Dialog
    let html = await renderDialogTemplate('modules/fftweaks/templates/character-anvil-dialog.html');

    // Fetch the background data (which includes the names)
    const backgrounds = await extractBackgroundData(game.packs.get('fftweaks.character-creation'));

    // Create a list of background buttons to be included in the dialog
    const backgroundList = backgrounds.map(bg => `
        <li>
            <button type="button" class="background-button" title="
                Skills: ${bg.skills.join(', ') || 'None'}
                Languages: ${bg.languages.join(', ') || 'None'}
                Equipment: ${bg.equipment.map(e => e.id).join(', ') || 'None'}
                Currency: ${bg.currency || 'None'}
                Features: ${bg.features.join(', ') || 'None'}
            ">
                ${bg.name}
            </button>
        </li>
    `).join('');

    // Insert the background list into the appropriate section in the HTML
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelector('#background-list').innerHTML = backgroundList;

    // Render the dialog with the updated content
    new Dialog({
        title: "Character Anvil",
        content: container.innerHTML, // Use the modified HTML with populated sections
        buttons: {
            close: {
                label: "Close",
                callback: () => { /* Close action */ }
            }
        },
    }, {
        width: 1000,
        height: 600,
        resizable: true,
        classes: ["dialog"],
    }).render(true);
}
