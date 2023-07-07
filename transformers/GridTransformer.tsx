import * as GridWeapon from '~transformers/GridWeaponTransformer'
import * as GridSummon from '~transformers/GridSummonTransformer'
import * as GridCharacter from '~transformers/GridCharacterTransformer'

// Transforms API response to Party object
export function toObject(data: any): Grid {
  return {
    characters: data.characters.map((character: any) =>
      GridCharacter.toObject(character)
    ),
    summons: {
      mainSummon: GridSummon.toObject(
        data.summons.find((summon: any) => summon.main === true)
      ),
      friendSummon: GridSummon.toObject(
        data.summons.find((summon: any) => summon.friend === true)
      ),
      allSummons: data.summons.map((summon: any) => {
        if (!summon.main && !summon.friend) return GridSummon.toObject(summon)
      }),
    },
    weapons: {
      mainWeapon: GridWeapon.toObject(
        data.weapons.find((weapon: any) => weapon.mainhand === true)
      ),
      allWeapons: data.weapons.map((weapon: any) => {
        if (!weapon.mainhand) return GridWeapon.toObject(weapon)
      }),
    },
  }
}
