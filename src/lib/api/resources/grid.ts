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

export async function updateWeapon(
  fetch: FetchLike,
  partyId: string,
  gridWeaponId: string,
  updates: {
    position?: number
    uncapLevel?: number
    transcendenceStep?: number
    element?: number
  },
  headers?: Record<string, string>
): Promise<any> {
  const res = await fetch(buildUrl(`/grid_weapons/${gridWeaponId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ weapon: updates })
  })

  if (!res.ok) {
    throw new Error(`Failed to update weapon: ${res.statusText}`)
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

export async function updateSummon(
  fetch: FetchLike,
  partyId: string,
  gridSummonId: string,
  updates: {
    position?: number
    quickSummon?: boolean
    uncapLevel?: number
    transcendenceStep?: number
  },
  headers?: Record<string, string>
): Promise<any> {
  const res = await fetch(buildUrl(`/grid_summons/${gridSummonId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ summon: updates })
  })

  if (!res.ok) {
    throw new Error(`Failed to update summon: ${res.statusText}`)
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

export async function updateCharacter(
  fetch: FetchLike,
  partyId: string,
  gridCharacterId: string,
  updates: {
    position?: number
    uncapLevel?: number
    transcendenceStep?: number
    perpetuity?: boolean
  },
  headers?: Record<string, string>
): Promise<any> {
  const res = await fetch(buildUrl(`/grid_characters/${gridCharacterId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ character: updates })
  })

  if (!res.ok) {
    throw new Error(`Failed to update character: ${res.statusText}`)
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

// Uncap update methods - these use special endpoints
export async function updateCharacterUncap(
  gridCharacterId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    character: {
      id: gridCharacterId,
      ...(uncapLevel !== undefined && { uncap_level: uncapLevel }),
      ...(transcendenceStep !== undefined && { transcendence_step: transcendenceStep })
    }
  }

  const res = await fetch('/api/uncap/characters', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to update character uncap: ${res.statusText}`)
  }

  return res.json()
}

export async function updateWeaponUncap(
  gridWeaponId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    weapon: {
      id: gridWeaponId,
      ...(uncapLevel !== undefined && { uncap_level: uncapLevel }),
      ...(transcendenceStep !== undefined && { transcendence_step: transcendenceStep })
    }
  }

  const res = await fetch('/api/uncap/weapons', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to update weapon uncap: ${res.statusText}`)
  }

  return res.json()
}

export async function updateSummonUncap(
  gridSummonId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<any> {
  const body = {
    summon: {
      id: gridSummonId,
      ...(uncapLevel !== undefined && { uncap_level: uncapLevel }),
      ...(transcendenceStep !== undefined && { transcendence_step: transcendenceStep })
    }
  }

  const res = await fetch('/api/uncap/summons', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`Failed to update summon uncap: ${res.statusText}`)
  }

  return res.json()
}