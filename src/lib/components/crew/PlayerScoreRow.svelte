<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { formatScore } from '$lib/utils/gw'
	import type { GwIndividualScore } from '$lib/types/api/gw'

	export interface PlayerScore {
		id: string
		name: string
		type: 'member' | 'phantom'
		totalScore: number
		isRetired?: boolean
		scores: GwIndividualScore[]
	}

	interface Props {
		player: PlayerScore
		rank: number
		isOfficer: boolean
		onEditScore: () => void
	}

	let { player, rank, isOfficer, onEditScore }: Props = $props()

	const hasScores = $derived(player.scores.length > 0)
	const isExcused = $derived(player.scores.some((s) => s.excused))
	const isTopFive = $derived(rank <= 5)

	function handleRowClick() {
		const path =
			player.type === 'member'
				? `/crew/members/${player.id}`
				: `/crew/phantoms/${player.id}`
		goto(path)
	}

	function handleDropdownClick(event: MouseEvent) {
		event.stopPropagation()
	}
</script>

<li
	class="player-item"
	class:retired={player.isRetired}
	onclick={handleRowClick}
	onkeydown={(e) => e.key === 'Enter' && handleRowClick()}
	role="button"
	tabindex="0"
>
	<div class="player-info">
		<span class="player-rank">{rank}</span>
		<span class="player-name">{player.name}{#if isTopFive}<span class="star">★</span>{/if}</span>
		{#if player.isRetired}
			<span class="player-badge retired">Retired</span>
		{/if}
		{#if isExcused}
			<span class="player-badge excused">Excused</span>
		{/if}
	</div>
	{#if player.type === 'phantom'}
		<span class="player-type">Phantom</span>
	{/if}
	<div class="player-actions">
		<span class="player-score">{formatScore(player.totalScore)}</span>
		{#if isOfficer && hasScores}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div onclick={handleDropdownClick}>
				<DropdownMenu>
					{#snippet trigger({ props })}
						<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
					{/snippet}
					{#snippet menu()}
						<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onEditScore}>
							Edit score...
						</DropdownMenuBase.Item>
					{/snippet}
				</DropdownMenu>
			</div>
		{/if}
	</div>
</li>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.player-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;
		cursor: pointer;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring-color, #3b82f6);
			outline-offset: 2px;
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.player-rank {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		min-width: 24px;
	}

	.player-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		.star {
			color: #f5a623;
			margin-left: 4px;
		}
	}

	.player-badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;

		&.phantom {
			background: var(--color-purple-light, #ede9fe);
			color: var(--color-purple-dark, #7c3aed);
		}

		&.retired {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.excused {
			background: var(--color-yellow-light, #fef9c3);
			color: var(--color-yellow-dark, #854d0e);
		}
	}

	.player-type {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin-left: auto;
		margin-right: spacing.$unit;
	}

	.player-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.player-score {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		font-variant-numeric: tabular-nums;
		min-width: 108px;
		text-align: right;
	}
</style>
