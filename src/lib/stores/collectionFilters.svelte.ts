import type { CollectionSortKey } from '$lib/types/api/collection'

// Bump the version when the stored filter values change meaning; older keys are removed on load
const STORAGE_VERSION = 2
const STORAGE_KEY_PREFIX = `collection-filters-v${STORAGE_VERSION}`
const LEGACY_STORAGE_KEYS = ['characters', 'weapons', 'summons', 'artifacts'].map(
	(key) => `collection-filters-${key}`
)

interface CharacterFilters {
	element: number[]
	rarity: number[]
	series: string[]
	race: number[]
	proficiency: number[]
	gender: number[]
}

interface WeaponFilters {
	element: number[]
	rarity: number[]
	proficiency: number[]
	series: (number | string)[]
}

interface SummonFilters {
	element: number[]
	rarity: number[]
	series: (number | string)[]
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

/** Sort shared by the Characters, Weapons and Summons tabs when none has been chosen */
export const DEFAULT_ITEM_SORT: CollectionSortKey = 'release_date_desc'

// Saved tab filters from before the sort was shared may still carry a `sort` field; it is ignored
const ITEM_SORT_STORAGE_KEY = `${STORAGE_KEY_PREFIX}-item-sort`

export const COLLECTION_FILTER_DEFAULTS: EntityFilters = {
	characters: {
		element: [],
		rarity: [3],
		series: [],
		race: [],
		proficiency: [],
		gender: []
	},
	weapons: { element: [], rarity: [3], proficiency: [], series: [] },
	summons: { element: [], rarity: [3], series: [] },
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
	#characters = $state<CharacterFilters>({ ...COLLECTION_FILTER_DEFAULTS.characters })
	#weapons = $state<WeaponFilters>({ ...COLLECTION_FILTER_DEFAULTS.weapons })
	#summons = $state<SummonFilters>({ ...COLLECTION_FILTER_DEFAULTS.summons })
	#artifacts = $state<ArtifactFilters>({ ...COLLECTION_FILTER_DEFAULTS.artifacts })
	#itemSort = $state<CollectionSortKey>(DEFAULT_ITEM_SORT)
	// Kept in memory only, so browsing another user's collection never changes the viewer's own sort
	#visitorItemSort = $state<CollectionSortKey>(DEFAULT_ITEM_SORT)
	#initialized = false

	constructor() {
		if (typeof window !== 'undefined') {
			this.#loadFromStorage()
		}
	}

	#loadFromStorage() {
		if (this.#initialized) return
		this.#initialized = true

		try {
			for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key)
		} catch {
			// Storage unavailable
		}

		this.#characters = this.#load('characters', COLLECTION_FILTER_DEFAULTS.characters)
		this.#weapons = this.#load('weapons', COLLECTION_FILTER_DEFAULTS.weapons)
		this.#summons = this.#load('summons', COLLECTION_FILTER_DEFAULTS.summons)
		this.#artifacts = this.#load('artifacts', COLLECTION_FILTER_DEFAULTS.artifacts)

		try {
			const storedSort = localStorage.getItem(ITEM_SORT_STORAGE_KEY)
			if (storedSort) this.#itemSort = storedSort as CollectionSortKey
		} catch {
			// Storage unavailable
		}
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
			try {
				localStorage.setItem(`${STORAGE_KEY_PREFIX}-${key}`, JSON.stringify(value))
			} catch {
				// Storage unavailable or full
			}
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

	/** The sort shared by the Characters, Weapons and Summons tabs */
	getItemSort(isOwner: boolean): CollectionSortKey {
		this.#ensureInit()
		return isOwner ? this.#itemSort : this.#visitorItemSort
	}

	setItemSort(isOwner: boolean, sort: CollectionSortKey) {
		if (!isOwner) {
			this.#visitorItemSort = sort
			return
		}
		this.#itemSort = sort
		try {
			localStorage.setItem(ITEM_SORT_STORAGE_KEY, sort)
		} catch {
			// Storage unavailable or full
		}
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
