interface GridWeapon {
  id: string
  mainhand: boolean
  position: number
  object: Weapon
  uncapLevel: number
  element: GranblueElement
  weaponKeys?: WeaponKey[]
  ax?: SimpleAxSkill[]
  awakening: {
    type: Awakening
    level: number
  } | null
}
