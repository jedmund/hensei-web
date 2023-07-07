interface Grid {
  weapons: {
    mainWeapon: GridWeapon | null
    allWeapons: GridArray<GridWeapon> | null
  }
  summons: {
    mainSummon: GridSummon | null
    friendSummon: GridSummon | null
    allSummons: GridArray<GridSummon> | null
  }
  characters: GridArray<GridCharacter> | null
}
