<svelte:options runes={true} />

<script lang="ts">
  import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
  import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
  import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
  import { openSearchSidebar, closeSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
  import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
  import { GridType } from '$lib/types/enums'
  import { setContext } from 'svelte'
  import type { SearchResult } from '$lib/api/resources/search'
  import { apiClient } from '$lib/api/client'
  import { Dialog } from 'bits-ui'
  import { replaceState } from '$app/navigation'
  import { page } from '$app/stores'

  // Get authentication status from page store
  const isAuthenticated = $derived($page.data?.isAuthenticated ?? false)
  const currentUser = $derived($page.data?.currentUser)

  // Local, client-only state for tab selection (Svelte 5 runes)
  let activeTab = $state<GridType>(GridType.Weapon)

  // Open search sidebar on mount
  let hasOpenedSidebar = $state(false)
  $effect(() => {
    if (!hasOpenedSidebar) {
      hasOpenedSidebar = true
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

  // Grid state
  let weapons = $state<any[]>([])
  let summons = $state<any[]>([])
  let characters = $state<any[]>([])
  let selectedSlot = $state<number | null>(null)
  let isFirstItemForSlot = false // Track if this is the first item after clicking empty cell

  // Party state
  let partyId = $state<string | null>(null)
  let shortcode = $state<string | null>(null)
  let editKey = $state<string | null>(null)
  let isCreatingParty = $state(false)

  // Error dialog state
  let errorDialogOpen = $state(false)
  let errorMessage = $state('')
  let errorDetails = $state<string[]>([])


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

      try {
        // Step 1: Create the party (with local_id only for anonymous users)
        const partyPayload: any = {
          name: 'New Team',
          visibility: 1, // 1 = Public, 2 = Unlisted, 3 = Private
          element: firstItem.element || 0 // Use item's element or default to null
        }

        // Only include localId for anonymous users
        if (!isAuthenticated) {
          const localId = apiClient.getLocalId()
          partyPayload.localId = localId
        }

        // Create party using the API client
        const result = await apiClient.createParty(partyPayload)
        console.log('Party created:', result)

        // The response has { party, editKey? }
        const response = result.party
        partyId = response.id
        shortcode = response.shortcode

        if (!partyId || !shortcode) {
          throw new Error('Party creation did not return ID or shortcode')
        }

        // Store edit key if present (handled by API client)
        if (result.editKey) {
          editKey = result.editKey
        }

        // Step 2: Add the first item to the party
        let position = selectedSlot !== null ? selectedSlot : -1 // Use selectedSlot if available
        let itemAdded = false
        try {
          console.log('Adding item to party:', { partyId, itemId: firstItem.id, type: activeTab, position })

          if (activeTab === GridType.Weapon) {
            // Use selectedSlot if available, otherwise default to mainhand
            if (selectedSlot === null) position = -1
            const addResult = await apiClient.addWeapon(
              partyId,
              firstItem.granblue_id,
              position,
              { mainhand: position === -1 }
            )
            console.log('Weapon added:', addResult)
            itemAdded = true

            // Update local state with the added weapon
            weapons = [...weapons, {
              id: addResult.grid_weapon?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: firstItem.granblue_id,
                name: firstItem.name,
                element: firstItem.element
              },
              mainhand: position === -1
            }]
          } else if (activeTab === GridType.Summon) {
            // Use selectedSlot if available, otherwise default to main summon
            if (selectedSlot === null) position = -1
            const addResult = await apiClient.addSummon(
              partyId,
              firstItem.granblue_id,
              position,
              { main: position === -1, friend: position === 6 }
            )
            console.log('Summon added:', addResult)
            itemAdded = true

            // Update local state with the added summon
            summons = [...summons, {
              id: addResult.grid_summon?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: firstItem.granblue_id,
                name: firstItem.name,
                element: firstItem.element
              },
              main: position === -1,
              friend: position === 6
            }]
          } else if (activeTab === GridType.Character) {
            // Use selectedSlot if available, otherwise default to first slot
            if (selectedSlot === null) position = 0
            const addResult = await apiClient.addCharacter(
              partyId,
              firstItem.granblue_id,
              position,
              {}
            )
            console.log('Character added:', addResult)
            itemAdded = true

            // Update local state with the added character
            characters = [...characters, {
              id: addResult.grid_character?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: firstItem.granblue_id,
                name: firstItem.name,
                element: firstItem.element
              }
            }]
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
              position = emptySlots[0]
            }

            // Add weapon via API
            const response = await apiClient.addWeapon(
              partyId,
              item.granblue_id, // Use granblue_id
              position,
              { mainhand: position === -1 }
            )

            // Add to local state
            weapons = [...weapons, {
              id: response.grid_weapon?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: item.granblue_id,
                name: item.name,
                element: item.element
              },
              mainhand: position === -1
            }]
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
              position = emptySlots[0]
            }

            // Add summon via API
            const response = await apiClient.addSummon(
              partyId,
              item.granblue_id, // Use granblue_id
              position,
              { main: position === -1, friend: position === 6 }
            )

            // Add to local state
            summons = [...summons, {
              id: response.grid_summon?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: item.granblue_id,
                name: item.name,
                element: item.element
              },
              main: position === -1,
              friend: position === 6
            }]
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
              position = emptySlots[0]
            }

            // Add character via API
            const response = await apiClient.addCharacter(
              partyId,
              item.granblue_id, // Use granblue_id
              position,
              {}
            )

            // Add to local state
            characters = [...characters, {
              id: response.grid_character?.id || `temp-${Date.now()}`,
              position,
              object: {
                granblueId: item.granblue_id,
                name: item.name,
                element: item.element
              }
            }]
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

    // Original local-only adding logic (before party creation)
    if (activeTab === GridType.Weapon) {
      // Add weapons to empty slots
      const emptySlots = Array.from({ length: 10 }, (_, i) => i - 1) // -1 for mainhand, 0-8 for grid
        .filter(i => !weapons.find(w => w.position === i))

      items.forEach((item, index) => {
        let position: number
        // Use selectedSlot for first item if available
        if (index === 0 && selectedSlot !== null && !weapons.find(w => w.position === selectedSlot)) {
          position = selectedSlot
          selectedSlot = null // Reset after using
        } else {
          // Find next empty slot
          const availableSlots = emptySlots.filter(s => !weapons.find(w => w.position === s))
          if (availableSlots.length === 0) return
          position = availableSlots[0]
        }

        const newWeapon = {
          id: `temp-${Date.now()}-${index}`,
          position,
          object: {
            granblueId: item.granblue_id,
            name: item.name,
            element: item.element
          },
          mainhand: position === -1
        }
        console.log('Adding weapon:', newWeapon)
        weapons = [...weapons, newWeapon]
      })
      console.log('Updated weapons array:', weapons)
    } else if (activeTab === GridType.Summon) {
      // Add summons to empty slots
      const emptySlots = [-1, 0, 1, 2, 3, 6] // main, 4 grid slots, friend
        .filter(i => !summons.find(s => s.position === i))

      items.forEach((item, index) => {
        let position: number
        // Use selectedSlot for first item if available
        if (index === 0 && selectedSlot !== null && !summons.find(s => s.position === selectedSlot)) {
          position = selectedSlot
          selectedSlot = null // Reset after using
        } else {
          // Find next empty slot
          const availableSlots = emptySlots.filter(s => !summons.find(sum => sum.position === s))
          if (availableSlots.length === 0) return
          position = availableSlots[0]
        }

        summons = [...summons, {
          id: `temp-${Date.now()}-${index}`,
          position,
          object: {
            granblueId: item.granblue_id,
            name: item.name,
            element: item.element
          },
          main: position === -1,
          friend: position === 6
        }]
      })
    } else if (activeTab === GridType.Character) {
      // Add characters to empty slots
      const emptySlots = Array.from({ length: 5 }, (_, i) => i)
        .filter(i => !characters.find(c => c.position === i))

      items.forEach((item, index) => {
        let position: number
        // Use selectedSlot for first item if available
        if (index === 0 && selectedSlot !== null && !characters.find(c => c.position === selectedSlot)) {
          position = selectedSlot
          selectedSlot = null // Reset after using
        } else {
          // Find next empty slot
          const availableSlots = emptySlots.filter(s => !characters.find(c => c.position === s))
          if (availableSlots.length === 0) return
          position = availableSlots[0]
        }

        characters = [...characters, {
          id: `temp-${Date.now()}-${index}`,
          position,
          object: {
            granblueId: item.granblue_id,
            name: item.name,
            element: item.element
          }
        }]
      })
    }
  }

  // Remove functions
  function removeWeapon(itemId: string) {
    console.log('Removing weapon:', itemId)
    weapons = weapons.filter(w => w.id !== itemId)
    return Promise.resolve({ id: 'new', shortcode: 'new', weapons, summons, characters })
  }

  function removeSummon(itemId: string) {
    console.log('Removing summon:', itemId)
    summons = summons.filter(s => s.id !== itemId)
    return Promise.resolve({ id: 'new', shortcode: 'new', weapons, summons, characters })
  }

  function removeCharacter(itemId: string) {
    console.log('Removing character:', itemId)
    characters = characters.filter(c => c.id !== itemId)
    return Promise.resolve({ id: 'new', shortcode: 'new', weapons, summons, characters })
  }

  // Provide a minimal party context so Unit components can render safely.
  setContext('party', {
    getParty: () => ({ id: 'new', shortcode: 'new', weapons, summons, characters }),
    updateParty: (updatedParty: any) => {
      // Update the local state when party is updated
      if (updatedParty.weapons) weapons = updatedParty.weapons
      if (updatedParty.summons) summons = updatedParty.summons
      if (updatedParty.characters) characters = updatedParty.characters
    },
    canEdit: () => true,
    services: {
      gridService: {
        removeWeapon: (partyId: string, itemId: string) => removeWeapon(itemId),
        removeSummon: (partyId: string, itemId: string) => removeSummon(itemId),
        removeCharacter: (partyId: string, itemId: string) => removeCharacter(itemId),
        addWeapon: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } }),
        addSummon: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } }),
        addCharacter: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } }),
        replaceWeapon: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } }),
        replaceSummon: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } }),
        replaceCharacter: () => Promise.resolve({ party: { id: 'new', shortcode: 'new', weapons, summons, characters } })
      },
      partyService: { getEditKey: () => null }
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
        <button class="toggle-sidebar" on:click={() => openSearchSidebar({
          type: activeTab === GridType.Weapon ? 'weapon' :
                activeTab === GridType.Summon ? 'summon' :
                'character',
          onAddItems: handleAddItems,
          canAddMore: !isGridFull(activeTab)
        })}>
          Open Search
        </button>
      </header>

      <PartySegmentedControl
        value={activeTab}
        onValueChange={selectTab}
        party={{
          element: 0,
          job: undefined,
          characters,
          weapons,
          summons
        }}
        userGender={currentUser?.gender}
      />

      <div class="party-content">
        {#if activeTab === GridType.Weapon}
          <WeaponGrid {weapons} />
        {:else if activeTab === GridType.Summon}
          <SummonGrid {summons} />
        {:else}
          <CharacterGrid {characters} />
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
  /* Override the main element's padding for this page */
  :global(main) {
    padding: 0 !important;
  }

  .page-container {
    display: flex;
    gap: 0;
    width: 100%;
    min-height: 100vh;
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

  .toggle-sidebar {
    padding: 0.5rem 1rem;
    background: #3366ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .toggle-sidebar:hover {
    background: #2857e0;
  }

  .party-content {
    min-height: 400px;
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
