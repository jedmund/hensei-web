interface GridWeapon {
    id: string
    mainhand: boolean
    position: number
    object: Weapon
    uncap_level: number
    element: number
    weapon_keys?: WeaponKey[]
    ax?: SimpleAxSkill[]
}