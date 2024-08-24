import { ForestMap } from "../models/ForestMap.js";


export function generateTerrain(terrainType) {
    switch (terrainType) {
        case 'forest':
            const forestMap = new ForestMap('forest-background.jpg');
            forestMap.generate();
            return forestMap;
    }
}

