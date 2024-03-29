import { weaponKeyGroups } from '../data/weaponKeyGroups'

export type GroupedWeaponKeys = {
  [key: string]: WeaponKey[]
  pendulum: WeaponKey[]
  chain: WeaponKey[]
  teluma: WeaponKey[]
  gauph: WeaponKey[]
  emblem: WeaponKey[]
  providence: WeaponKey[]
}

export function groupWeaponKeys(keys: WeaponKey[]) {
  const numGroups = Math.max.apply(
    Math,
    keys.map((key) => key.group)
  )

  let groupedKeys: GroupedWeaponKeys = {
    pendulum: [],
    chain: [],
    teluma: [],
    gauph: [],
    emblem: [],
    providence: [],
  }

  for (let i = 0; i <= numGroups; i++) {
    groupedKeys[weaponKeyGroups[i].slug] = keys.filter((key) => key.group == i)
  }

  return groupedKeys
}
