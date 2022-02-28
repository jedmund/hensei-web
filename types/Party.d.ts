interface Party {
    id: string
    name: string
    raid: Raid
    shortcode: string
    extra: boolean
    favorited: boolean
    characters: Array<GridCharacter>
    weapons: Array<GridWeapon>
    summons: Array<GridSummon>
    user: User
    created_at: string
    updated_at: string
}