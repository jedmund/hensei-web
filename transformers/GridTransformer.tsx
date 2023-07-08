import * as GridWeapon from '~transformers/GridWeaponTransformer'
import * as GridSummon from '~transformers/GridSummonTransformer'
import * as GridCharacter from '~transformers/GridCharacterTransformer'

// Transforms API response to Party object
export function toObject(data: any): Grid {
  console.log('----- GridTransformer.tsx -----')
  console.log(data.summons, data.characters)
  console.log('----- End GridTransformer.tsx -----')

  const mainSummon = data.summons
    ? data.summons.find((summon: any) => summon.main === true)
    : null
  const friendSummon = data.summons
    ? data.summons.find((summon: any) => summon.friend === true)
    : null
  const allSummons = data.summons
    ? removeItem(data.summons, [mainSummon, friendSummon])
    : null

  const mainWeapon = data.weapons
    ? data.weapons.find((weapon: any) => weapon.mainhand === true)
    : null

  return {
    characters: data.characters
      ? mapToGridArrayWithTransformer(data.characters, GridCharacter.toObject)
      : null,
    summons: {
      mainSummon: mainSummon ? GridSummon.toObject(mainSummon) : null,
      friendSummon: friendSummon ? GridSummon.toObject(friendSummon) : null,
      allSummons: allSummons
        ? mapToGridArrayWithTransformer(allSummons, GridSummon.toObject)
        : null,
    },
    weapons: {
      mainWeapon: mainWeapon ? GridWeapon.toObject(mainWeapon) : null,
      allWeapons: data.weapons
        ? mapToGridArrayWithTransformer(data.weapons, GridWeapon.toObject)
        : null,
    },
  }
}

function removeItem<T>(arr: Array<T>, values: T[]): Array<T> {
  values.forEach((value) => {
    const index = arr.indexOf(value)
    if (index > -1) {
      arr.splice(index, 1)
    }
  })

  return arr
}

export function mapToGridArrayWithTransformer<T>(
  arr: any[],
  transformer: (data: any) => T
): GridArray<T> {
  return arr.reduce(
    (gridArray, item) => ({ ...gridArray, [item.position]: transformer(item) }),
    {} as GridArray<T>
  )
}
