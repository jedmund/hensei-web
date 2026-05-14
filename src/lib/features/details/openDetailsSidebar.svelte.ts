import { localizedName } from '$lib/utils/locale'
import { getElementTypeKey } from '$lib/utils/element'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { partyStore } from '$lib/stores/partyStore.svelte'
import { type ElementType, type OverflowMenuItem } from '$lib/stores/paneStack.svelte'
import DetailsSidebar from '$lib/components/sidebar/DetailsSidebar.svelte'
import EditWeaponPane from '$lib/components/sidebar/EditWeaponPane.svelte'
import EditCharacterPane from '$lib/components/sidebar/EditCharacterPane.svelte'
import EditSummonPane from '$lib/components/sidebar/EditSummonPane.svelte'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import { canCharacterBeModified } from '$lib/utils/modificationDetector'
import * as m from '$lib/paraglide/messages'

interface DetailsSidebarOptions {
	type: 'weapon' | 'character' | 'summon'
	item: GridCharacter | GridWeapon | GridSummon
	onSaveWeapon?: (id: string, updates: Partial<GridWeapon>) => Promise<void>
	onSaveCharacter?: (id: string, updates: Partial<GridCharacter>) => Promise<void>
	isOwner?: boolean
	/** Owner-only: swap this slot's item for a different one (opens picker). */
	onReplace?: () => void
	/** Owner-only: remove the item from the slot. */
	onRemove?: () => void
	/** Forwarded to the edit pane so the Role tab can hit substitution + grid mutations */
	partyId?: string
	/** Forwarded to the edit pane so the Role tab can subscribe to the live party query */
	partyShortcode?: string
}

function getItemElement(
	type: 'weapon' | 'character' | 'summon',
	item: GridCharacter | GridWeapon | GridSummon
): ElementType | undefined {
	let elementId: number | undefined

	if (type === 'character') {
		elementId = (item as GridCharacter).character?.element
	} else if (type === 'weapon') {
		const weapon = item as GridWeapon
		// Use grid weapon element if set, otherwise canonical weapon element
		elementId = weapon.element || weapon.weapon?.element
	} else if (type === 'summon') {
		elementId = (item as GridSummon).summon?.element
	}

	return getElementTypeKey(elementId)
}

export function openDetailsSidebar(options: DetailsSidebarOptions) {
	const { type, item } = options

	// Get the item name for the title
	let itemName = 'Details'
	if (type === 'character' && (item as GridCharacter).character) {
		const char = (item as GridCharacter).character
		itemName = getName(char)
	} else if (type === 'weapon' && (item as GridWeapon).weapon) {
		const weapon = (item as GridWeapon).weapon
		itemName = getName(weapon)
	} else if (type === 'summon' && (item as GridSummon).summon) {
		const summon = (item as GridSummon).summon
		itemName = getName(summon)
	}

	// Owners can always edit notes (substitutes + description) on any weapon
	// or character, regardless of whether the item has stat-modifiable fields.
	// The edit pane itself decides whether to surface the Stats tab.
	const canEditWeapon = type === 'weapon' && !!(item as GridWeapon).id
	const canEditCharacter = type === 'character' && canCharacterBeModified(item as GridCharacter)
	const canEdit = canEditWeapon || canEditCharacter

	// Create edit handler for editable items
	// Look up fresh data from partyStore each time (same pattern as DetailsSidebar line 36)
	// to avoid stale closure references after save
	const onsave = canEdit
		? () => {
				if (canEditWeapon) {
					const freshWeapon = (partyStore.getItem('weapon', (item as GridWeapon).id!) ??
						item) as GridWeapon
					openWeaponEditSidebar(freshWeapon, options.onSaveWeapon, {
						partyId: options.partyId,
						partyShortcode: options.partyShortcode
					})
				} else if (canEditCharacter) {
					const freshChar = (partyStore.getItem('character', (item as GridCharacter).id!) ??
						item) as GridCharacter
					openCharacterEditSidebar(freshChar, options.onSaveCharacter, {
						partyId: options.partyId,
						partyShortcode: options.partyShortcode
					})
				}
			}
		: undefined

	// Get the element for styling
	const element = getItemElement(type, item)

	// Open the sidebar with the details component
	const title =
		itemName !== 'Details' ? itemName : `${type.charAt(0).toUpperCase() + type.slice(1)} Details`

	// Owner: primary action is Edit (opens edit pane). The picker (was the
	// "Replace" primary) and Remove drop into the overflow menu, both labelled
	// per type ("Edit character", "Remove character"). Non-owners just get the
	// view; the "Edit" primary stays for any editable items they have access to.
	const isOwner = options.isOwner ?? false
	const onReplace = options.onReplace
	const onRemove = options.onRemove
	const typeLabel = getTypeLabel(type)

	sidebar.openWithComponent(
		title,
		DetailsSidebar,
		{
			type,
			item
		},
		{
			onsave: onsave,
			saveLabel: m.action_edit(),
			element
		}
	)

	if (isOwner) {
		const overflow: OverflowMenuItem[] = []
		if (onReplace) {
			// The "replace" handler swaps the slot to a different item — label it
			// honestly so it doesn't get confused with the primary Edit action
			// (which opens the stat/notes edit pane).
			overflow.push({ label: m.context_replace({ type: typeLabel }), handler: onReplace })
		}
		if (onRemove) {
			overflow.push({
				label: m.context_remove_typed({ type: typeLabel }),
				handler: onRemove,
				variant: 'danger'
			})
		}
		if (overflow.length > 0) sidebar.setOverflowMenu(overflow)
	}
}

