export type ViewMode = 'grid' | 'list'

const COLLECTION_VIEW_KEY = 'collection-view-mode'
const MODAL_VIEW_KEY = 'modal-view-mode'

class ViewModeStore {
	#collectionView = $state<ViewMode>('grid')
	#modalView = $state<ViewMode>('grid')
	#initialized = false

	constructor() {
		// Load from localStorage on client-side init
		if (typeof window !== 'undefined') {
			this.#loadFromStorage()
		}
	}

	#loadFromStorage() {
		if (this.#initialized) return
		this.#initialized = true

		const storedCollection = localStorage.getItem(COLLECTION_VIEW_KEY)
		if (storedCollection === 'grid' || storedCollection === 'list') {
			this.#collectionView = storedCollection
		}

		const storedModal = localStorage.getItem(MODAL_VIEW_KEY)
		if (storedModal === 'grid' || storedModal === 'list') {
			this.#modalView = storedModal
		}
	}

	get collectionView(): ViewMode {
		// Ensure we load from storage on first access (handles SSR -> client hydration)
		if (typeof window !== 'undefined' && !this.#initialized) {
			this.#loadFromStorage()
		}
		return this.#collectionView
	}

	get modalView(): ViewMode {
		if (typeof window !== 'undefined' && !this.#initialized) {
			this.#loadFromStorage()
		}
		return this.#modalView
	}

	setCollectionView(mode: ViewMode) {
		this.#collectionView = mode
		if (typeof window !== 'undefined') {
			localStorage.setItem(COLLECTION_VIEW_KEY, mode)
		}
	}

	setModalView(mode: ViewMode) {
		this.#modalView = mode
		if (typeof window !== 'undefined') {
			localStorage.setItem(MODAL_VIEW_KEY, mode)
		}
	}
}

export const viewMode = new ViewModeStore()
