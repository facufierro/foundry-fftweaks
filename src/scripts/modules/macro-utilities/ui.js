export function chooseItemsDialog(items, maxSelections = 1) {
    return new Promise(resolve => {
        const content = items.map((item, index) =>
            `<div><input type="checkbox" name="item" value="${item.id}" id="item-${index}" />
            <label for="item-${index}">${item.name}</label></div>`
        ).join("");

        new Dialog({
            title: "Choose Items",
            content: `<form>${content}</form>`,
            buttons: {
                choose: {
                    label: "Choose",
                    callback: (html) => {
                        const chosenIds = Array.from(html.find("input[name='item']:checked"))
                            .map(checkbox => checkbox.value)
                            .slice(0, maxSelections);
                        resolve(chosenIds);
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