function getTypeLabel(type: 'character' | 'weapon' | 'summon'): string {
	if (type === 'character') return m.type_character()
	if (type === 'weapon') return m.type_weapon()
	return m.type_summon()
}

export function openWeaponEditSidebar(
	weapon: GridWeapon,
	onSaveWeapon?: (id: string, updates: Partial<GridWeapon>) => Promise<void>,
	context: { partyId?: string; partyShortcode?: string } = {}
) {
	const weaponName = getName(weapon.weapon)
	const title = weaponName !== 'Details' ? weaponName : 'Edit Weapon'
	const editPaneId = `edit-weapon-${weapon.id}`

	// If this edit pane is already in the stack, don't push a duplicate
	if (sidebar.paneStack.panes.some((p) => p.id === editPaneId)) return

	// Determine whether we're pushing onto an existing details view or opening fresh
	const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0

	// Handler to go back - pops if pushed on stack, closes if opened as root
	const goBack = () => {
		if (hasDetailsRoot) {
			sidebar.pop()
		} else {
			sidebar.close()
		}
	}

	// Handler for save button - uses gridService callback if available (updates TanStack cache),
	// otherwise falls back to partyStore (which bypasses cache)
	const handleSave = async (updates: Partial<GridWeapon>) => {
		if (!weapon.id) {
			console.error('Cannot save weapon without ID')
			goBack()
			return
		}

		try {
			if (onSaveWeapon) {
				await onSaveWeapon(String(weapon.id), updates)
			} else {
				await partyStore.updateWeapon(String(weapon.id), updates)
			}
			goBack()
		} catch (error) {
			console.error('Failed to save weapon:', error)
			goBack()
		}
	}

	const paneConfig = {
		id: editPaneId,
		title,
		component: EditWeaponPane,
		props: {
			weapon,
			partyId: context.partyId,
			partyShortcode: context.partyShortcode,
			onSave: handleSave,
			onCancel: goBack
		},
		onback: goBack
	}

	if (hasDetailsRoot) {
		sidebar.push(paneConfig)
	} else {
		sidebar.paneStack.reset(paneConfig)
		sidebar.state.open = true
	}
}

export function openCharacterEditSidebar(
	character: GridCharacter,
	onSaveCharacter?: (id: string, updates: Partial<GridCharacter>) => Promise<void>,
	context: {
		partyId?: string
		partyShortcode?: string
		/** Tab to open the edit pane on; defaults to 'stats'. */
		initialTab?: 'stats' | 'notes'
	} = {}
) {
	const characterName = getName(character.character)
	const title = characterName !== 'Details' ? characterName : 'Edit Character'
	const editPaneId = `edit-character-${character.id}`

	// If this edit pane is already in the stack, don't push a duplicate
	if (sidebar.paneStack.panes.some((p) => p.id === editPaneId)) return

	// Determine whether we're pushing onto an existing details view or opening fresh
	const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0

	// Handler to go back - pops if pushed on stack, closes if opened as root
	const goBack = () => {
		if (hasDetailsRoot) {
			sidebar.pop()
		} else {
			sidebar.close()
		}
	}

	// Handler for save button - uses gridService callback if available (updates TanStack cache),
	// otherwise falls back to partyStore (which bypasses cache)
	const handleSave = async (updates: Partial<GridCharacter>) => {
		if (!character.id) {
			console.error('Cannot save character without ID')
			goBack()
			return
		}

		try {
			if (onSaveCharacter) {
				await onSaveCharacter(String(character.id), updates)
			} else {
				await partyStore.updateCharacter(String(character.id), updates)
			}
			goBack()
		} catch (error) {
			console.error('Failed to save character:', error)
			goBack()
		}
	}

	const paneConfig = {
		id: editPaneId,
		title,
		component: EditCharacterPane,
		props: {
			character,
			partyId: context.partyId,
			partyShortcode: context.partyShortcode,
			initialTab: context.initialTab,
			onSave: handleSave,
			onCancel: goBack
		},
		onback: goBack
	}

	if (hasDetailsRoot) {
		sidebar.push(paneConfig)
	} else {
		sidebar.paneStack.reset(paneConfig)
		sidebar.state.open = true
	}
}

export function openSummonEditSidebar(
	summon: GridSummon,
	context: { partyId?: string; partyShortcode?: string } = {}
) {
	const summonName = getName(summon.summon)
	const title = summonName !== 'Details' ? summonName : 'Edit Summon'
	const editPaneId = `edit-summon-${summon.id}`

	if (sidebar.paneStack.panes.some((p) => p.id === editPaneId)) return

	const hasDetailsRoot = sidebar.isOpen && sidebar.paneStack.depth > 0
	const goBack = () => {
		if (hasDetailsRoot) {
			sidebar.pop()
		} else {
			sidebar.close()
		}
	}

	const paneConfig = {
		id: editPaneId,
		title,
		component: EditSummonPane,
		props: {
			summon,
			partyId: context.partyId,
			partyShortcode: context.partyShortcode,
			onCancel: goBack
		},
		onback: goBack
	}

	if (hasDetailsRoot) {
		sidebar.push(paneConfig)
	} else {
		sidebar.paneStack.reset(paneConfig)
		sidebar.state.open = true
	}
}

function getName(obj: unknown): string {
	if (!obj) return 'Details'
	const name =
		(typeof obj === 'object' && obj !== null && 'name' in obj
			? (obj as Record<string, unknown>).name
			: obj) ?? obj
	const resolved = localizedName(name)
	return resolved === '—' ? 'Details' : resolved
}

export function closeDetailsSidebar() {
	sidebar.close()
}
