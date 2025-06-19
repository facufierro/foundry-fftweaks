# FFTweaks Creature Generator

A comprehensive creature generation system for FoundryVTT D&D 5e that automatically enhances NPCs based on party level and encounter difficulty.

## Features

- **Automatic Token Enhancement**: Automatically enhances generic NPCs when tokens are placed
- **Template-Based System**: Uses JSON templates to define creature archetypes
- **Four Creature Types**: Minion, Standard, Elite, and Boss variants
- **CR-Based Scaling**: Scales creatures based on party level and encounter difficulty
- **Compendium Integration**: Prioritizes items/features/spells from fftweaks compendiums

## Usage

### Automatic Enhancement

When you place a token for an NPC with a generic name (guard, soldier, bandit, etc.), the system will automatically enhance it based on:
- The creature's name (determines template)
- Keywords in the name (determines variant type)
- Current party level and size
- Encounter difficulty setting

### Manual Enhancement

Use the console API to manually enhance creatures:

```javascript
// Enhance an existing actor
FFT.CreatureGenerator.enhanceActor(actor, "guard", { creatureType: "elite" });

// Create a new creature
FFT.CreatureGenerator.generateCreature("Elite Guard", "guard", { creatureType: "elite" });

// Convenience methods for specific types
FFT.CreatureGenerator.generateMinion("Weak Guard");
FFT.CreatureGenerator.generateStandard("Guard");
FFT.CreatureGenerator.generateElite("Elite Guard");
FFT.CreatureGenerator.generateBoss("Guard Captain");
```

### Available Options

```javascript
{
    partyLevel: 5,           // Override party level (default: auto-detected)
    partySize: 4,            // Override party size (default: auto-detected)  
    difficulty: "hard",      // "easy", "medium", "hard", "deadly"
    creatureType: "elite",   // "minion", "standard", "elite", "boss"
    templateName: "guard"    // Template to use
}
```

## Creature Types

- **Minion**: CR -1, basic equipment, no features
- **Standard**: Base CR, standard equipment, 1 feature max
- **Elite**: CR +1, better equipment, 2 features max
- **Boss**: CR +2, best equipment, 3 features max

## Templates

Currently includes:
- **Guard**: Humanoid soldiers with martial weapons and armor

Templates are stored in `src/modules/creature-generator/data/` and can be customized.

## Compendium Priority

The system searches for items/features/spells in this order:
1. `fftweaks.items`, `fftweaks.features`, `fftweaks.spells`
2. World items
3. Other compendiums

## API Reference

### Utility Functions

```javascript
// Get available templates
FFT.CreatureGenerator.getAvailableTemplates();

// Reload templates from files
FFT.CreatureGenerator.reloadTemplates();

// Calculate CR for encounter
FFT.CreatureGenerator.calculateCR(partyLevel, partySize, difficulty, creatureType);
```

## Template Structure

See `guard.json` for the complete template format. Each template includes:
- Base stats for each creature type
- Equipment sets with chance percentages
- Features with CR requirements and chances
- Optional spellcasting abilities

## Installation

The creature generator is automatically initialized when FFTweaks loads. No additional setup required.
