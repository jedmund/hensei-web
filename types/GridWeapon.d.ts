interface GridWeapon {
  id: string
  mainhand: boolean
  position: number
  object: Weapon
  uncap_level: number
  transcendence_step: number
  element: number
  weapon_keys?: Array<WeaponKey>
  ax?: Array<SimpleAxSkill>
  awakening?: {
    type: Awakening
    level: number
  }
}
