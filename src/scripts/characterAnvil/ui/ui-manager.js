export function createButton({ classes = [], icon = '', tooltip = '', onClick = null }) {
    const button = $(`<button type="button" class="${classes.join(' ')}" data-tooltip="${tooltip}"><i class="${icon}"></i></button>`);
    if (onClick) button.on('click', onClick);
    return button;
}

export async function renderDialogTemplate(path) {
    return await renderTemplate(path);
}