export enum GridType {
  Character = 'character',
  Weapon = 'weapon',
  Summon = 'summon'
}

export enum TeamElement {
  Any = 0,
  Wind = 1,
  Fire = 2,
  Water = 3,
  Earth = 4,
  Dark = 5,
  Light = 6
}

export function getElementClass(element: number): string | null {
  switch (element) {
    case TeamElement.Wind: return 'wind'
    case TeamElement.Fire: return 'fire'
    case TeamElement.Water: return 'water'
    case TeamElement.Earth: return 'earth'
    case TeamElement.Dark: return 'dark'
    case TeamElement.Light: return 'light'
    default: return null
  }
}