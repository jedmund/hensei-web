import type { FilterItem } from '$lib/types/filter'
import type { LocalizedName } from '$lib/types/api/entities'
import type { ElementType } from '$lib/stores/paneStack.svelte'
import { getElementKey } from '$lib/utils/element'
import { localizedName } from '$lib/utils/locale'
import { sidebar } from '$lib/stores/sidebar.svelte'
import PartiesPane from '$lib/components/sidebar/PartiesPane.svelte'

interface TeamsPaneEntity {
	granblueId: string
	name: LocalizedName | string
	element?: number
}

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

	openTeamsPaneForEntity(data: TeamsPaneEntity, entityType: string) {
		const entityFilter: FilterItem = {
			kind: 'entity',
			value: data.granblueId,
			label: localizedName(data.name) ?? data.granblueId,
			entityType,
			granblueId: data.granblueId,
			mode: 'include',
			element: data.element,
			pinned: true
		}
		this.reset(entityFilter)
		const name = localizedName(data.name)
		const elementName = data.element
			? (getElementKey(data.element) as ElementType)
			: undefined
		sidebar.openWithComponent(
			name,
			PartiesPane,
			{
				pinnedFilters: [entityFilter],
				defaultElement: data.element,
				useCollectionTeamsStore: true,
				resetKey: data.granblueId
			},
			{ scrollable: true, element: elementName }
		)
	}

	addEntityToTeamsView(data: TeamsPaneEntity, entityType: string) {
		this.addEntity({
			kind: 'entity',
			value: data.granblueId,
			label: localizedName(data.name) ?? data.granblueId,
			entityType,
			granblueId: data.granblueId,
			mode: 'include',
			element: data.element
		})
	}
}

export const collectionTeamsPane = new CollectionTeamsPaneStore()
