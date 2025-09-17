<script lang="ts">
  import { onMount, getContext, setContext } from 'svelte'
  import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
  import { PartyService } from '$lib/services/party.service'
  import { GridService } from '$lib/services/grid.service'
  import { ConflictService } from '$lib/services/conflict.service'
  import { apiClient } from '$lib/api/client'
  import { createDragDropContext, type DragOperation } from '$lib/composables/drag-drop.svelte'
  import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
  import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
  import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
  import SearchSidebar from '$lib/components/panels/SearchSidebar.svelte'
  import PartySegmentedControl from '$lib/components/party/PartySegmentedControl.svelte'
  import type { SearchResult } from '$lib/api/resources/search'
  import { GridType } from '$lib/types/enums'
  import Dialog from '$lib/components/ui/Dialog.svelte'

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
    initial?.id && initial?.id !== 'new' && Array.isArray(initial?.weapons)
      ? initial
      : defaultParty
  )
  let activeTab = $state<GridType>(GridType.Weapon)
  let loading = $state(false)
  let error = $state<string | null>(null)
  let pickerOpen = $state(false)
  let pickerTitle = $state('Search')
  let selectedSlot = $state<number>(0)
  let editDialogOpen = $state(false)
  let editingTitle = $state('')
  
  // Services
  const partyService = new PartyService(fetch)
  const gridService = new GridService(fetch)
  const conflictService = new ConflictService(fetch)

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
      if (target.type === 'summon' && (target.position === -1 || target.position === 6)) return false

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

    // Call appropriate API based on type
    if (source.type === 'weapon') {
      const updated = await apiClient.swapWeapons(party.id, source.itemId, target.itemId)
      return updated
    } else if (source.type === 'character') {
      const updated = await apiClient.swapCharacters(party.id, source.itemId, target.itemId)
      return updated
    } else if (source.type === 'summon') {
      const updated = await apiClient.swapSummons(party.id, source.itemId, target.itemId)
      return updated
    }

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

    // Determine container based on target position
    let container: string | undefined

    if (source.type === 'character') {
      // Characters: positions 0-4 are main, 5-6 are extra
      container = target.position >= 5 ? 'extra' : 'main'
      const updated = await apiClient.updateCharacterPosition(
        party.id,
        source.itemId,
        target.position,
        container
      )
      return updated
    } else if (source.type === 'weapon') {
      // Weapons: positions 0-8 are main, 9+ are extra
      container = target.position >= 9 ? 'extra' : 'main'
      const updated = await apiClient.updateWeaponPosition(
        party.id,
        source.itemId,
        target.position,
        container
      )
      return updated
    } else if (source.type === 'summon') {
      // Summons: positions 0-3 are sub, 4-5 are subaura
      container = target.position >= 4 ? 'subaura' : 'main'
      const updated = await apiClient.updateSummonPosition(
        party.id,
        source.itemId,
        target.position,
        container
      )
      return updated
    }

    throw new Error(`Unknown item type: ${source.type}`)
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
  let editKey = $state<string | null>(null)
  
  // Derived editability (combines server and client state)
  let canEdit = $derived(() => {
    if (canEditServer) return true
    
    // Re-compute on client with localStorage values
    const result = partyService.computeEditability(
      party,
      authUserId,
      localId,
      editKey
    )
    return result.canEdit
  })
  
  // Derived elements for character image logic
  const mainWeapon = $derived(() => (party?.weapons ?? []).find(w => w?.mainhand || w?.position === -1))
  const mainWeaponElement = $derived(() => mainWeapon?.element ?? mainWeapon?.weapon?.element)
  const partyElement = $derived(() => party?.element)

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

    try {
      loading = true
      error = null

      // Update party title via API
      const updated = await updatePartyDetails({ name: editingTitle })
      if (updated) {
        party = updated
        editDialogOpen = false
      }
    } catch (err: any) {
      error = err.message || 'Failed to update party title'
    } finally {
      loading = false
    }
  }

  // Party operations
  async function updatePartyDetails(updates: Partial<Party>) {
    if (!canEdit()) return null

    loading = true
    error = null

    try {
      // Use apiClient for client-side updates (handles edit keys automatically)
      const updated = await apiClient.updateParty(party.id, updates)
      party = updated
      return updated
    } catch (err: any) {
      error = err.message || 'Failed to update party'
      return null
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
        await partyService.unfavorite(party.id)
        party.favorited = false
      } else {
        await partyService.favorite(party.id)
        party.favorited = true
      }
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
      const result = await partyService.remix(
        party.shortcode,
        localId,
        editKey || undefined
      )

      // Store new edit key if returned
      if (result.editKey) {
        editKey = result.editKey
      }

      // Navigate to new party
      window.location.href = `/teams/${result.party.shortcode}`
    } catch (err: any) {
      error = err.message || 'Failed to remix party'
    } finally {
      loading = false
    }
  }

  // Handle adding items from the search sidebar
  async function handleAddItems(items: SearchResult[]) {
    if (items.length === 0 || !canEdit()) return

    const item = items[0]
    loading = true
    error = null

    try {
      // Determine which slot to use
      let targetSlot = selectedSlot

      // Call appropriate API based on current tab
      if (activeTab === GridType.Weapon) {
        await apiClient.addWeapon(party.id, item.granblue_id, targetSlot, {
          mainhand: targetSlot === -1
        })
      } else if (activeTab === GridType.Summon) {
        await apiClient.addSummon(party.id, item.granblue_id, targetSlot, {
          main: targetSlot === -1,
          friend: targetSlot === 6
        })
      } else if (activeTab === GridType.Character) {
        await apiClient.addCharacter(party.id, item.granblue_id, targetSlot)
      }

      // Refresh party data
      const updated = await partyService.getByShortcode(party.shortcode)
      party = updated

      // Find next empty slot for continuous adding
      let nextEmptySlot = -999 // sentinel value meaning no empty slot found

      if (activeTab === GridType.Weapon) {
        // Check mainhand first (position -1)
        if (!party.weapons.find(w => w.position === -1 || w.mainhand)) {
          nextEmptySlot = -1
        } else {
          // Check grid slots 0-8
          for (let i = 0; i < 9; i++) {
            if (!party.weapons.find(w => w.position === i)) {
              nextEmptySlot = i
              break
            }
          }
        }
      } else if (activeTab === GridType.Summon) {
        // Check main summon first (position -1)
        if (!party.summons.find(s => s.position === -1 || s.main)) {
          nextEmptySlot = -1
        } else {
          // Check grid slots 0-5
          for (let i = 0; i < 6; i++) {
            if (!party.summons.find(s => s.position === i)) {
              nextEmptySlot = i
              break
            }
          }
          // Check friend summon (position 6)
          if (nextEmptySlot === -999 && !party.summons.find(s => s.position === 6 || s.friend)) {
            nextEmptySlot = 6
          }
        }
      } else if (activeTab === GridType.Character) {
        // Check character slots 0-4
        for (let i = 0; i < 5; i++) {
          if (!party.characters.find(c => c.position === i)) {
            nextEmptySlot = i
            break
          }
        }
      }

      // If there's another empty slot, update selectedSlot to it
      // Otherwise close the picker (grid is full)
      if (nextEmptySlot !== -999) {
        selectedSlot = nextEmptySlot
      } else {
        pickerOpen = false
      }
    } catch (err: any) {
      error = err.message || 'Failed to add item'
    } finally {
      loading = false
    }
  }
  
  // Client-side initialization
  onMount(() => {
    // Get or create local ID
    localId = partyService.getLocalId()

    // Get edit key for this party if it exists
    editKey = partyService.getEditKey(party.shortcode)

    // No longer need to verify party data integrity after hydration
    // since $state.raw prevents the hydration mismatch
  })

  // Create client-side wrappers for grid operations using API client
  const clientGridService = {
    async removeWeapon(partyId: string, gridWeaponId: string, _editKey?: string) {
      try {
        await apiClient.removeWeapon(partyId, gridWeaponId)
        // Reload party data
        const updated = await partyService.getByShortcode(party.shortcode)
        return updated
      } catch (err) {
        console.error('Failed to remove weapon:', err)
        throw err
      }
    },
    async removeSummon(partyId: string, gridSummonId: string, _editKey?: string) {
      try {
        await apiClient.removeSummon(partyId, gridSummonId)
        // Reload party data
        const updated = await partyService.getByShortcode(party.shortcode)
        return updated
      } catch (err) {
        console.error('Failed to remove summon:', err)
        throw err
      }
    },
    async removeCharacter(partyId: string, gridCharacterId: string, _editKey?: string) {
      try {
        await apiClient.removeCharacter(partyId, gridCharacterId)
        // Reload party data
        const updated = await partyService.getByShortcode(party.shortcode)
        return updated
      } catch (err) {
        console.error('Failed to remove character:', err)
        throw err
      }
    }
  }

  // Provide services to child components via context
  setContext('party', {
    getParty: () => party,
    updateParty: (p: Party) => party = p,
    canEdit: () => canEdit(),
    getEditKey: () => editKey,
    services: {
      partyService,
      gridService: clientGridService, // Use client-side wrapper
      conflictService
    },
    openPicker: (opts: { type: 'weapon' | 'summon' | 'character'; position: number; item?: any }) => {
      if (!canEdit()) return
      selectedSlot = opts.position
      activeTab = opts.type === 'weapon' ? GridType.Weapon :
                  opts.type === 'summon' ? GridType.Summon : GridType.Character
      pickerTitle = `Search ${opts.type}s`
      pickerOpen = true
    }
  })

  // Provide drag-drop context to child components
  setContext('drag-drop', dragContext)
