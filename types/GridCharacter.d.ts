interface GridCharacter {
  id: string
  position: number
  object: Character
  uncapLevel: number
  transcendenceStep?: number
  mastery: {
    overMastery?: CharacterOverMastery
    aetherialMastery?: ExtendedMastery
    awakening: {
      type: Awakening
      level?: number
    }
    perpetuity: boolean
  }
}
