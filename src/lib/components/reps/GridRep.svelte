<script lang="ts">
	import type { PartyView } from '$lib/api/schemas/party'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import SummonRep from '$lib/components/reps/SummonRep.svelte'
	import CharacterRep from '$lib/components/reps/CharacterRep.svelte'
	import Icon from '$lib/components/Icon.svelte'

	export let party: PartyView
	export let href: string = `/teams/${party.shortcode}`
	export let loading = false

	let currentView: 'weapons' | 'summons' | 'characters' = 'summons'

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}
</script>

<div
	class={`gridRep ${loading ? 'hidden' : 'visible'}`}
	role="link"
	tabindex="0"
	on:mouseleave={() => (currentView = 'summons')}
>
	<a {href} data-sveltekit-preload-data="hover">
		<div class="info">
			<h2 class:empty={!party.name}>{party.name || '(untitled)'}</h2>
			<div class="details">
				<span class={`raid ${!party.raid ? 'empty' : ''}`}
					>{party.raid ? displayName(party.raid) : 'No raid'}</span
				>

				<div class="pills">
					{#if party.chargeAttack}
						<span class="pill chargeAttack" title="Charge Attack">
							<Icon name="charge-attack" size={16} />
						</span>
					{/if}
					{#if party.fullAuto}
						<span class="pill fullAuto" title="Full Auto">
							<Icon name="full-auto" size={16} />
						</span>
					{/if}
					{#if party.raid?.group?.extra}
						<span class="pill extra" title="Extra">
							<Icon name="extra-grid" size={16} />
						</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="gridContainer">
			{#if currentView === 'characters'}
				<div class="characterGrid"><CharacterRep {party} /></div>
			{:else if currentView === 'summons'}
				<div class="summonGrid"><SummonRep {party} extendedView={true} /></div>
			{:else}
				<div class="weaponGrid"><WeaponRep {party} /></div>
			{/if}
		</div>
		<ul class="indicators">
			<li
				class:active={currentView === 'characters'}
				on:mouseenter={() => (currentView = 'characters')}
			>
				<div class="indicator"></div>
				<span class="sr-only">Characters</span>
			</li>
			<li class:active={currentView === 'weapons'} on:mouseenter={() => (currentView = 'weapons')}>
				<div class="indicator"></div>
				<span class="sr-only">Weapons</span>
			</li>
			<li class:active={currentView === 'summons'} on:mouseenter={() => (currentView = 'summons')}>
				<div class="indicator"></div>
				<span class="sr-only">Summons</span>
			</li>
		</ul>
	</a>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/rep' as rep;

	.gridRep {
		box-sizing: border-box;
		min-width: 262px;
		position: relative;
		width: 100%;
		opacity: 1;

		&.visible {
			transition: opacity 0.3s ease-in-out;
			opacity: 1;
		}

		&.hidden {
			opacity: 0;
			transition: opacity 0.12s ease-in-out;
		}

		a {
			display: grid;
			grid-template-rows: auto 1fr;
			gap: $unit;
			padding: $unit;
			text-decoration: none;
			color: inherit;
			width: 100%;
			height: 100%;
			border: 1px solid transparent;
			border-radius: $card-corner;
			box-sizing: border-box;
			background: var(--card-bg);
			overflow: hidden;

			&:hover {
				background: var(--grid-rep-hover);
				border-color: rgba(0, 0, 0, 0.1);
			}

			&:hover .indicators {
				opacity: 1;
			}
		}
	}

	.gridContainer {
		/* Reserve a constant visual height for all reps; keeps card height stable */
		aspect-ratio: calc(#{rep.$rep-body-ratio} / 1);
		width: 100%;
		align-self: start;
		overflow: hidden;
	}

	/* inner wrappers simply fill; specific geometry lives inside reps */
	.weaponGrid,
	.characterGrid,
	.summonGrid {
		width: 100%;
		height: 100%;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
		padding: $unit-half 0;

		h2 {
			color: var(--text-primary);
			font-size: 1.6rem;
			font-weight: 600;
			overflow: hidden;
			padding-bottom: 1px;
			text-overflow: ellipsis;
			white-space: nowrap;
			margin: 0;

			&.empty {
				color: var(--text-tertiary);
			}
		}

		.details {
			display: flex;
			flex-direction: row;
			gap: $unit;
			justify-content: space-between;
			min-width: 0;
		}

		.raid {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			flex: 0 1 auto;
			min-width: 0;

			&.empty {
				color: var(--text-tertiary);
			}
		}

		.pills {
			flex-shrink: 0;

			.pill {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 0 $unit-half;
				border-radius: $full-corner;
				flex-shrink: 0;

				&.chargeAttack {
					background-color: var(--charge-attack-bg);
					color: var(--charge-attack-text);
				}

				&.fullAuto {
					background-color: var(--full-auto-bg);
					color: var(--full-auto-text);
				}

				&.extra {
					background-color: var(--extra-purple-bg);
					color: var(--extra-purple-text);
				}
			}
		}
	}

	.indicators {
		display: flex;
		flex-direction: row;
		gap: $unit;
		justify-content: center;
		opacity: 0;
		list-style: none;
		padding-left: 0;

		li {
			flex-grow: 1;
			padding: $unit 0;
			position: relative;

			&:hover .indicator,
			&.active .indicator {
				background-color: var(--text-secondary);
			}
		}

		.indicator {
			transition: background-color 0.12s ease-in-out;
			height: $unit;
			border-radius: $unit-half;
			background-color: var(--button-contained-bg-hover);
		}
	}

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
