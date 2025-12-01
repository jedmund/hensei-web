<script lang="ts">
	import { onMount, getContext, setContext, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
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
		useSwapSummons
	} from '$lib/api/mutations/grid.mutations'

	// TanStack Query mutations - Party
	import {
		useUpdateParty,
		useDeleteParty,
		useRemixParty,
		useFavoriteParty,
		useUnfavoriteParty
	} from '$lib/api/mutations/party.mutations'

	// Utilities
	import { getLocalId } from '$lib/utils/localId'
	import { getEditKey, storeEditKey, computeEditability } from '$lib/utils/editKeys'

	import { createDragDropContext, type DragOperation } from '$lib/composables/drag-drop.svelte'
	import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
	import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
	import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
	import { openSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
	import type { SearchResult } from '$lib/api/adapters'
	import { GridType } from '$lib/types/enums'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'
	import { openDescriptionSidebar } from '$lib/features/description/openDescriptionSidebar.svelte'
	import { DropdownMenu } from 'bits-ui'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import JobSection from '$lib/components/job/JobSection.svelte'
	import { Gender } from '$lib/utils/jobUtils'
	import { openJobSelectionSidebar, openJobSkillSelectionSidebar } from '$lib/features/job/openJobSidebar.svelte'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { transformSkillsToArray } from '$lib/utils/jobSkills'
	import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
	import ConflictDialog from '$lib/components/dialogs/ConflictDialog.svelte'
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

	// Derive activeTab from URL params (single source of truth)
	// This ensures back/forward navigation works correctly
	// Falls back to initialTab prop for SSR hydration
	let activeTab = $derived.by(() => {
		const urlTab = page.params.tab as string | undefined
		if (urlTab) {
			return tabMap[urlTab] ?? GridType.Weapon
		}
		// Use initialTab for SSR or when no tab in URL
		return initialTab ?? GridType.Weapon
	})

	let loading = $state(false)
	let error = $state<string | null>(null)
	let selectedSlot = $state<number>(0)
	let editDialogOpen = $state(false)
	let editingTitle = $state('')
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

	// TanStack Query mutations - Party
	const updatePartyMutation = useUpdateParty()
	const deletePartyMutation = useDeleteParty()
	const remixPartyMutation = useRemixParty()
	const favoritePartyMutation = useFavoriteParty()
	const unfavoritePartyMutation = useUnfavoriteParty()

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

	// Derived elements for character image logic
	const mainWeapon = $derived(
		(party?.weapons ?? []).find((w) => w?.mainhand || w?.position === -1)
	)
	const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
	const partyElement = $derived((party as any)?.element)

	function handleTabChange(tab: GridType) {
		// Update URL (adds to browser history)
		// activeTab is derived from URL params, so it will update automatically
		const basePath = `/teams/${party.shortcode}`
		const newPath = tab === GridType.Weapon ? basePath : `${basePath}/${tab}s`
		goto(newPath, { noScroll: true, keepFocus: true })

		// Update selectedSlot to the first valid empty slot for this tab
		const nextEmpty = findNextEmptySlot(party, tab)
		if (nextEmpty !== SLOT_NOT_FOUND) {
			selectedSlot = nextEmpty
		} else {
			// Fallback: all grid types start at 0
			selectedSlot = 0
		}
	}

	// Edit dialog functions
	function openEditDialog() {
		if (!canEdit()) return
		editingTitle = party.name || ''
		editDialogOpen = true
	}

	async function savePartyTitle() {
		if (!canEdit()) return

		try {
			loading = true
			error = null

			// Update party title via API
			await updatePartyDetails({ name: editingTitle })
			editDialogOpen = false
		} catch (err: any) {
			error = err.message || 'Failed to update party title'
		} finally {
			loading = false
		}
	}

	// Party operations
	async function updatePartyDetails(updates: Partial<Party>) {
		if (!canEdit()) return

		loading = true
		error = null

		try {
			// Use TanStack Query mutation to update party
			await updatePartyMutation.mutateAsync({ shortcode: party.shortcode, ...updates })
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

	let deleteDialogOpen = $state(false)
	let deleting = $state(false)

	function openDescriptionPanel() {
		openDescriptionSidebar({
			title: party.name || '(untitled party)',
			description: party.description,
			canEdit: canEdit(),
			onEdit: openEditDialog
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
					// Update job via API (use shortcode for party identification)
					await partyAdapter.updateJob(party.shortcode, job.id)
					// Party will be updated via cache invalidation
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

					console.log('[Party] Current jobSkills:', party.jobSkills)
					console.log('[Party] Updated jobSkills object:', updatedSkills)
					console.log('[Party] Slot being updated:', slot)
					console.log('[Party] New skill:', skill)

					// Convert skills object to array format expected by API
					const skillsArray = transformSkillsToArray(updatedSkills)

					console.log('[Party] Skills array to send:', skillsArray)

					await partyAdapter.updateJobSkills(party.shortcode, skillsArray)
					// Party will be updated via cache invalidation
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
					// Remove skill from slot
					const updatedSkills = { ...party.jobSkills }
					delete updatedSkills[String(slot) as keyof typeof updatedSkills]

					console.log('[Party] Removing skill from slot:', slot)
					console.log('[Party] Current jobSkills:', party.jobSkills)
					console.log('[Party] Updated jobSkills after removal:', updatedSkills)

					// Convert skills object to array format expected by API
					const skillsArray = transformSkillsToArray(updatedSkills)

					console.log('[Party] Skills array to send after removal:', skillsArray)

					await partyAdapter.updateJobSkills(party.shortcode, skillsArray)
					// Party will be updated via cache invalidation
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
			// Remove skill from slot
			const updatedSkills = { ...party.jobSkills }
			delete updatedSkills[String(slot) as keyof typeof updatedSkills]

			// Convert skills object to array format expected by API
			const skillsArray = transformSkillsToArray(updatedSkills)

			await partyAdapter.updateJobSkills(party.shortcode, skillsArray)
			// Party will be updated via cache invalidation
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove skill'
			console.error('Failed to remove skill:', e)
		} finally {
			loading = false
		}
	}

	// Handle adding items from the search sidebar
	async function handleAddItems(items: SearchResult[]) {
		if (items.length === 0 || !canEdit()) return

		const item = items[0]
		if (!item) return
		loading = true
		error = null

		try {
			// Determine which slot to use
			let targetSlot = selectedSlot

			// Call appropriate create mutation based on current tab
			// Use granblueId (camelCase) as that's what the SearchResult type uses
			const itemId = item.granblueId
			let result: unknown

			if (activeTab === GridType.Weapon) {
				result = await createWeapon.mutateAsync({
					partyId: party.id,
					weaponId: itemId,
					position: targetSlot,
					mainhand: targetSlot === -1
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
					friend: targetSlot === 6
				})
			} else if (activeTab === GridType.Character) {
				result = await createCharacter.mutateAsync({
					partyId: party.id,
					characterId: itemId,
					position: targetSlot
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

		// No longer need to verify party data integrity after hydration
		// since $state.raw prevents the hydration mismatch
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
			try {
				await updateCharacterUncap.mutateAsync({
					id: gridCharacterId,
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
			try {
				await updateWeaponUncap.mutateAsync({
					id: gridWeaponId,
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
			try {
				await updateSummonUncap.mutateAsync({
					id: gridSummonId,
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

			// Open the search sidebar with the appropriate type
			openSearchSidebar({
				type: opts.type,
				onAddItems: handleAddItems,
				canAddMore: true
			})
		}
	})

	// Provide drag-drop context to child components
	setContext('drag-drop', dragContext)
</script>

<div class="page-wrap">
	<div class="track">
		<section class="party-container">
			<header class="party-header">
				<div class="party-info">
					<h1>{party.name || '(untitled party)'}</h1>
					{#if party.user}
						{@const avatarFile = party.user.avatar?.picture || ''}
						{@const ensurePng = (name: string) => (/\.png$/i.test(name) ? name : `${name}.png`)}
						{@const to2x = (name: string) =>
							/\.png$/i.test(name) ? name.replace(/\.png$/i, '@2x.png') : `${name}@2x.png`}
						{@const avatarSrc = avatarFile ? `/profile/${ensurePng(avatarFile)}` : ''}
						{@const avatarSrcSet = avatarFile
							? `${avatarSrc} 1x, /profile/${to2x(avatarFile)} 2x`
							: ''}
						<div class="creator">
							<a href="/{party.user.username}" class="creator-link">
								<div class="avatar-wrapper {party.user.avatar?.element || ''}">
									{#if party.user.avatar?.picture}
										<img
											class="avatar"
											alt={`Avatar of ${party.user.username}`}
											src={avatarSrc}
											srcset={avatarSrcSet}
											width="32"
											height="32"
										/>
									{:else}
										<div class="avatar-placeholder" aria-hidden="true"></div>
									{/if}
								</div>
								<span class="username">{party.user.username}</span>
							</a>
						</div>
					{/if}
				</div>

				<div class="party-actions">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="party-actions-trigger" aria-label="Open actions menu">
							<Icon name="ellipsis" size={16} />
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-content" sideOffset={6} align="end">
								{#if canEdit()}
									<DropdownItem>
										<button onclick={openEditDialog} disabled={loading}>Edit</button>
									</DropdownItem>
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
				</div>
			</header>

			{#if party.description || party.raid}
				<div class="cards">
					{#if party.description}
						<div
							class="description-card clickable"
							onclick={openDescriptionPanel}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && openDescriptionPanel()}
							aria-label="View full description"
						>
							<h2 class="card-label">Description</h2>
							<div class="card-content">
								<DescriptionRenderer content={party.description} truncate={true} maxLines={4} />
							</div>
						</div>
					{/if}

					{#if party.raid}
						<div class="raid-card">
							<h2 class="card-label">Raid</h2>
							<div class="raid-content">
								<span class="raid-name">
									{typeof party.raid.name === 'string'
										? party.raid.name
										: party.raid.name?.en || party.raid.name?.ja || 'Unknown Raid'}
								</span>
								{#if party.raid.group}
									<span class="raid-difficulty">Difficulty: {party.raid.group.difficulty}</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

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
						/>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<!-- Edit Dialog -->
<Dialog bind:open={editDialogOpen} title="Edit Party Details">
	{#snippet children()}
		<div class="edit-form">
			<label for="party-title">Party Title</label>
			<input
				id="party-title"
				type="text"
				bind:value={editingTitle}
				placeholder="Enter party title..."
				disabled={loading}
			/>
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (editDialogOpen = false)} disabled={loading}>
			Cancel
		</button>
		<button class="btn-primary" onclick={savePartyTitle} disabled={loading || !editingTitle.trim()}>
			{loading ? 'Saving...' : 'Save'}
		</button>
	{/snippet}
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen} title="Delete Party">
	{#snippet children()}
		<div class="delete-confirmation">
			<p>Are you sure you want to delete this party?</p>
			<p><strong>{party.name || 'Unnamed Party'}</strong></p>
			<p class="warning">⚠️ This action cannot be undone.</p>
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (deleteDialogOpen = false)} disabled={deleting}>
			Cancel
		</button>
		<button class="btn-danger" onclick={deleteParty} disabled={deleting}>
			{deleting ? 'Deleting...' : 'Delete Party'}
		</button>
	{/snippet}
</Dialog>

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
		overflow-x: auto;
	}

	.track {
		display: flex;
		gap: 0;
		align-items: flex-start;
	}

	.party-container {
		width: 1200px;
		margin: 0 auto;
		padding: $unit-half;
		gap: $unit-2x;
		display: flex;
		flex-direction: column;
	}

	.party-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		vertical-align: middle;
		align-items: center;
		padding: $unit-2x 0;
	}

	.party-info {
		flex-grow: 1;

		h1 {
			margin: 0 0 $unit-fourth 0;
			font-size: $font-xlarge;
			font-weight: $bold;
			line-height: 1.2;
		}
	}

	.creator {
		margin-top: $unit-half;

		&-link {
			display: inline-flex;
			align-items: center;
			gap: $unit-three-quarter;
			text-decoration: none;
			color: var(--text-tertiary);
			@include smooth-transition($duration-standard, color);

			&:hover {
				color: var(--text-tertiary-hover);

				.avatar-wrapper {
					transform: scale(1.05);
				}
			}
		}
	}

	.avatar-wrapper {
		width: $unit-4x;
		height: $unit-4x;
		border-radius: 50%;
		overflow: hidden;
		background: var(--card-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		@include smooth-transition($duration-zoom, transform);

		&.wind {
			background: var(--wind-bg);
		}

		&.fire {
			background: var(--fire-bg);
		}

		&.water {
			background: var(--water-bg);
		}

		&.earth {
			background: var(--earth-bg);
		}

		&.light {
			background: var(--light-bg);
		}

		&.dark {
			background: var(--dark-bg);
		}

		.avatar {
			width: $unit-4x + $unit-half;
			height: $unit-4x + $unit-half;
			border-radius: 50%;
			object-fit: cover;
		}

		.avatar-placeholder {
			width: $unit-4x + $unit-half;
			height: $unit-4x + $unit-half;
			border-radius: 50%;
			background: var(--placeholder-bg);
		}
	}

	.username {
		font-size: $font-regular;
		font-weight: $medium;
	}

	.party-actions {
		display: flex;
		gap: $unit-half;
	}

	// Style the dropdown trigger button
	:global(.party-actions-trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border-radius: 50%;
		background-color: transparent;
		color: var(--text-secondary);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease, color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--button-subtle-bg-hover);
			color: var(--text-primary);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}

		&:active {
			background-color: var(--button-subtle-bg-active);
		}
	}

	// Cards container
	.cards {
		display: flex;
		gap: $unit-2x;

		// Individual card styles
		.description-card,
		.raid-card {
			flex: 1;
			min-width: 0; // Allow flexbox to shrink items
			background: var(--card-bg);
			border: 0.5px solid var(--button-bg);
			border-radius: $card-corner;
			padding: $unit-2x;
			// box-shadow: $card-elevation;
			text-align: left;

			.card-label {
				margin: 0 0 $unit 0;
				font-size: $font-small;
				font-weight: $bold;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				color: var(--text-secondary);
			}

			.card-text {
				margin: 0;
				color: var(--text-primary);
				font-size: $font-regular;
				line-height: 1.5;

				// Text truncation after 3 lines
				display: -webkit-box;
				-webkit-line-clamp: 3;
				-webkit-box-orient: vertical;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.card-content {
				margin: 0;
				color: var(--text-primary);
			}

			.card-hint {
				display: none;
				margin-top: $unit;
				font-size: $font-small;
				color: var(--accent-blue);
				font-weight: $medium;
			}

			&.clickable {
				cursor: pointer;
				@include smooth-transition($duration-quick, box-shadow);

				&:hover {
					box-shadow: $card-elevation-hover;
				}
			}
		}

		// Specific styling for raid card
		.raid-card {
			flex: 0 0 auto;
			min-width: 250px;

			.raid-content {
				display: flex;
				flex-direction: column;
				gap: $unit-half;
			}

			.raid-name {
				font-weight: $bold;
				color: var(--text-primary);
				font-size: $font-regular;
			}

			.raid-difficulty {
				color: var(--text-secondary);
				font-size: $font-small;
			}
		}

		// Description card takes up more space
		.description-card {
			flex: 2;
			max-width: 600px;
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

	// Edit form styles
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		label {
			font-weight: $medium;
			font-size: $font-small;
			color: var(--text-secondary);
		}

		input {
			padding: $unit-three-quarter;
			border: 1px solid var(--button-bg);
			border-radius: $unit-three-quarter;
			font-size: $font-regular;
			background: var(--input-bg);
			@include smooth-transition($duration-quick, border-color, background);

			&:hover {
				background: var(--input-bg-hover);
			}

			&:focus {
				outline: none;
				border-color: var(--accent-blue);
				box-shadow: 0 0 0 2px rgba(39, 93, 197, 0.1); // Using raw value since CSS variables don't work in rgba()
			}

			&:disabled {
				background: var(--button-bg);
				opacity: 0.7;
				cursor: not-allowed;
			}
		}
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

	// Delete confirmation styles
	.delete-confirmation {
		display: flex;
		flex-direction: column;
		gap: $unit;
		text-align: center;
		padding: $unit 0;

		p {
			margin: 0;
		}

		strong {
			color: var(--text-primary);
			font-size: $font-medium;
		}

		.warning {
			color: $error;
			font-size: $font-small;
			margin-top: $unit-half;
		}
	}
</style>
