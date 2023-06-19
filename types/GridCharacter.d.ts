interface GridCharacter {
  id: string
  position: number
  object: Character
  uncap_level: number
  transcendence_step: number
  over_mastery: CharacterOverMastery
  aetherial_mastery: ExtendedMastery
  awakening: {
    type: Awakening
    level: number
  }
  perpetuity: boolean
}
