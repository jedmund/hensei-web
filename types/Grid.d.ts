interface Grid {
  weapons: {
    mainWeapon?: GridWeapon | undefined
    allWeapons: GridArray<GridWeapon>
  }
  summons: {
    mainSummon?: GridSummon | undefined
    friendSummon?: GridSummon | undefined
    allSummons: GridArray<GridSummon>
  }
  characters: GridArray<GridCharacter>
}
