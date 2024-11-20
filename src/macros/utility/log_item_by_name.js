let itemName = prompt("Enter the item name:");
let token = canvas.tokens.controlled[0];
let item = token?.actor?.items.find(i => i.name === itemName);
console.log(item);
