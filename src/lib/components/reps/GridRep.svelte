<script lang="ts">
	import type { Party } from '$lib/types/api/party'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import SummonRep from '$lib/components/reps/SummonRep.svelte'
	import CharacterRep from '$lib/components/reps/CharacterRep.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'

	interface Props {
		party: Party
		href?: string
		loading?: boolean
	}

	let { party, href = `/teams/${party.shortcode}`, loading = false }: Props = $props()

	let currentView: 'weapons' | 'summons' | 'characters' = $state('weapons')

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
	onmouseleave={() => (currentView = 'weapons')}
>
	<a {href} data-sveltekit-preload-data="hover">
		<div class="info">
			<h2 class:empty={!party.name}>{party.name || 'Untitled team'}</h2>
			<div class="details">
				<div class="details-text">
					<span class={`raid ${!party.raid ? 'empty' : ''}`}
						>{party.raid ? displayName(party.raid) : 'No raid'}</span
					>
					{#if party.job}
						<span class="separator">•</span>
						<span class="job">{displayName(party.job)}</span>
					{/if}
				</div>

				<div class="pills">
					{#if party.chargeAttack}
						<Tooltip content="Charge Attack">
							{#snippet children()}
								<span class="pill chargeAttack">
									<Icon name="charge-attack" size={16} />
								</span>
							{/snippet}
						</Tooltip>
					{/if}
					{#if party.fullAuto}
						<Tooltip content="Full Auto">
							{#snippet children()}
								<span class="pill fullAuto">
									<Icon name="full-auto" size={16} />
								</span>
							{/snippet}
						</Tooltip>
					{/if}
					{#if party.raid?.group?.extra}
						<Tooltip content="Extra">
							{#snippet children()}
								<span class="pill extra">
									<Icon name="extra-grid" size={16} />
								</span>
							{/snippet}
						</Tooltip>
					{/if}
				</div>
			</div>
		</div>
		<div class="gridContainer">
			{#if currentView === 'characters'}
				<div class="characterGrid"><CharacterRep {party} unlimited={party.raid?.group?.unlimited} /></div>
			{:else if currentView === 'summons'}
				<div class="summonGrid"><SummonRep {party} extendedView={true} /></div>
			{:else}
				<div class="weaponGrid"><WeaponRep {party} /></div>
			{/if}
		</div>
		<ul class="indicators">
			<li
				class:active={currentView === 'characters'}
				onmouseenter={() => (currentView = 'characters')}
			>
				<div class="indicator"></div>
				<span class="sr-only">Characters</span>
			</li>
			<li class:active={currentView === 'weapons'} onmouseenter={() => (currentView = 'weapons')}>
				<div class="indicator"></div>
				<span class="sr-only">Weapons</span>
			</li>
			<li class:active={currentView === 'summons'} onmouseenter={() => (currentView = 'summons')}>
				<div class="indicator"></div>
				<span class="sr-only">Summons</span>
			</li>
		</ul>
	</a>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/typography' as typography;

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
			gap: spacing.$unit;
			padding: spacing.$unit;
			text-decoration: none;
			color: inherit;
			width: 100%;
			height: 100%;
			border: 1px solid transparent;
			border-radius: layout.$card-corner;
			box-sizing: border-box;
			background: var(--card-bg);
			overflow: hidden;

			&:hover {
				background: var(--grid-rep-hover);
				box-shadow:
					0 0 0 1px rgba(0, 0, 0, 0.1),
					effects.$card-elevation;
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
		gap: spacing.$unit-fourth;
		padding: spacing.$unit-half 0;
		min-width: 0; /* Critical: allows flex child to shrink below content size */

		h2 {
			color: var(--text-primary);
			font-size: 1.6rem;
			font-weight: typography.$bold;
			overflow: hidden;
			padding-bottom: 1px;
			text-overflow: ellipsis;
			white-space: nowrap;
			margin: 0;
			line-height: 1.2;

			&.empty {
				color: var(--text-tertiary);
			}
		}

		.details {
			display: flex;
			flex-direction: row;
			gap: spacing.$unit;
			justify-content: space-between;
			min-width: 0;
		}

		.details-text {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: spacing.$unit-half;
			overflow: hidden;
			flex: 0 1 auto;
			min-width: 0;

			.separator {
				color: var(--text-tertiary);
				flex-shrink: 0;
			}

			.job {
				color: var(--text-secondary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.raid {
			color: var(--text-secondary);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

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
				padding: 0 spacing.$unit-half;
				border-radius: layout.$full-corner;
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
		gap: spacing.$unit;
		justify-content: center;
		opacity: 0;
		list-style: none;
		padding-left: 0;

		li {
			flex-grow: 1;
			position: relative;

			&:hover .indicator,
			&.active .indicator {
				background-color: var(--text-secondary);
			}
		}

		.indicator {
			transition: background-color 0.12s ease-in-out;
			height: spacing.$unit;
			border-radius: spacing.$unit-half;
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
