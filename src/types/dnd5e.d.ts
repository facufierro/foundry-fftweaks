export {};

declare global {
  // Global dnd5e namespace
  // This helps when you access `dnd5e.config` or `dnd5e.applications`
  var dnd5e: {
    applications: Record<string, any>;
    config: Record<string, any>;
    documents: Record<string, any>;
    registry: any;
    // Add more as you discover them
  };

  // Declaration Merging for Actor
  interface Actor {
    system: {
        // Define common 5e system properties here as you need them
        attributes?: {
            hp?: {
                value: number;
                max: number;
            }
        }
    } & Record<string, any>; // Fallback index signature to allow untyped usage
  }

  // Declaration Merging for Item
  interface Item {
    system: Record<string, any>;
  }
}
