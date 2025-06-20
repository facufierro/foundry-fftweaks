# Target Picker Module

A simplified, clean target selection system for Foundry VTT.

## Structure

- **`core.ts`** - Main target picker implementation with clean, focused code
- **`range-display.ts`** - Range visualization functionality (optional, requires Levels 3D Preview module)
- **`index.ts`** - Module initialization and exports

## Features

- **Simple API**: Easy-to-use target selection with sensible defaults
- **Range Display**: Optional visual range indicators (when Levels 3D Preview is available)
- **Customizable**: Flexible options for different use cases
- **Clean Code**: Minimal, well-structured implementation without unnecessary complexity

## Basic Usage

```typescript
// Simple target selection
const success = await FFT.TargetPicker.pickTargets(token, 2);

// With range display
const success = await FFT.TargetPicker.pickTargets(
    token, 
    1, 
    { normal: 30, long: 60 },
    { showRangeDisplay: true }
);

// Advanced usage
const picker = new FFT.TargetPicker({
    token: currentToken,
    targets: 3,
    ranges: { normal: 25, long: 50 },
    options: {
        clearExistingTargets: false,
        allowManualTargetAdjustment: true,
        followCursor: true,
        showRangeDisplay: true
    }
});

const result = await picker.promise;
```

## Options

- **`clearExistingTargets`** (default: true) - Clear existing targets before selection
- **`showRangeDisplay`** (default: true) - Show range visualization if available
- **`allowManualTargetAdjustment`** (default: true) - Allow +/- keys to adjust target count
- **`followCursor`** (default: true) - Target counter follows mouse cursor

## Controls

- **Left click / T key**: Target a token
- **Right click**: Cancel target selection
- **+ / - keys**: Increase/decrease required target count (if enabled)

## Dependencies

- Core Foundry VTT
- Optional: Levels 3D Preview module (for range visualization)
