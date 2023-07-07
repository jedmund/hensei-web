import * as Awakening from './AwakeningTransformer'
import * as Element from './ElementTransformer'
import * as Weapon from './WeaponTransformer'
import * as WeaponKey from './WeaponKeyTransformer'

// Transforms API response to GridWeapon object
export function toObject(data: any): GridWeapon {
  return {
    id: data.id,
    object: Weapon.toObject(data.object),
    position: data.position,
    mainhand: data.mainhand,
    uncapLevel: data.uncap_level,
    element: Element.toObject(data.element),
    weaponKeys: data.weapon_keys.map((key: any) => WeaponKey.toObject(key)),
    ax: data.ax,
    awakening: {
      type: Awakening.toObject(data.awakening.type),
      level: data.awakening.awakening_level,
    },
  }
}

// Transforms User object into API parameters
export function toParams(data: GridWeapon): GridWeaponParams {
  return {
    weapon_id: data.id,
    position: data.position,
    uncapLevel: data.uncapLevel,
    element: data.element.id,
    weapon_key1_id: data.weaponKeys?.[0].id,
    weapon_key2_id: data.weaponKeys?.[1].id,
    weapon_key3_id: data.weaponKeys?.[2].id,
    ax_modifier1: data.ax?.[0].modifier,
    ax_modifier2: data.ax?.[1].modifier,
    ax_strength1: data.ax?.[0].strength,
    ax_strength2: data.ax?.[1].strength,
    awakening_id: data.awakening?.type.id,
    awakening_level: data.awakening?.level,
  }
}
