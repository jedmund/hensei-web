import type { FetchLike } from '../core'
import { get } from '../core'

export interface SummonEntity {
  id: string
  granblue_id: number
  name: { en?: string; ja?: string } | string
  element?: number
  rarity?: number
  uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean }
}

export const summons = {
  show: (f: FetchLike, id: string, init?: RequestInit) =>
    get<SummonEntity>(f, `/summons/${encodeURIComponent(id)}`, undefined, init)
}
