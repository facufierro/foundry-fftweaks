import { ForestMap } from "../models/ForestMap.js";


export function generate(terrainType) {
    switch (terrainType) {
        case 'forest':
            const forestMap = new ForestMap();
            forestMap.generate();
            return forestMap;
    }
}