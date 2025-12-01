<svelte:options runes={true} />

<script lang="ts">
  import type { PageData } from './$types'
  import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
  import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
  import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
  import JobSection from '$lib/components/job/JobSection.svelte'
  import { openSearchSidebar, closeSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
  import { openJobSelectionSidebar, openJobSkillSelectionSidebar } from '$lib/features/job/openJobSidebar.svelte'
  import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
  import { GridType } from '$lib/types/enums'
  import { Gender } from '$lib/utils/jobUtils'
  import { partyAdapter } from '$lib/api/adapters/party.adapter'
  import { transformSkillsToArray } from '$lib/utils/jobSkills'
  import { setContext } from 'svelte'
  import type { SearchResult } from '$lib/api/adapters'
  import { gridAdapter } from '$lib/api/adapters'
  import { getLocalId } from '$lib/utils/localId'
  import { storeEditKey } from '$lib/utils/editKeys'
  import type { Party } from '$lib/types/api/party'

  // TanStack Query
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import { partyKeys } from '$lib/api/queries/party.queries'

  // TanStack Query mutations
  import { useCreateParty } from '$lib/api/mutations/party.mutations'
  import {
    useCreateGridWeapon,
    useCreateGridCharacter,
    useCreateGridSummon,
    useDeleteGridWeapon,
    useDeleteGridCharacter,
    useDeleteGridSummon
  } from '$lib/api/mutations/grid.mutations'
  import { Dialog } from 'bits-ui'
  import { replaceState } from '$app/navigation'

  // Props
  interface Props {
    data: PageData
  }

  let { data }: Props = $props()

  // Get authentication status from data prop (no store subscription!)
  let isAuthenticated = $derived(data.isAuthenticated)
  let currentUser = $derived(data.currentUser)

  // Local, client-only state for tab selection (Svelte 5 runes)
  let activeTab = $state<GridType>(GridType.Weapon)

  // Open search sidebar on mount
  let hasOpenedSidebar = $state(false)
  $effect(() => {
    if (!hasOpenedSidebar) {
      hasOpenedSidebar = true
      // Set initial selected slot to mainhand weapon
      selectedSlot = -1
      // Small delay to let the page render first
      setTimeout(() => {
        openSearchSidebar({
          type: 'weapon',
          onAddItems: handleAddItems,
          canAddMore: true
        })
      }, 100)
    }
  })

  function selectTab(gridType: GridType) {
    activeTab = gridType

    // Set selectedSlot to first valid empty slot for this tab
    if (gridType === GridType.Character) {
      // Find first empty character slot
      const emptySlot = [0, 1, 2, 3, 4].find(i => !characters.find(c => c.position === i))
      selectedSlot = emptySlot ?? 0
    } else if (gridType === GridType.Weapon) {
      // Find first empty weapon slot (mainhand first, then grid)
      const emptySlot = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].find(i =>
        !weapons.find(w => w.position === i || (i === -1 && w.mainhand))
      )
      selectedSlot = emptySlot ?? -1
    } else {
      // Find first empty summon slot (main, grid, friend)
      const emptySlot = [-1, 0, 1, 2, 3, 6].find(i =>
        !summons.find(s => s.position === i || (i === -1 && s.main) || (i === 6 && s.friend))
      )
      selectedSlot = emptySlot ?? -1
    }

    // Open sidebar when switching tabs
    openSearchSidebar({
      type: gridType === GridType.Weapon ? 'weapon' :
            gridType === GridType.Summon ? 'summon' :
            'character',
      onAddItems: handleAddItems,
      canAddMore: !isGridFull(gridType)
    })
  }

  // Helper to check if a grid is full
  function isGridFull(gridType: GridType): boolean {
    if (gridType === GridType.Weapon) return weapons.length >= 10
    if (gridType === GridType.Summon) return summons.length >= 6
    return characters.length >= 5
  }

  // Job selection handlers
  async function handleSelectJob() {
    openJobSelectionSidebar({
      currentJobId: party.job?.id,
      onSelectJob: async (job) => {
        // If party exists, update via API
        if (partyId && shortcode) {
          try {
            await partyAdapter.updateJob(shortcode, job.id)
            // Cache will be updated via invalidation
          } catch (e) {
            console.error('Failed to update job:', e)
            errorMessage = e instanceof Error ? e.message : 'Failed to update job'
            errorDialogOpen = true
          }
        } else {
          // Update cache locally for new party
          queryClient.setQueryData(partyKeys.detail('new'), (old: Party | undefined) => {
            if (!old) return placeholderParty
            return { ...old, job }
          })
        }
      }
    })
  }

  async function handleSelectJobSkill(slot: number) {
    openJobSkillSelectionSidebar({
      job: party.job,
      currentSkills: party.jobSkills,
      targetSlot: slot,
      onSelectSkill: async (skill) => {
        // If party exists, update via API
        if (partyId && shortcode) {
          try {
            const updatedSkills = { ...party.jobSkills }
            updatedSkills[String(slot) as keyof typeof updatedSkills] = skill
            const skillsArray = transformSkillsToArray(updatedSkills)
            await partyAdapter.updateJobSkills(shortcode, skillsArray)
          } catch (e) {
            console.error('Failed to update skill:', e)
            errorMessage = e instanceof Error ? e.message : 'Failed to update skill'
            errorDialogOpen = true
          }
        } else {
          // Update cache locally for new party
          queryClient.setQueryData(partyKeys.detail('new'), (old: Party | undefined) => {
            if (!old) return placeholderParty
            const updatedSkills = { ...old.jobSkills }
            updatedSkills[String(slot) as keyof typeof updatedSkills] = skill
            return { ...old, jobSkills: updatedSkills }
          })
        }
      },
      onRemoveSkill: async () => {
        await handleRemoveJobSkill(slot)
      }
    })
  }

  async function handleRemoveJobSkill(slot: number) {
    if (partyId && shortcode) {
      try {
        const updatedSkills = { ...party.jobSkills }
        delete updatedSkills[String(slot) as keyof typeof updatedSkills]
        const skillsArray = transformSkillsToArray(updatedSkills)
        await partyAdapter.updateJobSkills(shortcode, skillsArray)
      } catch (e) {
        console.error('Failed to remove skill:', e)
        errorMessage = e instanceof Error ? e.message : 'Failed to remove skill'
        errorDialogOpen = true
      }
    } else {
      // Update cache locally for new party
      queryClient.setQueryData(partyKeys.detail('new'), (old: Party | undefined) => {
        if (!old) return placeholderParty
        const updatedSkills = { ...old.jobSkills }
        delete updatedSkills[String(slot) as keyof typeof updatedSkills]
        return { ...old, jobSkills: updatedSkills }
      })
    }
  }

  // Party state
  let partyId = $state<string | null>(null)
  let shortcode = $state<string | null>(null)
  let editKey = $state<string | null>(null)
  let isCreatingParty = $state(false)

  // Placeholder party for 'new' route
  const placeholderParty: Party = {
    id: 'new',
    shortcode: 'new',
    name: 'New Team',
    description: '',
    weapons: [],
    summons: [],
    characters: [],
    element: 0,
    visibility: 1,
    job: undefined,
    jobSkills: undefined,
    accessory: undefined
  }

  // Create query with placeholder data
  const queryClient = useQueryClient()
  const partyQuery = createQuery(() => ({
    ...partyQueries.byShortcode(shortcode || 'new'),
    initialData: placeholderParty,
    enabled: false // Disable automatic fetching for 'new' party
  }))

  // Derive state from query
  const party = $derived(partyQuery.data ?? placeholderParty)
  const weapons = $derived(party.weapons ?? [])
  const summons = $derived(party.summons ?? [])
  const characters = $derived(party.characters ?? [])

  // Derived values for job section
  const mainWeapon = $derived(weapons.find((w) => w?.mainhand || w?.position === -1))
  const mainWeaponElement = $derived(mainWeapon?.element ?? mainWeapon?.weapon?.element)
  const partyElement = $derived((party as any)?.element)

  let selectedSlot = $state<number | null>(null)
  let isFirstItemForSlot = false // Track if this is the first item after clicking empty cell

  // Error dialog state
  let errorDialogOpen = $state(false)
  let errorMessage = $state('')
  let errorDetails = $state<string[]>([])

  // TanStack Query mutations
  const createPartyMutation = useCreateParty()
  const createWeaponMutation = useCreateGridWeapon()
  const createCharacterMutation = useCreateGridCharacter()
  const createSummonMutation = useCreateGridSummon()
  const deleteWeapon = useDeleteGridWeapon()
  const deleteCharacter = useDeleteGridCharacter()
  const deleteSummon = useDeleteGridSummon()

  // Helper to add item to cache
  function addItemToCache(itemType: 'weapons' | 'summons' | 'characters', item: any) {
    const cacheKey = partyKeys.detail(shortcode || 'new')

    queryClient.setQueryData(cacheKey, (old: Party | undefined) => {
      if (!old) return placeholderParty
      return {
        ...old,
        [itemType]: [...(old[itemType] ?? []), item]
      }
    })
  }

  // Calculate if grids are full
  let isWeaponGridFull = $derived(weapons.length >= 10) // 1 mainhand + 9 grid slots
  let isSummonGridFull = $derived(summons.length >= 6) // 6 summon slots (main + 4 grid + friend)
  let isCharacterGridFull = $derived(characters.length >= 5) // 5 character slots

  let canAddMore = $derived(
    activeTab === GridType.Weapon ? !isWeaponGridFull :
    activeTab === GridType.Summon ? !isSummonGridFull :
    !isCharacterGridFull
  )

  // Handle adding items from search
  async function handleAddItems(items: SearchResult[]) {
    console.log('Adding items:', items, 'to tab:', activeTab)

    // Create party on first item if not already created
    if (!partyId && !isCreatingParty && items.length > 0) {
      isCreatingParty = true
      const firstItem = items[0]
      
      // Guard against undefined firstItem (shouldn't happen given items.length > 0 check, but TypeScript needs this)
      if (!firstItem) {
        isCreatingParty = false
        return
      }

      try {
        // Step 1: Create the party (with local_id only for anonymous users)
        const partyPayload: any = {
          name: 'New Team',
          visibility: 1, // 1 = Public, 2 = Unlisted, 3 = Private
          element: firstItem.element || 0 // Use item's element or default to null
        }

        // Only include localId for anonymous users
        if (!isAuthenticated) {
          partyPayload.localId = getLocalId()
        }

        // Create party using mutation
        const createdParty = await createPartyMutation.mutateAsync(partyPayload)
        console.log('Party created:', createdParty)

        // The adapter returns the party directly
        partyId = createdParty.id
        shortcode = createdParty.shortcode

        // Store edit key for anonymous editing under BOTH identifiers
        // - shortcode: for Party.svelte which uses shortcode as partyId
        // - UUID: for /teams/new which uses UUID as partyId
        if (createdParty.editKey) {
          storeEditKey(createdParty.shortcode, createdParty.editKey)
          storeEditKey(createdParty.id, createdParty.editKey)
        }

        if (!partyId || !shortcode) {
          throw new Error('Party creation did not return ID or shortcode')
        }

        // Update the query cache with the created party
        queryClient.setQueryData(
          partyKeys.detail(createdParty.shortcode),
          createdParty
        )

        // Step 2: Add the first item to the party
        let position = selectedSlot !== null ? selectedSlot : -1 // Use selectedSlot if available
        let itemAdded = false
        try {
          console.log('Adding item to party:', { partyId, itemId: firstItem.id, type: activeTab, position })

          if (activeTab === GridType.Weapon) {
            // Use selectedSlot if available, otherwise default to mainhand
            if (selectedSlot === null) position = -1
            const addResult = await createWeaponMutation.mutateAsync({
              partyId,
              weaponId: firstItem.granblueId,
              position,
              mainhand: position === -1
            })
            console.log('Weapon added:', addResult)
            itemAdded = true

            // Update cache with the added weapon
            addItemToCache('weapons', addResult)
          } else if (activeTab === GridType.Summon) {
            // Use selectedSlot if available, otherwise default to main summon
            if (selectedSlot === null) position = -1
            const addResult = await createSummonMutation.mutateAsync({
              partyId,
              summonId: firstItem.granblueId,
              position,
              main: position === -1,
              friend: position === 6
            })
            console.log('Summon added:', addResult)
            itemAdded = true

            // Update cache with the added summon
            addItemToCache('summons', addResult)
          } else if (activeTab === GridType.Character) {
            // Use selectedSlot if available, otherwise default to first slot
            if (selectedSlot === null) position = 0
            const addResult = await createCharacterMutation.mutateAsync({
              partyId,
              characterId: firstItem.granblueId,
              position
            })
            console.log('Character added:', addResult)
            itemAdded = true

            // Update cache with the added character
            addItemToCache('characters', addResult)
          }
          selectedSlot = null // Reset after using

          // Update URL without redirecting
          if (itemAdded && shortcode) {
            // Update the URL to reflect the new party without navigating
            replaceState(`/teams/${shortcode}`, {})
            // Continue to allow adding more items
          }
        } catch (addError: any) {
          console.error('Failed to add first item:', addError)
          // Show error to user but don't redirect
          errorMessage = addError.message || 'Failed to add item to party'
          errorDetails = addError.details || []
          errorDialogOpen = true
          // Still update URL to the created party even if item failed
          if (shortcode) {
            replaceState(`/teams/${shortcode}`, {})
          }
        }

        isCreatingParty = false // Reset flag after party creation completes

        // If there are more items to add, continue processing them
        if (items.length > 1) {
          const remainingItems = items.slice(1)
          await handleAddItems(remainingItems) // Recursive call to add remaining items
        }
        return // Exit after processing all items from party creation
      } catch (error: any) {
        console.error('Failed to create party:', error)
        isCreatingParty = false

        // Parse error message
        if (error.message) {
          errorMessage = error.message
        } else {
          errorMessage = 'Failed to create party'
        }

        // Parse validation errors if present
        if (error.details && Array.isArray(error.details)) {
          errorDetails = error.details
        } else if (error.errors && typeof error.errors === 'object') {
          // Rails-style validation errors
          errorDetails = Object.entries(error.errors).map(
            ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          )
        } else {
          errorDetails = []
        }

        errorDialogOpen = true
        return
      }
    }

    // If party already exists, add items using grid API
    if (partyId && !isCreatingParty) {
      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (!item) continue // Skip undefined items
          let position = -1 // Default position

          if (activeTab === GridType.Weapon) {
            // Use selectedSlot for first item if available
            if (i === 0 && selectedSlot !== null && !weapons.find(w => w.position === selectedSlot)) {
              position = selectedSlot
              selectedSlot = null // Reset after using
            } else {
              // Find next empty weapon slot
              const emptySlots = Array.from({ length: 10 }, (_, i) => i - 1)
                .filter(i => !weapons.find(w => w.position === i))
              if (emptySlots.length === 0) return // Grid full
              position = emptySlots[0]!
            }

            // Add weapon via API
            const response = await createWeaponMutation.mutateAsync({
              partyId,
              weaponId: item.granblueId,
              position,
              mainhand: position === -1
            })

            // Add to cache
            addItemToCache('weapons', response)
          } else if (activeTab === GridType.Summon) {
            // Use selectedSlot for first item if available
            if (i === 0 && selectedSlot !== null && !summons.find(s => s.position === selectedSlot)) {
              position = selectedSlot
              selectedSlot = null // Reset after using
            } else {
              // Find next empty summon slot
              const emptySlots = [-1, 0, 1, 2, 3, 6] // main, 4 grid slots, friend
                .filter(i => !summons.find(s => s.position === i))
              if (emptySlots.length === 0) return // Grid full
              position = emptySlots[0]!
            }

            // Add summon via API
            const response = await createSummonMutation.mutateAsync({
              partyId,
              summonId: item.granblueId,
              position,
              main: position === -1,
              friend: position === 6
            })

            // Add to cache
            addItemToCache('summons', response)
          } else if (activeTab === GridType.Character) {
            // Use selectedSlot for first item if available
            if (i === 0 && selectedSlot !== null && !characters.find(c => c.position === selectedSlot)) {
              position = selectedSlot
              selectedSlot = null // Reset after using
            } else {
              // Find next empty character slot
              const emptySlots = Array.from({ length: 5 }, (_, i) => i)
                .filter(i => !characters.find(c => c.position === i))
              if (emptySlots.length === 0) return // Grid full
              position = emptySlots[0]!
            }

            // Add character via API
            const response = await createCharacterMutation.mutateAsync({
              partyId,
              characterId: item.granblueId,
              position
            })

            // Add to cache
            addItemToCache('characters', response)
          }
        }
      } catch (error: any) {
        console.error('Failed to add item:', error)
        errorMessage = error.message || 'Failed to add item'
        errorDetails = error.details || []
        errorDialogOpen = true
      }
      return
    }
  }


  // Provide party context using query data
  setContext('party', {
    getParty: () => party,
    updateParty: (p: Party) => {
      // Update cache instead of local state
      queryClient.setQueryData(partyKeys.detail(shortcode || 'new'), p)
    },
    canEdit: () => true,
    getEditKey: () => editKey,
    getSelectedSlot: () => selectedSlot,
    getActiveTab: () => activeTab,
    services: {
      gridService: {
        removeWeapon: async (partyId: string, itemId: string) => {
          if (!partyId || partyId === 'new') return party
          await deleteWeapon.mutateAsync({
            id: itemId,
            partyId,
            partyShortcode: shortcode || 'new'
          })
          return party
        },
        removeSummon: async (partyId: string, itemId: string) => {
          if (!partyId || partyId === 'new') return party
          await deleteSummon.mutateAsync({
            id: itemId,
            partyId,
            partyShortcode: shortcode || 'new'
          })
          return party
        },
        removeCharacter: async (partyId: string, itemId: string) => {
          if (!partyId || partyId === 'new') return party
          await deleteCharacter.mutateAsync({
            id: itemId,
            partyId,
            partyShortcode: shortcode || 'new'
          })
          return party
        }
      }
    },
    openPicker: (opts: { type: 'weapon' | 'summon' | 'character'; position: number; item?: any }) => {
      selectedSlot = opts.position
      openSearchSidebar({
        type: opts.type,
        onAddItems: handleAddItems,
        canAddMore: !isGridFull(
          opts.type === 'weapon' ? GridType.Weapon :
          opts.type === 'summon' ? GridType.Summon :
          GridType.Character
        )
      })
    }
  })
