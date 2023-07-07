import * as GridWeapon from '~transformers/GridWeaponTransformer'
import * as GridSummon from '~transformers/GridSummonTransformer'
import * as GridCharacter from '~transformers/GridCharacterTransformer'

// Transforms API response to Party object
export function toObject(data: any): Grid {
  const mainSummon = data.summons.find((summon: any) => summon.main === true)
  const friendSummon = data.summons.find(
    (summon: any) => summon.friend === true
  )
  const mainWeapon = data.weapons.find(
    (weapon: any) => weapon.mainhand === true
  )
  return {
    characters: data.characters.map((character: any) =>
      GridCharacter.toObject(character)
    ),
    summons: {
      mainSummon: mainSummon ? GridSummon.toObject(mainSummon) : null,
      friendSummon: friendSummon ? GridSummon.toObject(friendSummon) : null,
      allSummons: data.summons.map((summon: any) => {
        if (!summon.main && !summon.friend) return GridSummon.toObject(summon)
      }),
    },
    weapons: {
      mainWeapon: mainWeapon ? GridWeapon.toObject(mainWeapon) : null,
      allWeapons: data.weapons.map((weapon: any) => {
        if (!weapon.mainhand) return GridWeapon.toObject(weapon)
      }),
    },
  }
}
