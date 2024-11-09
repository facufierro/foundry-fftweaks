export function chooseItemsDialog(items, maxSelections = 1) {
    return new Promise(resolve => {
        const content = items.map((item, index) =>
            `<div><input type="checkbox" name="item" value="${index}" id="item-${index}" />
            <label for="item-${index}">${item.name}</label></div>`
        ).join("");

        new Dialog({
            title: "Choose Items",
            content: `<form>${content}</form>`,
            buttons: {
                choose: {
                    label: "Choose",
                    callback: (html) => {
                        const chosenItems = Array.from(html.find("input[name='item']:checked"))
                            .map(checkbox => items[parseInt(checkbox.value)]) // Retrieve full item objects
                            .slice(0, maxSelections);
                        resolve(chosenItems);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve([])
                }
            },
            close: () => resolve([])
        }).render(true);
    });
}