</script>

<main>
  <div class="page-container">
    <section class="party-content">
      <header class="party-header">
        <div class="party-info">
          <h1>Create a new team</h1>
          <p class="description">Search and click items to add them to your grid</p>
        </div>
      </header>

      <PartySegmentedControl
        selectedTab={activeTab}
        onTabChange={selectTab}
        party={{
          id: '',
          shortcode: '',
          element: 0,
          job: undefined,
          characters,
          weapons,
          summons
        }}
      />

      <div class="party-content">
        {#if activeTab === GridType.Weapon}
          <WeaponGrid {weapons} />
        {:else if activeTab === GridType.Summon}
          <SummonGrid {summons} />
        {:else}
          <div class="character-tab-content">
            <JobSection
              job={party.job}
              jobSkills={party.jobSkills}
              accessory={party.accessory}
              canEdit={true}
              gender={Gender.Gran}
              element={mainWeaponElement}
              onSelectJob={handleSelectJob}
              onSelectSkill={handleSelectJobSkill}
              onRemoveSkill={handleRemoveJobSkill}
              onSelectAccessory={() => {
                console.log('Open accessory selection sidebar')
              }}
            />
            <CharacterGrid
              {characters}
              {mainWeaponElement}
              {partyElement}
            />
          </div>
        {/if}
      </div>
    </section>
  </div>
</main>

<!-- Error Dialog -->
<Dialog.Root bind:open={errorDialogOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title class="dialog-title">Error Creating Team</Dialog.Title>
      <Dialog.Description class="dialog-description">
        {errorMessage}
      </Dialog.Description>

      {#if errorDetails.length > 0}
        <div class="error-details">
          <p class="error-details-title">Details:</p>
          <ul class="error-list">
            {#each errorDetails as detail}
              <li>{detail}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="dialog-actions">
        <Dialog.Close class="dialog-button">
          OK
        </Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  .page-container {
    display: flex;
    gap: 0;
    width: 100%;
    min-height: 100vh;
    /* Use negative margins to counteract main's padding without global CSS */
    margin-top: -81px;
    padding-top: 81px;
    margin-bottom: -20vh;
    padding-bottom: 20vh;
  }

  .party-content {
    flex: 1;
    padding: 1rem 2rem;
  }

  .party-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
  }

  .party-info h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .description {
    color: #666;
    margin: 0;
  }

  .party-content {
    min-height: 400px;
  }

  .character-tab-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Dialog styles */
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 50;
  }

  :global(.dialog-content) {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 51;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #d32f2f;
  }

  .dialog-description {
    color: #666;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .error-details {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 20px;
  }

  .error-details-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }

  .error-list {
    margin: 0;
    padding-left: 20px;
  }

  .error-list li {
    color: #666;
    margin-bottom: 4px;
    list-style: disc;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }

  .dialog-button {
    padding: 8px 16px;
    background: #3366ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .dialog-button:hover {
    background: #2857e0;
  }
</style>
