import type { CollectionSortKey } from '$lib/types/api/collection'

const STORAGE_KEY_PREFIX = 'collection-filters'

interface CharacterFilters {
	element: number[]
	rarity: number[]
	series: string[]
	race: number[]
	proficiency: number[]
	gender: number[]
	sort: CollectionSortKey
}

interface WeaponFilters {
	element: number[]
	rarity: number[]
	proficiency: number[]
	series: (number | string)[]
	sort: CollectionSortKey
}

interface SummonFilters {
	element: number[]
	rarity: number[]
	series: (number | string)[]
	sort: CollectionSortKey
}

interface ArtifactFilters {
	element: number[]
	proficiency: number[]
	rarity: 'all' | 'standard' | 'quirk'
	slot1: number[]
	slot2: number[]
	slot3: number[]
	slot4: number[]
	sort: CollectionSortKey
}

type EntityFilters = {
	characters: CharacterFilters
	weapons: WeaponFilters
	summons: SummonFilters
	artifacts: ArtifactFilters
}

const DEFAULTS: EntityFilters = {
	characters: {
		element: [],
		rarity: [],
		series: [],
		race: [],
		proficiency: [],
		gender: [],
		sort: 'name_asc'
	},
	weapons: { element: [], rarity: [], proficiency: [], series: [], sort: 'name_asc' },
	summons: { element: [], rarity: [], series: [], sort: 'name_asc' },
	artifacts: {
		element: [],
		proficiency: [],
		rarity: 'all',
		slot1: [],
		slot2: [],
		slot3: [],
		slot4: [],
		sort: 'score_desc'
	}
}

class CollectionFiltersStore {
	#characters = $state<CharacterFilters>({ ...DEFAULTS.characters })
	#weapons = $state<WeaponFilters>({ ...DEFAULTS.weapons })
	#summons = $state<SummonFilters>({ ...DEFAULTS.summons })
	#artifacts = $state<ArtifactFilters>({ ...DEFAULTS.artifacts })
	#initialized = false

	constructor() {
		if (typeof window !== 'undefined') {
			this.#loadFromStorage()
		}
	}

	#loadFromStorage() {
		if (this.#initialized) return
		this.#initialized = true

		this.#characters = this.#load('characters', DEFAULTS.characters)
		this.#weapons = this.#load('weapons', DEFAULTS.weapons)
		this.#summons = this.#load('summons', DEFAULTS.summons)
		this.#artifacts = this.#load('artifacts', DEFAULTS.artifacts)
	}

	#load<K extends keyof EntityFilters>(key: K, defaults: EntityFilters[K]): EntityFilters[K] {
		try {
			const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${key}`)
			if (!stored) return { ...defaults }
			const parsed = JSON.parse(stored)
			// Merge with defaults to handle missing keys from schema changes
			return { ...defaults, ...parsed }
		} catch {
			return { ...defaults }
		}
	}

	#save<K extends keyof EntityFilters>(key: K, value: EntityFilters[K]) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`${STORAGE_KEY_PREFIX}-${key}`, JSON.stringify(value))
		}
	}

	#ensureInit() {
		if (typeof window !== 'undefined' && !this.#initialized) {
			this.#loadFromStorage()
		}
	}

	get characters(): CharacterFilters {
		this.#ensureInit()
		return this.#characters
	}

	get weapons(): WeaponFilters {
		this.#ensureInit()
		return this.#weapons
	}

	get summons(): SummonFilters {
		this.#ensureInit()
		return this.#summons
	}

	get artifacts(): ArtifactFilters {
		this.#ensureInit()
		return this.#artifacts
	}

	setCharacters(filters: Partial<CharacterFilters>) {
		this.#characters = { ...this.#characters, ...filters }
		this.#save('characters', this.#characters)
	}

	setWeapons(filters: Partial<WeaponFilters>) {
		this.#weapons = { ...this.#weapons, ...filters }
		this.#save('weapons', this.#weapons)
	}

	setSummons(filters: Partial<SummonFilters>) {
		this.#summons = { ...this.#summons, ...filters }
		this.#save('summons', this.#summons)
	}

	setArtifacts(filters: Partial<ArtifactFilters>) {
		this.#artifacts = { ...this.#artifacts, ...filters }
		this.#save('artifacts', this.#artifacts)
	}
}

export const collectionFilters = new CollectionFiltersStore()
