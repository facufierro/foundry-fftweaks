// D&D 5e System Type Augmentations

export {};

declare global {
  // Global dnd5e namespace
  var dnd5e: {
    applications: Record<string, any>;
    config: Record<string, any>;
    documents: {
      Actor5e: typeof Actor;
      Item5e: typeof Item;
    };
    registry: any;
  };

  // Extend Actor with dnd5e-specific system properties
  interface Actor {
    system: {
      attributes?: {
        hp?: {
          value: number;
          max: number;
          temp?: number;
          tempmax?: number;
        };
        ac?: {
          value: number;
        };
        movement?: {
          walk?: number;
          fly?: number;
          swim?: number;
          climb?: number;
        };
      };
      details?: {
        xp?: {
          value: number;
          max?: number;
        };
        level?: number;
        cr?: number;
      };
      currency?: {
        pp?: number;
        gp?: number;
        ep?: number;
        sp?: number;
        cp?: number;
      };
      traits?: any;
      skills?: any;
      spells?: any;
    } & Record<string, any>;
  }

  // Extend Item with dnd5e-specific system properties  
  interface Item {
    system: {
      description?: {
        value: string;
        chat?: string;
      };
      quantity?: number;
      weight?: number;
      price?: {
        value: number;
        denomination?: string;
      };
      rarity?: string;
      identified?: boolean;
      type?: {
        value?: string;
      };
      activation?: any;
      damage?: any;
      uses?: any;
    } & Record<string, any>;
  }
}
