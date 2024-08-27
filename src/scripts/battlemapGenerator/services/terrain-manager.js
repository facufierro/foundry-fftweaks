import { Battlemap } from "../models/Battlemap.js";


export function generateTerrain(terrainType) {
    const battlemap = new Battlemap();
    switch (terrainType) {
        case 'forest':
            battlemap.generateForest();
    }
}

