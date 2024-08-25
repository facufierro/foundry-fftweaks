
export function getBackgroundSize(name) {
    // Regular expression to match the size pattern in the name (e.g., 40x20)
    const sizePattern = /(\d+)x(\d+)/;
    const match = name.match(sizePattern);

    if (match) {
        const width = parseInt(match[1], 10) * 100;  // Convert to pixels by multiplying by 100
        const height = parseInt(match[2], 10) * 100; // Convert to pixels by multiplying by 100
        return { width, height };
    } else {
        // If no size pattern is found, log an error and return undefined dimensions
        console.error("No scene dimensions found in the image name.");
        return { width: undefined, height: undefined };
    }
}
