import type { FetchLike } from '../core'
import { get } from '../core'

export interface CharacterEntity {
  id: string
  granblue_id: number | string
  name: { en?: string; ja?: string } | string
  element?: number
  rarity?: number
  uncap?: { flb?: boolean; ulb?: boolean }
}

export const characters = {
  show: (f: FetchLike, id: string, init?: RequestInit) =>
    get<CharacterEntity>(f, `/characters/${encodeURIComponent(id)}`, undefined, init)
}
