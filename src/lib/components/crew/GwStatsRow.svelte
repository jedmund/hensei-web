<script lang="ts">
	export interface GwStat {
		value: string | number
		label: string
	}

	interface Props {
		stats: GwStat[]
	}

	const { stats }: Props = $props()
</script>

<div class="stats-row">
	{#each stats as stat (stat.label)}
		<div class="stat">
			<span class="stat-value">{stat.value}</span>
			<span class="stat-label">{stat.label}</span>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.stats-row {
		display: flex;
		border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: spacing.$unit-2x;
		border-right: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));

		&:last-child {
			border-right: none;
		}
	}

	.stat-value {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		margin-bottom: 2px;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
