# Target Picker Module

An enhanced target selection system for FoundryVTT D&D 5e that provides visual range indicators and streamlined multi-target selection.

## Features

- **Automatic Interception**: Intercepts D&D 5e activity usage (attacks, spells) to trigger custom target selection
- **Visual Range Display**: Shows range rings and distance indicators when integrated with Levels 3D Preview
- **Multi-Target Support**: Allows selecting multiple targets with visual count tracking
- **Smart Activity Execution**: Automatically handles forward activities for multi-target spells
- **First Cast Validation**: Only proceeds with subsequent targets if the initial cast succeeds

## Components

### `core.ts`
Main `TargetPicker` class that manages the target selection UI and interaction flow. Handles mouse events, target counting, and selection state.

### `activity-interceptor.ts`
`ActivityInterceptor` hooks into D&D 5e's `preUseActivity` event to determine when target selection is needed and orchestrates the multi-target casting sequence.

### `range-display.ts`
`RangeDisplay` provides visual feedback through range rings and range finders, integrating with the Levels 3D Preview module when available.

### `index.ts`
Module entry point that registers the activity hook on initialization.

## Usage

The module initializes automatically and intercepts activities that require targeting (attacks or activities affecting ≥1 targets). Users can:

- **Left-click** tokens to select targets
- **Right-click** tokens to deselect or cancel the targeting process
- **+/-** keys to adjust the maximum target count (when manual adjustment is enabled)

Range indicators appear automatically when Levels 3D Preview is active, showing reachable targets and distance deficits for out-of-range tokens.
