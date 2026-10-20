<script lang="ts">
	/**
	 * Chips under a party's name: its difficulty tier, whether it's solo, its
	 * battle settings, and the performance figures that were recorded.
	 */
	import * as m from '$lib/paraglide/messages'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import type { PartyDifficulty } from '$lib/types/api/party'
	import { battleSettings, performanceMetrics, type PartySettingsValues } from './partySettings'

	interface Props {
		party: PartySettingsValues & {
			solo?: boolean | undefined
			/** Computed difficulty assignment (null when not yet scoreable) */
			difficulty?: PartyDifficulty | null | undefined
			/** Builds the editor preview link */
			shortcode?: string | undefined
		}
		/** When true, the difficulty tier chip becomes a link to the editor preview */
		isEditor?: boolean
	}

	let { party, isEditor = false }: Props = $props()

	const difficulty = $derived(party.difficulty)
	const settings = $derived(battleSettings(party))
	const metrics = $derived(performanceMetrics(party))
	const difficultyPreviewHref = $derived(
		party.shortcode
			? `/database/difficulties?tab=preview&shortcode=${encodeURIComponent(party.shortcode)}`
			: null
	)
</script>

<div class="battle-section">
	<div class="settings-tokens">
		{#if difficulty?.tier}
			<Tooltip
				content={m.party_difficulty_tooltip({
					tier: difficulty.tier.name,
					score: difficulty.score?.toFixed(0) ?? '—'
				})}
			>
				{#if isEditor && difficultyPreviewHref}
					<a
						class="token difficulty editor-link"
						href={difficultyPreviewHref}
						target="_blank"
						rel="noopener"
					>
						{difficulty.tier.name}
					</a>
				{:else}
					<span class="token difficulty">
						{difficulty.tier.name}
					</span>
				{/if}
			</Tooltip>
		{/if}
		{#if party.solo}
			<span class="token solo on">{m.battle_solo()}</span>
		{/if}
		{#each settings as setting (setting.key)}
			<span class="token {setting.key}" class:on={setting.on} class:off={!setting.on}>
				{setting.label}
			</span>
		{/each}
		{#each metrics as metric (metric.tooltip)}
			<Tooltip content={metric.tooltip}>
				<span class="token metric">{metric.label}</span>
			</Tooltip>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.battle-section {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.settings-tokens {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
	}

	.token {
		display: inline-flex;
		align-items: center;
		padding: $unit-half $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		font-weight: $bold;
		line-height: 1;
		text-align: center;
		user-select: none;
		background: var(--input-bg);

		&.off {
			background: var(--button-bg);
			color: var(--text-secondary);
		}

		&.metric {
			background: var(--button-bg);
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
		}

		&.difficulty {
			background: var(--button-bg);
			color: var(--text-secondary);
		}

		&.editor-link {
			text-decoration: none;
			cursor: pointer;
			transition:
				opacity 120ms ease,
				transform 120ms ease;

			&:hover {
				opacity: 0.85;
			}

			&:focus-visible {
				outline: 2px solid var(--focus-ring);
				outline-offset: 2px;
			}
		}

		&.chargeAttack.on {
			background: var(--charge-attack-bg);
			color: var(--charge-attack-text);
		}

		&.fullAuto.on,
		&.autoSummon.on,
		&.solo.on {
			background: var(--full-auto-bg);
			color: var(--full-auto-text);
		}

		&.autoGuard.on {
			background: var(--auto-guard-bg);
			color: var(--auto-guard-text);
		}
	}
</style>
