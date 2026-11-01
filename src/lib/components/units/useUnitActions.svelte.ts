/**
 * Actions every grid unit (character, weapon, summon) shares: the sidebar
 * active and slot-selected state, the details sidebar, remove with
 * confirmation, replace, view in database, the collection teams pane and the
 * uncap/transcendence handlers.
 *
 * Per-type pieces (edit sidebars, duplicate, seals, badges) stay in the unit
 * component.
 *
 * @example
 * ```ts
 * const actions = useUnitActions({
 *   type: 'weapon',
 *   ctx,
 *   item: () => item,
 *   position: () => position,
 *   entity: () => item?.weapon,
 *   details: { onSaveWeapon: saveWeapon }
 * })
 * ```
 */
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import type { LocalizedName } from '$lib/types/api/entities'
import type { PartyContext } from '$lib/types/party-context'
import { goto } from '$app/navigation'
import { toast } from 'svelte-sonner'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { collectionTeamsPane } from '$lib/stores/collectionTeamsPane.svelte'
import { getDatabaseUrl } from '$lib/utils/database'
import {
	openDetailsSidebar,
	type DetailsSidebarOptions
} from '$lib/features/details/openDetailsSidebar.svelte'
import { GridType } from '$lib/types/enums'
import { extractErrorMessage } from '$lib/utils/errors'
import { useAsyncAction } from '$lib/utils/asyncAction.svelte'

export type UnitType = 'character' | 'weapon' | 'summon'

interface UnitEntity {
	granblueId: string
	name: LocalizedName | string
	element?: number
	styleSwap?: boolean
}

interface UseUnitActionsArgs {
	type: UnitType
	ctx: PartyContext
	item: () => GridCharacter | GridWeapon | GridSummon | undefined
	position: () => number
	/** The catalogue entry behind the grid item (item.character / .weapon / .summon) */
	entity: () => UnitEntity | undefined
	/** Save callback the details sidebar edits through (characters and weapons) */
	details?: Pick<DetailsSidebarOptions, 'onSaveCharacter' | 'onSaveWeapon'>
}

const GRID_TYPE = {
	character: GridType.Character,
	weapon: GridType.Weapon,
	summon: GridType.Summon
} as const

export type UnitActions = ReturnType<typeof useUnitActions>

export function useUnitActions(args: UseUnitActionsArgs) {
	const { type, ctx } = args

	// Check if this item is currently active in the sidebar
	const isActive = $derived.by(() => {
		const item = args.item()
		return item?.id && sidebar.activeItemId === String(item.id)
	})

	// Check if this slot is currently selected for adding/replacing an item
	const isSelected = $derived(
		ctx?.getSelectedSlot?.() === args.position() && ctx?.getActiveTab?.() === GRID_TYPE[type]
	)

	let removeConfirmOpen = $state(false)

	function remove() {
		if (!args.item()?.id) return
		removeConfirmOpen = true
	}

	const removeAction = useAsyncAction(async () => {
		const item = args.item()
		if (!item?.id) return
		const party = ctx.getParty()
		const editKey = ctx.getEditKey()
		const gridService = ctx.services.gridService
		if (type === 'character') {
			await gridService.removeCharacter(party.id, item.id, editKey || undefined)
		} else if (type === 'weapon') {
			await gridService.removeWeapon(party.id, item.id, editKey || undefined)
		} else {
			await gridService.removeSummon(party.id, item.id, editKey || undefined)
		}
	}, `Failed to remove ${type}`)

	function replace() {
		if (ctx?.openPicker) {
			ctx.openPicker({ type, position: args.position(), item: args.item() })
		}
	}

	/** The party ids the details and edit sidebars forward to their panes */
	function partyRefs() {
		const party = ctx.getParty()
		return { partyId: party?.id, partyShortcode: party?.shortcode }
	}

	function viewDetails() {
		const item = args.item()
		if (!item) return
		const canEdit = ctx?.canEdit()
		openDetailsSidebar({
			type,
			item,
			...args.details,
			isOwner: canEdit ?? false,
			onReplace: canEdit ? replace : undefined,
			onRemove: canEdit ? remove : undefined,
			...partyRefs()
		})
	}

	function viewInDatabase() {
		const entity = args.entity()
		if (!entity?.granblueId) return
		// Only characters have style-swap database pages
		goto(
			getDatabaseUrl(type, entity.granblueId, type === 'character' ? entity.styleSwap : undefined)
		)
	}

	function viewTeams() {
		const entity = args.entity()
		if (!entity) return
		collectionTeamsPane.openTeamsPaneForEntity(entity, type)
	}

	function addToTeamsView() {
		const entity = args.entity()
		if (!entity) return
		collectionTeamsPane.addEntityToTeamsView(entity, type)
	}

	function saveUncap(id: string, uncapLevel?: number, transcendenceStep?: number) {
		const editKey = ctx.getEditKey()
		const gridService = ctx.services.gridService
		if (type === 'character') {
			return gridService.updateCharacterUncap(
				id,
				uncapLevel,
				transcendenceStep,
				editKey || undefined
			)
		}
		if (type === 'weapon') {
			return gridService.updateWeaponUncap(id, uncapLevel, transcendenceStep, editKey || undefined)
		}
		return gridService.updateSummonUncap(id, uncapLevel, transcendenceStep, editKey || undefined)
	}

	async function updateUncap(level: number) {
		const item = args.item()
		if (!item?.id || !ctx) return
		try {
			await saveUncap(item.id, level, undefined)
		} catch (err) {
			console.error(`Failed to update ${type} uncap:`, err)
			toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
		}
	}

	async function updateTranscendence(stage: number) {
		const item = args.item()
		if (!item?.id || !ctx) return
		try {
			// When setting transcendence > 0, also set uncap to max (6)
			const maxUncap = stage > 0 ? 6 : undefined
			await saveUncap(item.id, maxUncap, stage)
		} catch (err) {
			console.error(`Failed to update ${type} transcendence:`, err)
			toast.error(extractErrorMessage(err, 'Failed to update transcendence'))
		}
	}

	return {
		get isActive() {
			return isActive
		},
		get isSelected() {
			return isSelected
		},
		get removeConfirmOpen() {
			return removeConfirmOpen
		},
		set removeConfirmOpen(open: boolean) {
			removeConfirmOpen = open
		},
		get isTeamsPaneOpen() {
			return collectionTeamsPane.isOpen
		},
		remove,
		removeAction,
		replace,
		partyRefs,
		viewDetails,
		viewInDatabase,
		viewTeams,
		addToTeamsView,
		updateUncap,
		updateTranscendence
	}
}
