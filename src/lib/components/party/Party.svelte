<script lang="ts">
	import { onMount, getContext, setContext } from 'svelte'
	import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { PartyService } from '$lib/services/party.service'
	import { GridService } from '$lib/services/grid.service'
	import { ConflictService } from '$lib/services/conflict.service'
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

	// TanStack Query mutations
	import {
		useUpdateParty,
		useDeleteParty,
		useRemixParty,
		useFavoriteParty,
		useUnfavoriteParty
	} from '$lib/api/mutations/party.mutations'
	import {
		useCreateGridWeapon,
		useUpdateGridWeapon,
		useDeleteGridWeapon,
		useUpdateWeaponUncap,
		useCreateGridCharacter,
		useUpdateGridCharacter,
		useDeleteGridCharacter,
		useUpdateCharacterUncap,
		useCreateGridSummon,
		useUpdateGridSummon,
		useDeleteGridSummon,
		useUpdateSummonUncap,
		useMoveWeapon,
		useMoveCharacter,
		useMoveSummon
	} from '$lib/api/mutations/grid.mutations'
	import {
		useUpdatePartyJob,
		useUpdatePartyJobSkills,
		useRemovePartyJobSkill
	} from '$lib/api/mutations/job.mutations'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'

	interface Props {
		party?: Party
		canEdit?: boolean
		authUserId?: string
	}

	let { party: initial, canEdit: canEditServer = false, authUserId }: Props = $props()

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

	// Initialize party state with proper validation
	let party = $state<Party>(
		initial?.id && initial?.id !== 'new' && Array.isArray(initial?.weapons) ? initial : defaultParty
	)
	let activeTab = $state<GridType>(GridType.Weapon)
	let loading = $state(false)
	let error = $state<string | null>(null)
	let selectedSlot = $state<number>(0)
	let editDialogOpen = $state(false)
	let editingTitle = $state('')

	// Services
	const partyService = new PartyService()
	const gridService = new GridService()
	const conflictService = new ConflictService()

	// TanStack Query mutation hooks
	const updatePartyMutation = useUpdateParty()
	const deletePartyMutation = useDeleteParty()
	const remixPartyMutation = useRemixParty()
	const favoritePartyMutation = useFavoriteParty()
	const unfavoritePartyMutation = useUnfavoriteParty()

	// Grid mutations - weapons
	const createWeaponMutation = useCreateGridWeapon()
	const updateWeaponMutation = useUpdateGridWeapon()
	const deleteWeaponMutation = useDeleteGridWeapon()
	const updateWeaponUncapMutation = useUpdateWeaponUncap()
	const moveWeaponMutation = useMoveWeapon()

	// Grid mutations - characters
	const createCharacterMutation = useCreateGridCharacter()
	const updateCharacterMutation = useUpdateGridCharacter()
	const deleteCharacterMutation = useDeleteGridCharacter()
	const updateCharacterUncapMutation = useUpdateCharacterUncap()
	const moveCharacterMutation = useMoveCharacter()

	// Grid mutations - summons
	const createSummonMutation = useCreateGridSummon()
	const updateSummonMutation = useUpdateGridSummon()
	const deleteSummonMutation = useDeleteGridSummon()
	const updateSummonUncapMutation = useUpdateSummonUncap()
	const moveSummonMutation = useMoveSummon()

	// Job mutations
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
			let updated: Party | null = null

			if (operation.type === 'swap') {
				// Handle swapping items between positions
				updated = await handleSwap(source, target)
			} else if (operation.type === 'move') {
				// Handle moving to empty position
				updated = await handleMove(source, target)
			}

			// Update party with returned data from API
			if (updated) {
				party = updated
			}
		} catch (err: any) {
			error = err.message || 'Failed to update party'
			console.error('Drag operation failed:', err)
		} finally {
			loading = false
			dragContext.clearQueue()
		}
	}

	async function handleSwap(source: any, target: any): Promise<Party> {
		if (!party.id || party.id === 'new') {
			throw new Error('Cannot swap items in unsaved party')
		}

		// Both source and target should have items for swap
		if (!source.itemId || !target.itemId) {
			throw new Error('Invalid swap operation - missing items')
		}

		// Call appropriate grid service method based on type
		if (source.type === 'weapon') {
			await gridService.moveWeapon(party.id, source.itemId, target.position, editKey || undefined, {
				shortcode: party.shortcode
			})
		} else if (source.type === 'character') {
			await gridService.moveCharacter(
				party.id,
				source.itemId,
				target.position,
				editKey || undefined,
				{
					shortcode: party.shortcode
				}
			)
		} else if (source.type === 'summon') {
			await gridService.moveSummon(party.id, source.itemId, target.position, editKey || undefined, {
				shortcode: party.shortcode
			})
		} else {
			throw new Error(`Unknown item type: ${source.type}`)
		}

		// Clear cache and refresh party data
		partyService.clearPartyCache(party.shortcode)
		const updated = await partyService.getByShortcode(party.shortcode)
		return updated

		throw new Error(`Unknown item type: ${source.type}`)
	}

	async function handleMove(source: any, target: any): Promise<Party> {
		if (!party.id || party.id === 'new') {
			throw new Error('Cannot move items in unsaved party')
		}

		// Source should have an item, target should be empty
		if (!source.itemId || target.itemId) {
			throw new Error('Invalid move operation')
		}

		// Call appropriate grid service method based on type
		if (source.type === 'character') {
			await gridService.moveCharacter(
				party.id,
				source.itemId,
				target.position,
				editKey || undefined,
				{ shortcode: party.shortcode }
			)
		} else if (source.type === 'weapon') {
			await gridService.moveWeapon(party.id, source.itemId, target.position, editKey || undefined, {
				shortcode: party.shortcode
			})
		} else if (source.type === 'summon') {
			await gridService.moveSummon(party.id, source.itemId, target.position, editKey || undefined, {
				shortcode: party.shortcode
			})
		} else {
			throw new Error(`Unknown item type: ${source.type}`)
		}

		// Clear cache and refresh party data
		partyService.clearPartyCache(party.shortcode)
		const updated = await partyService.getByShortcode(party.shortcode)
		return updated
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
		const result = partyService.computeEditability(party, authUserId, localId, editKey)
		return result.canEdit
	})

	// Derived elements for character image logic
	const mainWeapon = $derived(
		(party?.weapons ?? []).find((w) => w?.mainhand || w?.position === -1)
	)
	const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
	const partyElement = $derived((party as any)?.element)

	function handleTabChange(tab: GridType) {
		activeTab = tab
	}

	// Edit dialog functions
	function openEditDialog() {
		if (!canEdit()) return
		editingTitle = party.name || ''
		editDialogOpen = true
	}

	async function savePartyTitle() {
		if (!canEdit()) return

		error = null
		const updated = await updatePartyDetails({ name: editingTitle })
		if (updated) {
			editDialogOpen = false
		}
	}

	// Party operations
	async function updatePartyDetails(updates: Partial<Party>): Promise<Party | null> {
		if (!canEdit()) return null

		return new Promise((resolve) => {
			updatePartyMutation.mutate(
				{ shortcode: party.shortcode, ...updates },
				{
					onSuccess: (updated) => {
						party = updated
						resolve(updated)
					},
					onError: (err: any) => {
						error = err.message || 'Failed to update party'
						resolve(null)
					}
				}
			)
		})
	}

	function toggleFavorite() {
		if (!authUserId) return // Must be logged in to favorite

		error = null

		if (party.favorited) {
			unfavoritePartyMutation.mutate(party.shortcode, {
				onSuccess: () => {
					party.favorited = false
				},
				onError: (err: any) => {
					error = err.message || 'Failed to update favorite status'
				}
			})
		} else {
			favoritePartyMutation.mutate(party.shortcode, {
				onSuccess: () => {
					party.favorited = true
				},
				onError: (err: any) => {
					error = err.message || 'Failed to update favorite status'
				}
			})
		}
	}

	function remixParty() {
		error = null

		remixPartyMutation.mutate(party.shortcode, {
			onSuccess: (newParty) => {
				// Navigate to new party
				window.location.href = `/teams/${newParty.shortcode}`
			},
			onError: (err: any) => {
				error = err.message || 'Failed to remix party'
			}
		})
	}

	let deleteDialogOpen = $state(false)

	function openDescriptionPanel() {
		openDescriptionSidebar({
			title: party.name || '(untitled party)',
			description: party.description,
			canEdit: canEdit(),
			onEdit: openEditDialog
		})
	}

	function deleteParty() {
		// Only allow deletion if user owns the party
		if (party.user?.id !== authUserId) return

		error = null

		deletePartyMutation.mutate(party.shortcode, {
			onSuccess: () => {
				// Navigate to user's own profile page after deletion
				if (party.user?.username) {
					window.location.href = `/${party.user.username}`
				} else {
					// Fallback to /me for logged-in users
					window.location.href = '/me'
				}
			},
			onError: (err: any) => {
				error = err.message || 'Failed to delete party'
				deleteDialogOpen = false
			}
		})
	}

	// Handle job selection
	function handleSelectJob() {
		if (!canEdit()) return

		openJobSelectionSidebar({
			currentJobId: party.job?.id,
			onSelectJob: (job) => {
				error = null

				updateJobMutation.mutate(
					{ shortcode: party.shortcode, jobId: job.id },
					{
						onSuccess: (updated) => {
							party = updated
						},
						onError: (e: any) => {
							error = e?.message || 'Failed to update job'
							console.error('Failed to update job:', e)
						}
					}
				)
			}
		})
	}

	// Helper function to extract error message from nested error structure
	function extractErrorMessage(e: any, defaultMessage: string): string {
		let errorDetails = e?.details

		// Navigate through nested details structure
		while (errorDetails?.details) {
			errorDetails = errorDetails.details
		}

		if (errorDetails?.errors) {
			if (errorDetails.errors.message) {
				return errorDetails.errors.message
			} else {
				const errorMessages = Object.entries(errorDetails.errors)
					.map(([_, messages]) => {
						if (Array.isArray(messages)) {
							return messages.join(', ')
						}
						return String(messages)
					})
					.join('; ')
				return errorMessages || e?.message || defaultMessage
			}
		}
		return e?.message || defaultMessage
	}

	// Handle job skill selection
	function handleSelectJobSkill(slot: number) {
		if (!canEdit()) return

		openJobSkillSelectionSidebar({
			job: party.job,
			currentSkills: party.jobSkills,
			targetSlot: slot,
			onSelectSkill: (skill) => {
				error = null

				// Update skills with the new skill in the slot
				const updatedSkills = { ...party.jobSkills }
				updatedSkills[String(slot) as keyof typeof updatedSkills] = skill

				// Convert skills object to array format expected by API
				const skillsArray = Object.entries(updatedSkills)
					.filter(([_, skill]) => skill !== null && skill !== undefined)
					.map(([slotKey, skill]) => ({
						id: skill!.id,
						slot: parseInt(slotKey)
					}))

				updateJobSkillsMutation.mutate(
					{ shortcode: party.shortcode, skills: skillsArray },
					{
						onSuccess: (updated) => {
							party = updated
						},
						onError: (e: any) => {
							error = extractErrorMessage(e, 'Failed to update skill')
							console.error('Failed to update skill:', e)
						}
					}
				)
			},
			onRemoveSkill: () => {
				error = null

				removeJobSkillMutation.mutate(
					{ shortcode: party.shortcode, slot },
					{
						onSuccess: (updated) => {
							party = updated
						},
						onError: (e: any) => {
							error = extractErrorMessage(e, 'Failed to remove skill')
							console.error('Failed to remove skill:', e)
						}
					}
				)
			}
		})
	}

	// Handle removing a skill directly
	function handleRemoveJobSkill(slot: number) {
		if (!canEdit()) return

		error = null

		removeJobSkillMutation.mutate(
			{ shortcode: party.shortcode, slot },
			{
				onSuccess: (updated) => {
					party = updated
				},
				onError: (e: any) => {
					error = extractErrorMessage(e, 'Failed to remove skill')
					console.error('Failed to remove skill:', e)
				}
			}
		)
	}

	// Helper function to find next empty slot after adding an item
	function findNextEmptySlot(updatedParty: Party): number {
		let nextEmptySlot = -999 // sentinel value meaning no empty slot found

		if (activeTab === GridType.Weapon) {
			// Check mainhand first (position -1)
			if (!updatedParty.weapons.find((w) => w.position === -1 || w.mainhand)) {
				nextEmptySlot = -1
			} else {
				// Check grid slots 0-8
				for (let i = 0; i < 9; i++) {
					if (!updatedParty.weapons.find((w) => w.position === i)) {
						nextEmptySlot = i
						break
					}
				}
			}
		} else if (activeTab === GridType.Summon) {
			// Check main summon first (position -1)
			if (!updatedParty.summons.find((s) => s.position === -1 || s.main)) {
				nextEmptySlot = -1
			} else {
				// Check grid slots 0-5
				for (let i = 0; i < 6; i++) {
					if (!updatedParty.summons.find((s) => s.position === i)) {
						nextEmptySlot = i
						break
					}
				}
				// Check friend summon (position 6)
				if (nextEmptySlot === -999 && !updatedParty.summons.find((s) => s.position === 6 || s.friend)) {
					nextEmptySlot = 6
				}
			}
		} else if (activeTab === GridType.Character) {
			// Check character slots 0-4
			for (let i = 0; i < 5; i++) {
				if (!updatedParty.characters.find((c) => c.position === i)) {
					nextEmptySlot = i
					break
				}
			}
		}

		return nextEmptySlot
	}

	// Handle adding items from the search sidebar
	function handleAddItems(items: SearchResult[]) {
		if (items.length === 0 || !canEdit()) return

		const item = items[0]
		if (!item) return
		error = null

		// Determine which slot to use
		const targetSlot = selectedSlot

		// Use granblueId (camelCase) as that's what the SearchResult type uses
		const itemId = item.granblueId

		const handleSuccess = (updated: Party) => {
			party = updated

			// Find next empty slot for continuous adding
			const nextEmptySlot = findNextEmptySlot(updated)

			// If there's another empty slot, update selectedSlot to it
			if (nextEmptySlot !== -999) {
				selectedSlot = nextEmptySlot
			}
			// Note: Sidebar stays open for continuous adding
		}

		const handleError = (err: any) => {
			error = err?.message || 'Failed to add item'
		}

		// Call appropriate mutation based on current tab
		if (activeTab === GridType.Weapon) {
			createWeaponMutation.mutate(
				{
					partyId: party.id,
					weaponId: itemId,
					position: targetSlot,
					mainhand: targetSlot === -1,
					partyShortcode: party.shortcode
				},
				{ onSuccess: handleSuccess, onError: handleError }
			)
		} else if (activeTab === GridType.Summon) {
			createSummonMutation.mutate(
				{
					partyId: party.id,
					summonId: itemId,
					position: targetSlot,
					main: targetSlot === -1,
					friend: targetSlot === 6,
					partyShortcode: party.shortcode
				},
				{ onSuccess: handleSuccess, onError: handleError }
			)
		} else if (activeTab === GridType.Character) {
			createCharacterMutation.mutate(
				{
					partyId: party.id,
					characterId: itemId,
					position: targetSlot,
					partyShortcode: party.shortcode
				},
				{ onSuccess: handleSuccess, onError: handleError }
			)
		}
	}

	// Client-side initialization
	onMount(() => {
		// Get or create local ID
		localId = partyService.getLocalId()

		// Get edit key for this party if it exists
			editKey = partyService.getEditKey(party.shortcode) ?? undefined

		// No longer need to verify party data integrity after hydration
		// since $state.raw prevents the hydration mismatch
	})

	// Create client-side wrappers for grid operations using mutations
	// These return promises that resolve when the mutation completes
	const clientGridService = {
		removeWeapon(partyId: string, gridWeaponId: string, _editKey?: string): Promise<Party> {
			return new Promise((resolve, reject) => {
				deleteWeaponMutation.mutate(
					{ id: gridWeaponId, partyId, partyShortcode: party.shortcode },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to remove weapon:', err)
							reject(err)
						}
					}
				)
			})
		},
		removeSummon(partyId: string, gridSummonId: string, _editKey?: string): Promise<Party> {
			return new Promise((resolve, reject) => {
				deleteSummonMutation.mutate(
					{ id: gridSummonId, partyId, partyShortcode: party.shortcode },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to remove summon:', err)
							reject(err)
						}
					}
				)
			})
		},
		removeCharacter(partyId: string, gridCharacterId: string, _editKey?: string): Promise<Party> {
			return new Promise((resolve, reject) => {
				deleteCharacterMutation.mutate(
					{ id: gridCharacterId, partyId, partyShortcode: party.shortcode },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to remove character:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateWeapon(partyId: string, gridWeaponId: string, updates: any, _editKey?: string): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateWeaponMutation.mutate(
					{ id: gridWeaponId, partyShortcode: party.shortcode, updates },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to update weapon:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateSummon(partyId: string, gridSummonId: string, updates: any, _editKey?: string): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateSummonMutation.mutate(
					{ id: gridSummonId, partyShortcode: party.shortcode, updates },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to update summon:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateCharacter(
			partyId: string,
			gridCharacterId: string,
			updates: any,
			_editKey?: string
		): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateCharacterMutation.mutate(
					{ id: gridCharacterId, partyShortcode: party.shortcode, updates },
					{
						onSuccess: (updated) => {
							party = updated
							resolve(updated)
						},
						onError: (err) => {
							console.error('Failed to update character:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateCharacterUncap(
			gridCharacterId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateCharacterUncapMutation.mutate(
					{
						partyId: party.id,
						id: gridCharacterId,
						uncapLevel: uncapLevel ?? 0,
						transcendenceStep,
						partyShortcode: party.shortcode
					},
					{
						onSuccess: (response) => {
							// The API returns {gridCharacter: {...}} with the updated item only
							// We need to update just that character in the current party state
							if (response.gridCharacter || response.grid_character) {
								const updatedChar = response.gridCharacter || response.grid_character
								const updatedParty = { ...party }
								if (updatedParty.characters) {
									const charIndex = updatedParty.characters.findIndex(
										(c: any) => c.id === gridCharacterId
									)
									if (charIndex !== -1) {
										const existingChar = updatedParty.characters[charIndex]
										if (existingChar) {
											updatedParty.characters[charIndex] = {
												...existingChar,
												id: existingChar.id,
												position: existingChar.position,
												character: existingChar.character,
												uncapLevel: updatedChar.uncapLevel ?? updatedChar.uncap_level,
												transcendenceStep: updatedChar.transcendenceStep ?? updatedChar.transcendence_step
											}
										}
										party = updatedParty
										resolve(updatedParty)
										return
									}
								}
							}
							resolve(party)
						},
						onError: (err) => {
							console.error('Failed to update character uncap:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateWeaponUncap(
			gridWeaponId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateWeaponUncapMutation.mutate(
					{
						partyId: party.id,
						id: gridWeaponId,
						uncapLevel: uncapLevel ?? 0,
						transcendenceStep,
						partyShortcode: party.shortcode
					},
					{
						onSuccess: (response) => {
							// The API returns {gridWeapon: {...}} with the updated item only
							// We need to update just that weapon in the current party state
							if (response.gridWeapon || response.grid_weapon) {
								const updatedWeapon = response.gridWeapon || response.grid_weapon
								const updatedParty = { ...party }
								if (updatedParty.weapons) {
									const weaponIndex = updatedParty.weapons.findIndex((w: any) => w.id === gridWeaponId)
									if (weaponIndex !== -1) {
										const existingWeapon = updatedParty.weapons[weaponIndex]
										if (existingWeapon) {
											updatedParty.weapons[weaponIndex] = {
												...existingWeapon,
												id: existingWeapon.id,
												position: existingWeapon.position,
												weapon: existingWeapon.weapon,
												uncapLevel: updatedWeapon.uncapLevel ?? updatedWeapon.uncap_level,
												transcendenceStep:
													updatedWeapon.transcendenceStep ?? updatedWeapon.transcendence_step
											}
										}
										party = updatedParty
										resolve(updatedParty)
										return
									}
								}
							}
							resolve(party)
						},
						onError: (err) => {
							console.error('Failed to update weapon uncap:', err)
							reject(err)
						}
					}
				)
			})
		},
		updateSummonUncap(
			gridSummonId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		): Promise<Party> {
			return new Promise((resolve, reject) => {
				updateSummonUncapMutation.mutate(
					{
						partyId: party.id,
						id: gridSummonId,
						uncapLevel: uncapLevel ?? 0,
						transcendenceStep,
						partyShortcode: party.shortcode
					},
					{
						onSuccess: (response) => {
							// The API returns {gridSummon: {...}} with the updated item only
							// We need to update just that summon in the current party state
							if (response.gridSummon || response.grid_summon) {
								const updatedSummon = response.gridSummon || response.grid_summon
								const updatedParty = { ...party }
								if (updatedParty.summons) {
									const summonIndex = updatedParty.summons.findIndex((s: any) => s.id === gridSummonId)
									if (summonIndex !== -1) {
										const existingSummon = updatedParty.summons[summonIndex]
										if (existingSummon) {
											updatedParty.summons[summonIndex] = {
												...existingSummon,
												id: existingSummon.id,
												position: existingSummon.position,
												summon: existingSummon.summon,
												uncapLevel: updatedSummon.uncapLevel ?? updatedSummon.uncap_level,
												transcendenceStep:
													updatedSummon.transcendenceStep ?? updatedSummon.transcendence_step
											}
										}
										party = updatedParty
										resolve(updatedParty)
										return
									}
								}
							}
							resolve(party)
						},
						onError: (err) => {
							console.error('Failed to update summon uncap:', err)
							reject(err)
						}
					}
				)
			})
		}
	}

	// Provide services to child components via context
	setContext('party', {
		getParty: () => party,
		updateParty: (p: Party) => (party = p),
		canEdit: () => canEdit(),
		getEditKey: () => editKey,
		services: {
			partyService,
			gridService: clientGridService, // Use client-side wrapper
			conflictService
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
							job={party.job}
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
