import { Background } from '../models/Background.js';

export async function extractBackgroundData(compendium) {
    const entries = await compendium.getDocuments();

    const backgroundEntries = entries.filter(entry => entry.type === 'background');

    return backgroundEntries.map(entry => {
        const data = entry.toObject();
        const { _id: id, name, system } = data;

        const description = system.description?.value || '';

        // Create a new Background instance with the name
        const background = new Background(id, name, description);

        // Return the parsed summary for each background
        return background.getSummary();
    });
}
