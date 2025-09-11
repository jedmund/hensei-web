<script lang="ts">
  import { onMount, getContext, setContext } from 'svelte'
  import type { PartyView } from '$lib/api/schemas/party'
  import { PartyService } from '$lib/services/party.service'
  import { GridService } from '$lib/services/grid.service'
  import { ConflictService } from '$lib/services/conflict.service'
  import WeaponGrid from '$lib/components/grids/WeaponGrid.svelte'
  import SummonGrid from '$lib/components/grids/SummonGrid.svelte'
  import CharacterGrid from '$lib/components/grids/CharacterGrid.svelte'
  
  interface Props {
    initial: PartyView
    canEditServer?: boolean
    authUserId?: string
  }

  let { initial, canEditServer = false, authUserId }: Props = $props()

  // Per-route local state using Svelte 5 runes
  let party = $state<PartyView>(initial)
  let activeTab = $state<'weapons' | 'summons' | 'characters'>('weapons')
  let loading = $state(false)
  let error = $state<string | null>(null)
  
  // Services
  const partyService = new PartyService(fetch)
  const gridService = new GridService(fetch)
  const conflictService = new ConflictService(fetch)

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
  
  // Tab configuration
  const tabs = [
    { key: 'weapons', label: 'Weapons', count: party.weapons?.length || 0 },
    { key: 'summons', label: 'Summons', count: party.summons?.length || 0 },
    { key: 'characters', label: 'Characters', count: party.characters?.length || 0 }
  ] as const

  // Derived elements for character image logic
  const mainWeapon = $derived(() => party.weapons.find(w => (w as any)?.mainhand || (w as any)?.position === -1))
  const mainWeaponElement = $derived(() => (mainWeapon as any)?.element ?? (mainWeapon as any)?.object?.element)
  const partyElement = $derived(() => (party as any)?.element)

  function selectTab(key: typeof tabs[number]['key']) {
    activeTab = key
  }
  
  // Party operations
  async function updatePartyDetails(updates: Partial<Party>) {
    if (!canEdit()) return
    
    loading = true
    error = null
    
    try {
      const updated = await partyService.update(
        party.id,
        updates,
        editKey || undefined
      )
      party = updated
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
  
  // Client-side initialization
  onMount(() => {
    // Get or create local ID
    localId = partyService.getLocalId()
    
    // Get edit key for this party if it exists
    editKey = partyService.getEditKey(party.shortcode)
  })
  
  // Provide services to child components via context
  setContext('party', {
    getParty: () => party,
    updateParty: (p: PartyView) => party = p,
    canEdit: () => canEdit(),
    services: { partyService, gridService, conflictService }
  })
</script>

<section class="party-container">
  <header class="party-header">
    <div class="party-info">
      <h1>{party.name || '(untitled party)'}</h1>
      {#if party.description}
        <p class="description">{party.description}</p>
      {/if}
    </div>
    
    <div class="party-actions">
      {#if authUserId}
        <button 
          class="favorite-btn"
          class:favorited={party.favorited}
          on:click={toggleFavorite}
          disabled={loading}
          aria-label={party.favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {party.favorited ? '★' : '☆'}
        </button>
      {/if}
      
      <button 
        class="remix-btn"
        on:click={remixParty}
        disabled={loading}
        aria-label="Remix this party"
      >
        Remix
      </button>
    </div>
  </header>
  
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

  <nav class="party-tabs" aria-label="Party sections">
    {#each tabs as t}
      <button
        class="tab-btn"
        aria-pressed={activeTab === t.key}
        class:active={activeTab === t.key}
        on:click={() => selectTab(t.key)}
      >
        {t.label}
        {#if t.count > 0}
          <span class="count">({t.count})</span>
        {/if}
      </button>
    {/each}
  </nav>
  
  {#if error}
    <div class="error-message" role="alert">
      {error}
    </div>
  {/if}

  <div class="party-content">
    {#if activeTab === 'weapons'}
      <WeaponGrid 
        weapons={party.weapons} 
        raidExtra={(party as any)?.raid?.group?.extra}
        showGuidebooks={(party as any)?.raid?.group?.guidebooks}
        guidebooks={(party as any)?.guidebooks}
      />
    {:else if activeTab === 'summons'}
      <SummonGrid summons={party.summons} />
    {:else}
      <CharacterGrid characters={party.characters} mainWeaponElement={mainWeaponElement} partyElement={partyElement} />
    {/if}
  </div>
  
  {#if canEdit()}
    <footer class="party-footer">
      <p class="edit-indicator">✏️ You can edit this party</p>
    </footer>
  {/if}
</section>

<style>
  .party-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
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
  
  .party-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .favorite-btn,
  .remix-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .favorite-btn {
    font-size: 1.2rem;
    padding: 0.5rem;
  }
  
  .favorite-btn.favorited {
    color: gold;
  }
  
  .favorite-btn:hover,
  .remix-btn:hover {
    background: #f5f5f5;
  }
  
  .favorite-btn:disabled,
  .remix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  
  .party-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }
  
  .tab-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }
  
  .tab-btn.active {
    color: #3366ff;
  }
  
  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #3366ff;
  }
  
  .tab-btn .count {
    color: #999;
    font-size: 0.9em;
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
  
  .grid-placeholder {
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
    text-align: center;
  }
  
  .grid-placeholder ul {
    text-align: left;
    max-width: 400px;
    margin: 1rem auto;
  }
  
  .party-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
  
  .edit-indicator {
    color: #3366ff;
    font-size: 0.9rem;
  }
</style>
