<script lang="ts">
	import type { MemberFilter } from '$lib/types/api/crew'

	interface Props {
		options: { value: MemberFilter; label: string }[]
		value: MemberFilter
		/** Count badge on the Pending tab; hidden at 0 */
		pendingCount: number
		onChange: (filter: MemberFilter) => void
	}

	const { options, value, pendingCount, onChange }: Props = $props()
</script>

<div class="filter-tabs">
	{#each options as option (option.value)}
		<button
			class="filter-tab"
			class:active={value === option.value}
			onclick={() => onChange(option.value)}
		>
			{option.label}
			{#if option.value === 'pending' && pendingCount > 0}
				<span class="tab-badge">{pendingCount}</span>
			{/if}
		</button>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.filter-tabs {
		display: flex;
		gap: spacing.$unit-half;
		padding: spacing.$unit-2x spacing.$unit-2x spacing.$unit;
	}

	.filter-tab {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: 4px spacing.$unit;
		background: none;
		border: none;
		border-radius: layout.$item-corner-small;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: typography.$font-small;
		transition:
			color 0.15s,
			background-color 0.15s;

		&:hover {
			color: var(--text-primary);
			background: rgba(0, 0, 0, 0.04);
		}

		&.active {
			color: var(--text-primary);
			background: rgba(0, 0, 0, 0.06);
			font-weight: typography.$medium;
		}
	}

	.tab-badge {
		background: var(--color-orange, #f97316);
		color: white;
		font-size: 11px;
		font-weight: typography.$medium;
		padding: 1px 6px;
		border-radius: 10px;
	}
</style>
