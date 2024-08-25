import { BattleMap } from "../models/BattleMap.js";


export function generateTerrain(terrainType) {
    switch (terrainType) {
        case 'forest':
            const forestMap = new BattleMap();
            forestMap.generate();
            return forestMap;
    }
}

