<script lang="ts">
  import type { PartyView } from '$lib/api/schemas/party'
  import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
  import SummonRep from '$lib/components/reps/SummonRep.svelte'
  import CharacterRep from '$lib/components/reps/CharacterRep.svelte'

  export let party: PartyView
  export let href: string = `/teams/${party.shortcode}`
  export let loading = false

  let currentView: 'weapons' | 'summons' | 'characters' = 'weapons'

  function displayName(input: any): string {
    if (!input) return '—'
    const maybe = input.name ?? input
    if (typeof maybe === 'string') return maybe
    if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
    return '—'
  }
</script>

<div class={`gridRep ${loading ? 'hidden' : 'visible'}`} on:mouseleave={() => currentView='weapons'}>
  <a href={href} data-sveltekit-preload-data="hover">
    <div class="details">
      <div class="top">
        <div class="info">
          <h2 class:empty={!party.name}>{party.name || '(untitled)'}</h2>
          <div class="properties">
            <span class={`raid ${!party.raid ? 'empty' : ''}`}>{party.raid ? displayName(party.raid) : 'No raid'}</span>
            {#if party.fullAuto}<span class="fullAuto"> · Full Auto</span>{/if}
            {#if party.raid?.group?.extra}<span class="extra"> · EX</span>{/if}
          </div>
        </div>
      </div>
    </div>
    <div class="gridContainer">
      {#if currentView==='characters'}
        <div class="characterGrid"><CharacterRep {party} /></div>
      {:else if currentView==='summons'}
        <div class="summonGrid"><SummonRep {party} /></div>
      {:else}
        <div class="weaponGrid"><WeaponRep {party} /></div>
      {/if}
    </div>
    <ul class="indicators">
      <li class:active={currentView==='characters'} on:mouseenter={() => currentView='characters'}>
        <div class="indicator" />
        <span class="sr-only">Characters</span>
      </li>
      <li class:active={currentView==='weapons'} on:mouseenter={() => currentView='weapons'}>
        <div class="indicator" />
        <span class="sr-only">Weapons</span>
      </li>
      <li class:active={currentView==='summons'} on:mouseenter={() => currentView='summons'}>
        <div class="indicator" />
        <span class="sr-only">Summons</span>
      </li>
    </ul>
  </a>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;

  .gridRep { aspect-ratio: 3/2; border-radius: 10px; box-sizing: border-box; min-width: 320px; position: relative; width: 100%; opacity: 1; }
  .gridRep.visible { transition: opacity .3s ease-in-out; opacity: 1; }
  .gridRep.hidden { opacity: 0; transition: opacity .12s ease-in-out; }
  .gridRep a {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 8px;
    padding: $unit-2x;
    text-decoration: none;
    color: inherit;
    width: 100%;
    height: 100%;
    border: 1px solid transparent;
    border-radius: 10px;
    box-sizing: border-box;
    background: var(--card-bg);
    overflow: hidden;
  }
  .gridRep a:hover { background: var(--grid-rep-hover); border-color: rgba(0,0,0,.1); }
  .gridRep a:hover .indicators { opacity: 1; }
  .gridContainer { aspect-ratio: 2.1/1; width: 100%; align-self: start; }

  .weaponGrid { aspect-ratio: 3.25/1; }
  .characterGrid { aspect-ratio: 2.1/1; }
  .summonGrid { aspect-ratio: 2/0.91; }

  .details { display: flex; flex-direction: column; gap: $unit; }
  .details .top { display: flex; flex-direction: row; gap: calc($unit/2); align-items: center; }
  .details .info { display: flex; flex-direction: column; flex-grow: 1; gap: calc($unit/2); max-width: calc(100% - 44px - $unit); }
  .details h2 { color: var(--text-primary); font-size: 1.6rem; font-weight: 600; overflow: hidden; padding-bottom: 1px; text-overflow: ellipsis; white-space: nowrap; min-height: 24px; max-width: 258px; }
  .details h2.empty { color: var(--text-tertiary); }
  .properties { display: flex; font-size: 1.3rem; gap: $unit-half; }
  .raid.empty { color: var(--text-tertiary); }
  .fullAuto { color: var(--full-auto-label-text); white-space: nowrap; }
  .extra { color: var(--extra-purple-light-text); white-space: nowrap; }

  .indicators {
    display: flex;
    flex-direction: row;
    gap: $unit;
    margin-top: $unit;
    margin-bottom: $unit;
    justify-content: center;
    opacity: 0;
    list-style: none;
    padding-left: 0;
  }
  .indicators li { flex-grow: 1; padding: $unit 0; position: relative; }
  .indicator { transition: background-color .12s ease-in-out; height: $unit; border-radius: $unit-half; background-color: var(--button-contained-bg-hover); }
  .indicators li:hover .indicator, .indicators li.active .indicator { background-color: var(--text-secondary); }

  /* Visually hidden, accessible to screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
