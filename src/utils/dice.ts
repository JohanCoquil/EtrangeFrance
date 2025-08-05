export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export interface DiceResult {
  type: DiceType;
  result: number;
  modifier: number;
  total: number;
}

/**
 * Lance un dé du type spécifié
 */
export function rollDice(type: DiceType, modifier: number = 0): DiceResult {
  const max = getDiceMax(type);
  const result = Math.floor(Math.random() * max) + 1;
  const total = result + modifier;
  
  return {
    type,
    result,
    modifier,
    total
  };
}

/**
 * Lance plusieurs dés du même type
 */
export function rollMultipleDice(type: DiceType, count: number, modifier: number = 0): DiceResult[] {
  return Array.from({ length: count }, () => rollDice(type, modifier));
}

/**
 * Calcule la somme de plusieurs lancers de dés
 */
export function sumDiceResults(results: DiceResult[]): number {
  return results.reduce((sum, result) => sum + result.total, 0);
}

/**
 * Obtient la valeur maximale d'un dé
 */
export function getDiceMax(type: DiceType): number {
  switch (type) {
    case 'D4': return 4;
    case 'D6': return 6;
    case 'D8': return 8;
    case 'D10': return 10;
    case 'D12': return 12;
    case 'D20': return 20;
    case 'D100': return 100;
    default: return 6;
  }
}

/**
 * Formate un résultat de dé pour l'affichage
 */
export function formatDiceResult(result: DiceResult): string {
  const modifierText = result.modifier !== 0 
    ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`)
    : '';
  
  return `${result.type}: ${result.result}${modifierText} = ${result.total}`;
} 