import { buildUrl, type FetchLike } from '$lib/api/core'

/**
 * Grid API resource functions for managing party items
 */

// Weapon grid operations
export async function addWeapon(
  fetch: FetchLike,
  partyId: string,
  weaponId: string, // Granblue ID
  position: number,
  options?: {
    mainhand?: boolean
    uncapLevel?: number
    transcendenceStep?: number
    element?: number
  },
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    weapon: {
      party_id: partyId,
      weapon_id: weaponId,
      position,
      mainhand: position === -1 || options?.mainhand,
      uncap_level: options?.uncapLevel ?? 3,
      transcendence_step: options?.transcendenceStep ?? 0,
      element: options?.element
    }
  }

  const res = await fetch(buildUrl('/weapons'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to add weapon: ${res.statusText}`)
  }

  return res.json()
}

export async function removeWeapon(
  fetch: FetchLike,
  partyId: string,
  gridWeaponId: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl('/weapons'), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ grid_weapon_id: gridWeaponId })
  })

  if (!res.ok) {
    throw new Error(`Failed to remove weapon: ${res.statusText}`)
  }
}

// Summon grid operations
export async function addSummon(
  fetch: FetchLike,
  partyId: string,
  summonId: string, // Granblue ID
  position: number,
  options?: {
    main?: boolean
    friend?: boolean
    quickSummon?: boolean
    uncapLevel?: number
    transcendenceStep?: number
  },
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    summon: {
      party_id: partyId,
      summon_id: summonId,
      position,
      main: position === -1 || options?.main,
      friend: position === 6 || options?.friend,
      quick_summon: options?.quickSummon ?? false,
      uncap_level: options?.uncapLevel ?? 3,
      transcendence_step: options?.transcendenceStep ?? 0
    }
  }

  const res = await fetch(buildUrl('/summons'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to add summon: ${res.statusText}`)
  }

  return res.json()
}

export async function removeSummon(
  fetch: FetchLike,
  partyId: string,
  gridSummonId: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl('/summons'), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ grid_summon_id: gridSummonId })
  })

  if (!res.ok) {
    throw new Error(`Failed to remove summon: ${res.statusText}`)
  }
}

// Character grid operations
export async function addCharacter(
  fetch: FetchLike,
  partyId: string,
  characterId: string, // Granblue ID
  position: number,
  options?: {
    uncapLevel?: number
    transcendenceStep?: number
    perpetuity?: boolean
  },
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    character: {
      party_id: partyId,
      character_id: characterId,
      position,
      uncap_level: options?.uncapLevel ?? 3,
      transcendence_step: options?.transcendenceStep ?? 0,
      perpetuity: options?.perpetuity ?? false
    }
  }

  const res = await fetch(buildUrl('/characters'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to add character: ${res.statusText}`)
  }

  return res.json()
}

export async function removeCharacter(
  fetch: FetchLike,
  partyId: string,
  gridCharacterId: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl('/characters'), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ grid_character_id: gridCharacterId })
  })

  if (!res.ok) {
    throw new Error(`Failed to remove character: ${res.statusText}`)
  }
}