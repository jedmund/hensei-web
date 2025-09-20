import type { FetchLike } from '$lib/api/core'
import { get } from '$lib/api/core'
import { error } from '@sveltejs/kit'

export type Resource = 'characters' | 'weapons' | 'summons'

function singular(type: Resource): 'character' | 'weapon' | 'summon' {
  if (type === 'characters') return 'character'
  if (type === 'weapons') return 'weapon'
  return 'summon'
}

export async function getResourceDetail(fetch: FetchLike, type: Resource, id: string, normalize?: (m: any) => any) {
  try {
    const item = await get<any>(fetch, `/${type}/${id}`)
    if (!item) throw error(404, 'Not found')
    return normalize ? normalize(item) : item
  } catch (e: any) {
    // Map HTTP 404 from API client into SvelteKit 404
    if (e?.message?.includes('HTTP 404')) throw error(404, 'Not found')
    throw error(500, `Failed to load ${singular(type)}`)
  }
}

export const createDetailLoader = (type: Resource, normalize?: (m: any) => any) =>
  async ({ params, fetch, parent }: { params: { id: string }; fetch: FetchLike; parent: () => Promise<any> }) => {
    const { role } = await parent()
    const item = await getResourceDetail(fetch, type, params.id, normalize)
    return { [singular(type)]: item, role }
  }

