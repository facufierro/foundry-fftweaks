# Equipment Generator

The Equipment Generator automatically applies predefined loot to NPCs when they are placed on the canvas in Foundry VTT.

## How it Works

1. **Automatic Application**: When a token is placed on the canvas, the system automatically checks for a corresponding JSON loot template based on the actor's name.
2. **Name Matching**: The actor's name is converted to lowercase and spaces are replaced with hyphens to match JSON filenames.
3. **Item Sources**: Items are first searched in the `fftweaks.items` compendium. If not found, placeholder items are created.
4. **Chance-based Loot**: Each item in the template has a percentage chance to be added to the actor.

## JSON Template Format

Templates are stored in `src/modules/functions/data/loot/data/` and follow this structure:

```json
{
  "name": "Guard",
  "description": "Standard equipment for city guards",
  "items": [
    {
      "name": "Chain Mail",
      "quantity": 1,
      "equipped": true,
      "chance": 100
    },
    {
      "name": "Shield",
      "quantity": 1,
      "equipped": true,
      "chance": 90
    }
  ]
}
```

### Template Properties

- **name**: Display name for the template
- **description**: Description of what this template represents
- **items**: Array of items to potentially add

### Item Properties

- **name**: Exact name of the item to find in the compendium
- **quantity**: How many of this item to add
- **equipped**: Whether the item should be equipped automatically
- **chance**: Percentage chance (0-100) that this item will be added

## Usage

### Automatic (Recommended)
Simply place a token on the canvas. If there's a matching JSON template for the actor's name, equipment will be applied automatically.

### Manual
Use the console command or macro:
```javascript
// Apply to selected token
FFT.Functions.generateEquipment();

// Apply to specific actor by name
FFT.Functions.generateEquipment("Guard");

// Alternative global function
generateEquipment("Bandit");
```

## Example Templates

### Guard (guard.json)
Standard city guard with chain mail, shield, and spear.

### Bandit (bandit.json) 
Highway robber with leather armor, scimitar, and shortbow.

### Orc (orc.json)
Orc warrior with hide armor, greataxe, and javelins.

### Wizard (wizard.json)
Enemy spellcaster with robes, quarterstaff, and spellbook.

## Creating New Templates

1. Create a new JSON file in `src/modules/functions/data/loot/data/`
2. Name it after the actor (lowercase, spaces as hyphens)
3. Follow the template format above
4. Test by placing a token with matching name

## Notes

- Only applies to NPCs (non-player owned actors)
- Items not found in compendium become placeholder "loot" items
- Equipped state only applies to equipment that supports it
- Templates are loaded dynamically, no restart required for changes