</script>

<div class="page-wrap" class:with-panel={pickerOpen}>
  <div class="track">
    <section class="party-container">
  <header class="party-header">
    <div class="party-info">
      <h1>{party.name || '(untitled party)'}</h1>
      {#if party.description}
        <p class="description">{party.description}</p>
      {/if}
    </div>

    <div class="party-actions">
      {#if canEdit()}
        <button
          class="edit-btn"
          onclick={openEditDialog}
          disabled={loading}
          aria-label="Edit party details"
        >
          Edit
        </button>
      {/if}

      {#if authUserId}
        <button
          class="favorite-btn"
          class:favorited={party.favorited}
          onclick={toggleFavorite}
          disabled={loading}
          aria-label={party.favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {party.favorited ? '★' : '☆'}
        </button>
      {/if}

      <button
        class="remix-btn"
        onclick={remixParty}
        disabled={loading}
        aria-label="Remix this party"
      >
        Remix
      </button>
    </div>
  </header>

  {#if canEdit()}
    <div class="edit-status">
      ✏️ You can edit this party - Click on any slot to add or replace items
    </div>
  {:else}
    <div class="edit-status readonly">
      🔒 Read-only
    </div>
  {/if}

  {#if party.raid}
    <div class="raid-info">
      <span class="raid-name">
        {typeof party.raid.name === 'string' ? party.raid.name : party.raid.name?.en || party.raid.name?.ja || 'Unknown Raid'}
      </span>
      {#if party.raid.group}
        <span class="raid-difficulty">Difficulty: {party.raid.group.difficulty}</span>
      {/if}
    </div>
  {/if}

  <PartySegmentedControl
    selectedTab={activeTab}
    onTabChange={handleTabChange}
    party={party}
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
      <CharacterGrid characters={party.characters} mainWeaponElement={mainWeaponElement} partyElement={partyElement} />
    {/if}
  </div>
  

    </section>
    <SearchSidebar
      open={pickerOpen}
      type={activeTab === GridType.Weapon ? 'weapon' :
            activeTab === GridType.Summon ? 'summon' : 'character'}
      onClose={() => (pickerOpen = false)}
      onAddItems={handleAddItems}
      canAddMore={true}
    />
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
    <button
      class="btn-secondary"
      onclick={() => (editDialogOpen = false)}
      disabled={loading}
    >
      Cancel
    </button>
    <button
      class="btn-primary"
      onclick={savePartyTitle}
      disabled={loading || !editingTitle.trim()}
    >
      {loading ? 'Saving...' : 'Save'}
    </button>
  {/snippet}
</Dialog>

<style>
  .page-wrap { position: relative; --panel-w: 380px; overflow-x: auto; }
  .track { display: flex; gap: 0; align-items: flex-start; }
  .party-container { width: 1200px; margin: 0 auto; padding: 1rem; }
  
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
  
  .party-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-btn,
  .favorite-btn,
  .remix-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn {
    padding: 0.5rem 1rem;
  }
  
  .favorite-btn {
    font-size: 1.2rem;
    padding: 0.5rem;
  }
  
  .favorite-btn.favorited {
    color: gold;
  }
  
  .edit-btn:hover,
  .favorite-btn:hover,
  .remix-btn:hover {
    background: #f5f5f5;
  }

  .edit-btn:disabled,
  .favorite-btn:disabled,
  .remix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .edit-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: #e8f0ff;
    border: 1px solid #3366ff;
    border-radius: 6px;
    color: #3366ff;
    font-size: 0.9rem;
    font-weight: 500;

    &.readonly {
      background: #f5f5f5;
      border-color: #ccc;
      color: #666;
    }
  }

  .raid-info {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: #f9f9f9;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .raid-name {
    font-weight: 600;
  }

  .error-message {
    padding: 0.75rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
    margin-bottom: 1rem;
  }

  .party-content {
    min-height: 400px;
  }

  /* Edit form styles */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .edit-form label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }

  .edit-form input {
    padding: 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .edit-form input:focus {
    outline: none;
    border-color: var(--focus-ring, #3366ff);
  }

  .edit-form input:disabled {
    background: #f5f5f5;
    opacity: 0.7;
  }

  /* Dialog buttons */
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--button-primary-bg, #3366ff);
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--button-primary-hover, #2855cc);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: white;
    color: var(--text-primary, #333);
    border: 1px solid var(--border-color, #ddd);
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
