export interface Character {
  id: string;
  name: string;
  species: string;
  profession: string;
  voice: string;
  
  // Caractéristiques principales
  characteristics: {
    force: number;
    agilite: number;
    intelligence: number;
    volonte: number;
    resistance: number;
    charisme: number;
  };
  
  // Compétences
  skills: Record<string, number>;
  
  // Santé
  health: {
    current: number;
    max: number;
    wounds: string[];
  };
  
  // Expérience
  experience: {
    current: number;
    total: number;
    level: number;
  };
  
  // Inventaire
  inventory: Item[];

  // Métadonnées
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  avatar_distant?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  properties?: Record<string, any>;
}

export interface Species {
  id: string;
  name: string;
  description: string;
  bonuses: Partial<Character['characteristics']>;
  specialAbilities: string[];
}

export interface Profession {
  id: string;
  name: string;
  description: string;
  skillBonuses: Record<string, number>;
  startingEquipment: string[];
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  power: string;
  limitation: string;
} 