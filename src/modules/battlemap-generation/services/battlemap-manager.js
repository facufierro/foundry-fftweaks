import { Battlemap } from "../models/Battlemap.js";

export async function generateTerrain(terrainType) {
    const battlemap = new Battlemap();
    switch (terrainType) {
        case 'forest':
            battlemap.generateForest();
    }
}

