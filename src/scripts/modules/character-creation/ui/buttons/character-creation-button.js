import { createButton } from '../ui-manager.js';
import { openAbilityPointBuyDialog } from '../dialogs/ability-point-buy.js';

export function addCharacterCreationButton(html, actor) {
    if (html.find('.character-creation-button').length > 0) return;

    const characterCreationButton = createButton({
        classes: ['character-creation-button', 'gold-button'],
        icon: 'fas fa-arrow-alt-circle-up',
        tooltip: 'Character Creation',
        onClick: () => openAbilityPointBuyDialog(actor)
    });
    const xpLabel = html.find('.xp-label');
    xpLabel.before(characterCreationButton);
}
