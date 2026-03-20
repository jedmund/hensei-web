import type { FilterItem } from '$lib/components/explore/ExploreFilters.svelte'

class CollectionTeamsPaneStore {
	entities = $state<FilterItem[]>([])
	isOpen = $state(false)

	addEntity(filter: FilterItem) {
		if (filter.kind !== 'entity') return
		if (this.entities.some((e) => e.kind === 'entity' && e.granblueId === filter.granblueId))
			return
		this.entities = [...this.entities, filter]
	}

	reset(initialEntity?: FilterItem) {
		this.entities = initialEntity ? [initialEntity] : []
	}

	open() {
		this.isOpen = true
	}

	close() {
		this.isOpen = false
		this.entities = []
	}
}

export const collectionTeamsPane = new CollectionTeamsPaneStore()
