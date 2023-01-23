interface GridCharacter {
  id: string
  position: number
  object: Character
  uncap_level: number
  over_mastery: CharacterOverMastery
  aetherial_mastery: ExtendedMastery
  awakening: {
    type: number
    level: number
  }
  perpetuity: boolean
}
