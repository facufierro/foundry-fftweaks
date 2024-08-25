export function element(list) {
    if (!Array.isArray(list) || list.length === 0) {
        throw new Error("The element list is empty or not an array.");
    }
    return list[Math.floor(Math.random() * list.length)];
}

export function number(min, max) {
    if (typeof min !== "number" || typeof max !== "number") {
        throw new Error("The min and max values must be numbers.");
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
