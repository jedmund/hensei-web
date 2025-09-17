import type { FetchLike } from '../core'
import { get } from '../core'

export interface WeaponEntity {
  id: string
  granblue_id: number
  name: { en?: string; ja?: string } | string
  element?: number
  rarity?: number
  uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean }
}

export const weapons = {
  show: (f: FetchLike, id: string, init?: RequestInit) =>
    get<WeaponEntity>(f, `/weapons/${encodeURIComponent(id)}`, undefined, init)
}
