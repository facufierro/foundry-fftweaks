import { createButton } from '../ui-manager.js';
import { openAbilityPointBuyDialog } from '../dialogs/ability-point-buy.js';

export function addCharacterCreationButton(html, actor) {
    // Prevent duplicate button creation
    if (html.find('.character-creation-button').length > 0) return;

    // Create the character creation button
    const characterCreationButton = createButton({
        classes: ['character-creation-button', 'gold-button'],
        icon: 'fas fa-arrow-alt-circle-up',
        tooltip: 'Character Creation',
        onClick: () => openAbilityPointBuyDialog(actor)
    }).css({
        margin: "0 3px" // Add small horizontal margin to control button spacing
    });

    // Locate the .sheet-header-buttons container
    const buttonContainer = html.find('.sheet-header-buttons');

    // Insert the character creation button into the container
    if (buttonContainer.length) {
        buttonContainer.append(characterCreationButton); // Add the button at the end of the existing buttons
        buttonContainer.css({
            display: "flex",
            alignItems: "center", // Aligns the buttons vertically with the XP bar
            gap: "3px", // Sets uniform spacing between buttons
            marginBottom: "2px" // Brings buttons closer to the XP bar
        });
    }
}
