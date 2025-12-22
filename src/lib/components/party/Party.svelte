<script lang="ts">
	import { onMount, getContext, setContext, onDestroy } from 'svelte'
	import { pushState } from '$app/navigation'
	import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { partyStore } from '$lib/stores/partyStore.svelte'

	// TanStack Query mutations - Grid
	import {
		useCreateGridWeapon,
		useCreateGridCharacter,
		useCreateGridSummon,
		useDeleteGridWeapon,
		useDeleteGridCharacter,
		useDeleteGridSummon,
		useUpdateGridWeapon,
		useUpdateGridCharacter,
		useUpdateGridSummon,
		useUpdateWeaponUncap,
		useUpdateCharacterUncap,
		useUpdateSummonUncap,
		useSwapWeapons,
		useSwapCharacters,
		useSwapSummons,
		useSyncAllPartyItems
	} from '$lib/api/mutations/grid.mutations'

	// TanStack Query mutations - Party
	import {
		useUpdateParty,
		useDeleteParty,
		useRemixParty,
		useFavoriteParty,
		useUnfavoriteParty
	} from '$lib/api/mutations/party.mutations'

	// TanStack Query mutations - Job
	import {
		useUpdatePartyJob,
		useUpdatePartyJobSkills,
		useRemovePartyJobSkill
	} from '$lib/api/mutations/job.mutations'

	// Utilities
	import { getLocalId } from '$lib/utils/localId'
	import { getEditKey, storeEditKey, computeEditability } from '$lib/utils/editKeys'

	import { createDragDropContext, type DragOperation } from '$lib/composables/drag-drop.svelte'
	import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
	import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
	import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
	import { openSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
	import type { AddItemResult } from '$lib/types/api/search'
	import { GridType } from '$lib/types/enums'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'
	import { openDescriptionPane } from '$lib/features/description/openDescriptionPane.svelte'
	import {
		openPartyEditSidebar,
		type PartyEditValues
	} from '$lib/features/party/openPartyEditSidebar.svelte'
	import PartyInfoGrid from '$lib/components/party/info/PartyInfoGrid.svelte'
	import { DropdownMenu } from 'bits-ui'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import JobSection from '$lib/components/job/JobSection.svelte'
	import { Gender } from '$lib/utils/jobUtils'
	import {
		openJobSelectionSidebar,
		openJobSkillSelectionSidebar
	} from '$lib/features/job/openJobSidebar.svelte'
	import { partyAdapter, type UpdatePartyParams } from '$lib/api/adapters/party.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { transformSkillsToArray } from '$lib/utils/jobSkills'
	import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
	import ConflictDialog from '$lib/components/dialogs/ConflictDialog.svelte'
	import DeleteTeamDialog from '$lib/components/dialogs/DeleteTeamDialog.svelte'
	import type { ConflictData } from '$lib/types/api/conflict'
	import { isConflictResponse, createConflictData } from '$lib/types/api/conflict'

	interface Props {
		party?: Party
		canEdit?: boolean
		authUserId?: string
		initialTab?: GridType
	}

	let { party: initial, canEdit: canEditServer = false, authUserId, initialTab }: Props = $props()

	// Per-route local state using Svelte 5 runes
	const defaultParty: Party = {
		id: 'new',
		shortcode: 'new',
		name: '',
		description: '',
		weapons: [],
		summons: [],
		characters: []
	}

	// Derive party directly from prop - single source of truth from TanStack Query cache
	let party = $derived(
		initial?.id && initial?.id !== 'new' && Array.isArray(initial?.weapons) ? initial : defaultParty
	)

	// Sync party to global store for components outside the party context (like DetailsSidebar)
	$effect(() => {
		partyStore.setParty(party)
	})

	// Clear store on unmount
	onDestroy(() => {
		partyStore.clear()
	})

	// Map URL segment to GridType
	const tabMap: Record<string, GridType> = {
		weapons: GridType.Weapon,
		summons: GridType.Summon,
		characters: GridType.Character
	}

	// Use $state for instant UI updates - initialized from server-provided initialTab
	let activeTab = $state<GridType>(initialTab ?? GridType.Weapon)
	let routerReady = $state(false) // Guards pushState calls until router is initialized

	let loading = $state(false)
	let error = $state<string | null>(null)
	let selectedSlot = $state<number>(0)
	let conflictDialogOpen = $state(false)
	let conflictData = $state<ConflictData | null>(null)

	// TanStack Query mutations - Grid
	const createWeapon = useCreateGridWeapon()
	const createCharacter = useCreateGridCharacter()
	const createSummon = useCreateGridSummon()
	const deleteWeapon = useDeleteGridWeapon()
	const deleteCharacter = useDeleteGridCharacter()
	const deleteSummon = useDeleteGridSummon()
	const updateWeapon = useUpdateGridWeapon()
	const updateCharacter = useUpdateGridCharacter()
	const updateSummon = useUpdateGridSummon()
	const updateWeaponUncap = useUpdateWeaponUncap()
	const updateCharacterUncap = useUpdateCharacterUncap()
	const updateSummonUncap = useUpdateSummonUncap()
	const swapWeapons = useSwapWeapons()
	const swapCharacters = useSwapCharacters()
	const swapSummons = useSwapSummons()
	const syncAllItems = useSyncAllPartyItems()

	// TanStack Query mutations - Party
	const updatePartyMutation = useUpdateParty()
	const deletePartyMutation = useDeleteParty()
	const remixPartyMutation = useRemixParty()
	const favoritePartyMutation = useFavoriteParty()
	const unfavoritePartyMutation = useUnfavoriteParty()

	// TanStack Query mutations - Job
	const updateJobMutation = useUpdatePartyJob()
	const updateJobSkillsMutation = useUpdatePartyJobSkills()
	const removeJobSkillMutation = useRemovePartyJobSkill()

	// Create drag-drop context
	const dragContext = createDragDropContext({
		onLocalUpdate: async (operation) => {
			console.log('📝 Drag operation:', operation)
			await handleDragOperation(operation)
		},
		onValidate: (source, target) => {
			// Type must match
			if (source.type !== target.type) return false

			// Characters: Sequential filling
			if (source.type === 'character' && target.container === 'main-characters') {
				// For now, allow any position (we'll handle sequential filling in the operation)
				return true
			}

			// Weapons: Mainhand not draggable
			if (target.type === 'weapon' && target.position === -1) return false

			// Summons: Main/Friend not draggable
			if (target.type === 'summon' && (target.position === -1 || target.position === 6))
				return false

			return true
		}
	})

	// Handle drag operations
	async function handleDragOperation(operation: DragOperation) {
		if (!canEdit()) return

		const { source, target } = operation

		try {
			loading = true

			if (operation.type === 'swap') {
				// Handle swapping items between positions
				await handleSwap(source, target)
			} else if (operation.type === 'move') {
				// Handle moving to empty position
				await handleMove(source, target)
			}

			// Party will be updated via cache invalidation from mutations
		} catch (err: any) {
			error = err.message || 'Failed to update party'
			console.error('Drag operation failed:', err)
		} finally {
			loading = false
			dragContext.clearQueue()
		}
	}

	async function handleSwap(source: any, target: any): Promise<void> {
		if (!party.id || party.id === 'new') {
			throw new Error('Cannot swap items in unsaved party')
		}

		// Use appropriate swap mutation based on item type
		const swapParams = {
			partyId: party.id,
			partyShortcode: party.shortcode,
			sourceId: source.itemId,
			targetId: target.itemId
		}

		if (source.type === 'weapon') {
			await swapWeapons.mutateAsync(swapParams)
		} else if (source.type === 'character') {
			await swapCharacters.mutateAsync(swapParams)
		} else if (source.type === 'summon') {
			await swapSummons.mutateAsync(swapParams)
		}
	}

	async function handleMove(source: any, target: any): Promise<void> {
		if (!party.id || party.id === 'new') {
			throw new Error('Cannot move items in unsaved party')
		}

		// Move is swap with empty target - use update mutation to change position
		const updateParams = {
			id: source.itemId,
			partyShortcode: party.shortcode,
			updates: { position: target.position }
		}

		if (source.type === 'weapon') {
			await updateWeapon.mutateAsync(updateParams)
		} else if (source.type === 'character') {
			await updateCharacter.mutateAsync(updateParams)
		} else if (source.type === 'summon') {
			await updateSummon.mutateAsync(updateParams)
		}
	}

	// Localized name helper: accepts either an object with { name: { en, ja } }
	// or a direct { en, ja } map, or a plain string.
	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') {
			return maybe.en || maybe.ja || '—'
		}
		return '—'
	}

	// Client-side editability state
	let localId = $state<string>('')
	let editKey = $state<string | undefined>(undefined)

	// Derived editability (combines server and client state)
	let canEdit = $derived(() => {
		if (canEditServer) return true

		// Re-compute on client with localStorage values
		const result = computeEditability(party, authUserId, localId, editKey)
		return result.canEdit
	})

	// Element mapping for theming (used for party element which is numeric)
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Derived elements for character image logic
	const mainWeapon = $derived((party?.weapons ?? []).find((w) => w?.mainhand || w?.position === -1))
	const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
	const partyElement = $derived((party as any)?.element)

	// User's element preference (string) - used for UI theming
	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const userElement = $derived(party.user?.avatar?.element as ElementType | undefined)

	// Check if any items in the party are linked to collection (for sync menu option)
	const hasCollectionLinks = $derived.by(() => {
		const hasLinkedWeapons = (party?.weapons ?? []).some((w) => w?.collectionWeaponId)
		const hasLinkedCharacters = (party?.characters ?? []).some((c) => c?.collectionCharacterId)
		const hasLinkedSummons = (party?.summons ?? []).some((s) => s?.collectionSummonId)
		return hasLinkedWeapons || hasLinkedCharacters || hasLinkedSummons
	})

	// Check if syncing is in progress
	const isSyncingAll = $derived(syncAllItems.isPending)

	function handleTabChange(tab: GridType) {
		activeTab = tab // Instant UI update

		// Update URL without navigation (no load function, instant)
		// Only call pushState after router is initialized to avoid errors during SSR/hydration
		if (routerReady) {
			const basePath = `/teams/${party.shortcode}`
			const newPath = `${basePath}/${tab}s`
			pushState(newPath, {})
		}

		// Update selectedSlot to the first valid empty slot for this tab
		const nextEmpty = findNextEmptySlot(party, tab)
		if (nextEmpty !== SLOT_NOT_FOUND) {
			selectedSlot = nextEmpty
		} else {
			// Fallback: all grid types start at 0
			selectedSlot = 0
		}
	}

	// Party operations
	async function updatePartyDetails(updates: Omit<UpdatePartyParams, 'id' | 'shortcode'>) {
		if (!canEdit()) return

		loading = true
		error = null

		try {
			// Use TanStack Query mutation to update party
			// Note: API expects UUID (id), shortcode is for cache invalidation
			await updatePartyMutation.mutateAsync({
				id: party.id,
				shortcode: party.shortcode,
				...updates
			})
			// Party will be updated via cache invalidation
		} catch (err: any) {
			error = err.message || 'Failed to update party'
		} finally {
			loading = false
		}
	}

	async function toggleFavorite() {
		if (!authUserId) return // Must be logged in to favorite

		loading = true
		error = null

		try {
			if (party.favorited) {
				await unfavoritePartyMutation.mutateAsync(party.shortcode)
			} else {
				await favoritePartyMutation.mutateAsync(party.shortcode)
			}
			// Party will be updated via cache invalidation
		} catch (err: any) {
			error = err.message || 'Failed to update favorite status'
		} finally {
			loading = false
		}
	}

	async function remixParty() {
		loading = true
		error = null

		try {
			const newParty = await remixPartyMutation.mutateAsync(party.shortcode)

			// Navigate to new party
			window.location.href = `/teams/${newParty.shortcode}`
		} catch (err: any) {
			error = err.message || 'Failed to remix party'
		} finally {
			loading = false
		}
	}

	async function syncFromCollection() {
		if (!canEdit() || !hasCollectionLinks) return

		loading = true
		error = null

		try {
			await syncAllItems.mutateAsync({
				partyId: party.id,
				partyShortcode: party.shortcode
			})
			// Party will be updated via cache invalidation
		} catch (err: any) {
			error = err.message || 'Failed to sync from collection'
		} finally {
			loading = false
		}
	}

	let deleteDialogOpen = $state(false)
	let deleting = $state(false)

	function openDescriptionPanel() {
		openDescriptionPane({
			title: party.name || '(untitled party)',
			description: party.description,
			videoUrl: party.videoUrl,
			canEdit: canEdit(),
			partyId: party.id,
			partyShortcode: party.shortcode,
			onSave: async (description) => {
				await updatePartyDetails({ description })
			}
		})
	}

	function openSettingsPanel() {
		if (!canEdit()) return

		const initialValues: PartyEditValues = {
			name: party.name ?? '',
			description: party.description ?? null,
			fullAuto: party.fullAuto ?? false,
			autoGuard: party.autoGuard ?? false,
			autoSummon: party.autoSummon ?? false,
			chargeAttack: party.chargeAttack ?? true,
			clearTime: party.clearTime ?? null,
			buttonCount: party.buttonCount ?? null,
			chainCount: party.chainCount ?? null,
			summonCount: party.summonCount ?? null,
			videoUrl: party.videoUrl ?? null,
			raid: party.raid ?? null,
			raidId: party.raid?.id ?? null
		}

		openPartyEditSidebar({
			initialValues,
			element: userElement,
			onSave: async (values) => {
				await updatePartyDetails({
					name: values.name,
					description: values.description,
					fullAuto: values.fullAuto,
					autoGuard: values.autoGuard,
					autoSummon: values.autoSummon,
					chargeAttack: values.chargeAttack,
					clearTime: values.clearTime,
					buttonCount: values.buttonCount,
					chainCount: values.chainCount,
					summonCount: values.summonCount,
					videoUrl: values.videoUrl,
					raidId: values.raidId
				})
			}
		})
	}

	async function deleteParty() {
		// Only allow deletion if user owns the party
		if (party.user?.id !== authUserId) return

		try {
			deleting = true
			error = null

			// Delete the party using mutation (API expects UUID, cache uses shortcode)
			await deletePartyMutation.mutateAsync({ id: party.id, shortcode: party.shortcode })

			// Navigate to user's own profile page after deletion
			if (party.user?.username) {
				window.location.href = `/${party.user.username}`
			} else {
				// Fallback to /me for logged-in users
				window.location.href = '/me'
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete party'
			deleteDialogOpen = false
		} finally {
			deleting = false
		}
	}

	// Handle job selection
	async function handleSelectJob() {
		if (!canEdit()) return

		openJobSelectionSidebar({
			currentJobId: party.job?.id,
			onSelectJob: async (job) => {
				loading = true
				error = null

				try {
					// Use mutation for proper cache invalidation
					await updateJobMutation.mutateAsync({
						shortcode: party.shortcode,
						jobId: job.id
					})
				} catch (e) {
					error = e instanceof Error ? e.message : 'Failed to update job'
					console.error('Failed to update job:', e)
				} finally {
					loading = false
				}
			}
		})
	}

	// Handle job skill selection
	async function handleSelectJobSkill(slot: number) {
		if (!canEdit()) return

		openJobSkillSelectionSidebar({
			job: party.job,
			currentSkills: party.jobSkills,
			targetSlot: slot,
			onSelectSkill: async (skill) => {
				loading = true
				error = null

				try {
					// Update skills with the new skill in the slot
					const updatedSkills = { ...party.jobSkills }
					updatedSkills[String(slot) as keyof typeof updatedSkills] = skill

					// Convert skills object to array format expected by API
					const skillsArray = transformSkillsToArray(updatedSkills)

					// Use mutation for proper cache invalidation
					await updateJobSkillsMutation.mutateAsync({
						shortcode: party.shortcode,
						skills: skillsArray
					})
				} catch (e: any) {
					error = extractErrorMessage(e, 'Failed to update skill')
					console.error('Failed to update skill:', e)
				} finally {
					loading = false
				}
			},
			onRemoveSkill: async () => {
				loading = true
				error = null

				try {
					// Use remove mutation for proper cache invalidation
					await removeJobSkillMutation.mutateAsync({
						shortcode: party.shortcode,
						slot
					})
				} catch (e: any) {
					error = extractErrorMessage(e, 'Failed to remove skill')
					console.error('Failed to remove skill:', e)
				} finally {
					loading = false
				}
			}
		})
	}

	// Handle removing a skill directly
	async function handleRemoveJobSkill(slot: number) {
		if (!canEdit()) return

		loading = true
		error = null

		try {
			// Use remove mutation for proper cache invalidation
			await removeJobSkillMutation.mutateAsync({
				shortcode: party.shortcode,
				slot
			})
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove skill'
			console.error('Failed to remove skill:', e)
		} finally {
			loading = false
		}
	}

	// Handle adding items from the search sidebar
	async function handleAddItems(items: AddItemResult[]) {
		if (items.length === 0 || !canEdit()) return

		const item = items[0]
		if (!item) return
		loading = true
		error = null

		try {
			// Determine which slot to use
			let targetSlot = selectedSlot

			// Call appropriate create mutation based on current tab
			// Use granblueId (camelCase) as that's what the AddItemResult type uses
			const itemId = item.granblueId
			let result: unknown

			if (activeTab === GridType.Weapon) {
				result = await createWeapon.mutateAsync({
					partyId: party.id,
					weaponId: itemId,
					position: targetSlot,
					mainhand: targetSlot === -1,
					// Link to collection if item was selected from collection
					collectionWeaponId: item.collectionId
				})

				// Check if the result is a conflict response
				if (isConflictResponse(result)) {
					conflictData = createConflictData(result, 'weapon')
					conflictDialogOpen = true
					return
				}
			} else if (activeTab === GridType.Summon) {
				await createSummon.mutateAsync({
					partyId: party.id,
					summonId: itemId,
					position: targetSlot,
					main: targetSlot === -1,
					friend: targetSlot === 6,
					// Link to collection if item was selected from collection
					collectionSummonId: item.collectionId
				})
			} else if (activeTab === GridType.Character) {
				result = await createCharacter.mutateAsync({
					partyId: party.id,
					characterId: itemId,
					position: targetSlot,
					// Link to collection if item was selected from collection
					collectionCharacterId: item.collectionId
				})

				// Check if the result is a conflict response
				if (isConflictResponse(result)) {
					conflictData = createConflictData(result, 'character')
					conflictDialogOpen = true
					return
				}
			}

			// Party will be updated via cache invalidation from the mutation
			// Find next empty slot for continuous adding
			const nextEmptySlot = findNextEmptySlot(party, activeTab)
			if (nextEmptySlot !== SLOT_NOT_FOUND) {
				selectedSlot = nextEmptySlot
			}
			// Note: Sidebar stays open for continuous adding
		} catch (err: any) {
			error = err.message || 'Failed to add item'
		} finally {
			loading = false
		}
	}

	// Client-side initialization
	onMount(() => {
		// Get or create local ID
		localId = getLocalId()

		// Get edit key for this party if it exists
		editKey = getEditKey(party.shortcode) ?? undefined

		// Router is now ready - safe to call pushState
		routerReady = true

		// Handle browser back/forward navigation for tabs
		const handlePopState = () => {
			const path = window.location.pathname
			const match = path.match(/\/teams\/[^/]+\/(\w+)$/)
			const urlTabSlug = match?.[1]
			const newTab = urlTabSlug ? (tabMap[urlTabSlug] ?? GridType.Weapon) : GridType.Weapon
			if (activeTab !== newTab) {
				activeTab = newTab
			}
		}

		window.addEventListener('popstate', handlePopState)
		return () => window.removeEventListener('popstate', handlePopState)
	})

	// Grid service wrapper using TanStack Query mutations
	const clientGridService = {
		async removeWeapon(partyId: string, gridWeaponId: string, _editKey?: string) {
			try {
				await deleteWeapon.mutateAsync({
					id: gridWeaponId,
					partyId,
					partyShortcode: party.shortcode
				})
				// Party will be updated via cache invalidation
			} catch (err) {
				console.error('Failed to remove weapon:', err)
				throw err
			}
		},
		async removeSummon(partyId: string, gridSummonId: string, _editKey?: string) {
			try {
				await deleteSummon.mutateAsync({
					id: gridSummonId,
					partyId,
					partyShortcode: party.shortcode
				})
			} catch (err) {
				console.error('Failed to remove summon:', err)
				throw err
			}
		},
		async removeCharacter(partyId: string, gridCharacterId: string, _editKey?: string) {
			try {
				await deleteCharacter.mutateAsync({
					id: gridCharacterId,
					partyId,
					partyShortcode: party.shortcode
				})
			} catch (err) {
				console.error('Failed to remove character:', err)
				throw err
			}
		},
		async updateWeapon(partyId: string, gridWeaponId: string, updates: any, _editKey?: string) {
			try {
				await updateWeapon.mutateAsync({
					id: gridWeaponId,
					partyShortcode: party.shortcode,
					updates
				})
			} catch (err) {
				console.error('Failed to update weapon:', err)
				throw err
			}
		},
		async updateSummon(partyId: string, gridSummonId: string, updates: any, _editKey?: string) {
			try {
				await updateSummon.mutateAsync({
					id: gridSummonId,
					partyShortcode: party.shortcode,
					updates
				})
			} catch (err) {
				console.error('Failed to update summon:', err)
				throw err
			}
		},
		async updateCharacter(
			partyId: string,
			gridCharacterId: string,
			updates: any,
			_editKey?: string
		) {
			try {
				await updateCharacter.mutateAsync({
					id: gridCharacterId,
					partyShortcode: party.shortcode,
					updates
				})
			} catch (err) {
				console.error('Failed to update character:', err)
				throw err
			}
		},
		async updateCharacterUncap(
			gridCharacterId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await updateCharacterUncap.mutateAsync({
					id: gridCharacterId,
					partyId: party.id,
					partyShortcode: party.shortcode,
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update character uncap:', err)
				throw err
			}
		},
		async updateWeaponUncap(
			gridWeaponId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await updateWeaponUncap.mutateAsync({
					id: gridWeaponId,
					partyId: party.id,
					partyShortcode: party.shortcode,
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update weapon uncap:', err)
				throw err
			}
		},
		async updateSummonUncap(
			gridSummonId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await updateSummonUncap.mutateAsync({
					id: gridSummonId,
					partyId: party.id,
					partyShortcode: party.shortcode,
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update summon uncap:', err)
				throw err
			}
		}
	}

	// Provide services to child components via context
	setContext('party', {
		getParty: () => party,
		canEdit: () => canEdit(),
		getEditKey: () => editKey,
		getSelectedSlot: () => selectedSlot,
		getActiveTab: () => activeTab,
		services: {
			gridService: clientGridService // Uses TanStack Query mutations
		},
		openPicker: (opts: {
			type: 'weapon' | 'summon' | 'character'
			position: number
			item?: any
		}) => {
			if (!canEdit()) return
			selectedSlot = opts.position
			activeTab =
				opts.type === 'weapon'
					? GridType.Weapon
					: opts.type === 'summon'
						? GridType.Summon
						: GridType.Character

			// For mainhand weapons (position -1), restrict to job's proficiencies
			const requiredProficiencies =
				opts.type === 'weapon' && opts.position === -1 && party.job?.proficiency
					? party.job.proficiency.filter(
							(p): p is number => p !== null && p !== undefined && p !== 0
						)
					: undefined

			// Open the search sidebar with the appropriate type
			// Pass authUserId to enable collection mode toggle
			openSearchSidebar({
				type: opts.type,
				onAddItems: handleAddItems,
				canAddMore: true,
				authUserId,
				requiredProficiencies
			})
		}
	})

	// Provide drag-drop context to child components
	setContext('drag-drop', dragContext)
</script>

<div class="page-wrap">
	<div class="track">
		<section class="party-container">
			<PartyInfoGrid
				{party}
				canEdit={canEdit()}
				onOpenDescription={openDescriptionPanel}
				onOpenEdit={openSettingsPanel}
			>
				{#snippet menu()}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="party-actions-trigger" aria-label="Open actions menu">
							<Icon name="ellipsis" size={14} />
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-content" sideOffset={6} align="end">
								{#if canEdit() && hasCollectionLinks}
									<DropdownItem>
										<button onclick={syncFromCollection} disabled={loading || isSyncingAll}>
											{isSyncingAll ? 'Syncing...' : 'Sync from collection'}
										</button>
									</DropdownItem>
									<DropdownMenu.Separator class="dropdown-separator" />
								{/if}

								{#if authUserId}
									<DropdownItem>
										<button onclick={toggleFavorite} disabled={loading}>
											{party.favorited ? 'Remove from favorites' : 'Add to favorites'}
										</button>
									</DropdownItem>
								{/if}

								<DropdownItem>
									<button onclick={remixParty} disabled={loading}>Remix</button>
								</DropdownItem>

								{#if party.user?.id === authUserId}
									<DropdownMenu.Separator class="dropdown-separator" />
									<DropdownItem>
										<button onclick={() => (deleteDialogOpen = true)} disabled={loading}>
											Delete
										</button>
									</DropdownItem>
								{/if}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				{/snippet}
			</PartyInfoGrid>

			<PartySegmentedControl
				selectedTab={activeTab}
				onTabChange={handleTabChange}
				{party}
				class="party-tabs"
			/>

			{#if error}
				<div class="error-message" role="alert">
					{error}
				</div>
			{/if}

			<div class="party-content">
				{#if activeTab === GridType.Weapon}
					<WeaponGrid
						weapons={party.weapons}
						raidExtra={(party as any)?.raid?.group?.extra}
						showGuidebooks={(party as any)?.raid?.group?.guidebooks}
						guidebooks={(party as any)?.guidebooks}
					/>
				{:else if activeTab === GridType.Summon}
					<SummonGrid summons={party.summons} />
				{:else}
					<div class="character-tab-content">
						<JobSection
							job={party.job}
							jobSkills={party.jobSkills}
							accessory={party.accessory}
							canEdit={canEdit()}
							gender={Gender.Gran}
							element={mainWeaponElement}
							onSelectJob={handleSelectJob}
							onSelectSkill={handleSelectJobSkill}
							onRemoveSkill={handleRemoveJobSkill}
							onSelectAccessory={() => {
								// TODO: Open accessory selection sidebar
								console.log('Open accessory selection sidebar')
							}}
						/>
						<CharacterGrid
							characters={party.characters}
							{mainWeaponElement}
							{partyElement}
							unlimited={(party as any)?.raid?.group?.unlimited}
						/>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<DeleteTeamDialog
	bind:open={deleteDialogOpen}
	partyName={party.name || 'Untitled'}
	{deleting}
	onDelete={deleteParty}
	onCancel={() => (deleteDialogOpen = false)}
/>

<!-- Conflict Resolution Dialog -->
<ConflictDialog
	bind:open={conflictDialogOpen}
	conflict={conflictData}
	partyId={party.id}
	partyShortcode={party.shortcode}
	onResolve={() => {
		conflictData = null
		// Find next empty slot after conflict resolution
		const nextEmptySlot = findNextEmptySlot(party, activeTab)
		if (nextEmptySlot !== SLOT_NOT_FOUND) {
			selectedSlot = nextEmptySlot
		}
	}}
	onCancel={() => {
		conflictData = null
	}}
/>

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;

	.page-wrap {
		position: relative;
		--panel-w: 380px;
		// overflow-x: auto; // Disabling thing for overflow
		overflow: visible;
	}

	.track {
		display: flex;
		gap: 0;
		align-items: flex-start;
	}

	.party-container {
		width: 1200px;
		margin: 0 auto;
		gap: $unit-2x;
		display: flex;
		flex-direction: column;
	}

	// Style the dropdown trigger button to match Button ghost small
	:global(.party-actions-trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: $unit;
		border-radius: $input-corner;
		background-color: transparent;
		color: var(--text-secondary);
		border: none;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--button-bg);
			color: var(--text-primary);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}

		&:active {
			background-color: var(--button-subtle-bg-active);
		}
	}

	.error-message {
		padding: $unit-three-quarter;
		background: rgba(209, 58, 58, 0.1); // Using raw value since CSS variables don't work in rgba()
		border: 1px solid rgba(209, 58, 58, 0.3);
		border-radius: $unit-half;
		color: $error;
		margin-bottom: $unit;
		font-size: $font-small;
	}

	.party-content {
		min-height: 400px;
	}

	.character-tab-content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	// Dialog buttons (shared styles)
	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: $unit-three-quarter $unit-2x;
		border-radius: $unit-three-quarter;
		font-weight: $medium;
		cursor: pointer;
		@include smooth-transition($duration-standard, all);

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.btn-primary {
		background: var(--accent-blue);
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: var(--accent-blue-focus);
		}
	}

	.btn-secondary {
		background: var(--card-bg);
		color: var(--text-primary);
		border: 1px solid var(--button-bg);

		&:hover:not(:disabled) {
			background: var(--button-bg-hover);
			border-color: var(--button-bg-hover);
		}
	}

	.btn-danger {
		background: $error;
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: darken($error, 10%);
		}
	}
</style>
