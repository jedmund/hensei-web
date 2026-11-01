<script lang="ts">
	interface Props {
		title: string
		/** Optional count shown after the title */
		count?: number | undefined
		/** Which edge carries the rule line */
		rule?: 'top' | 'bottom'
	}

	const { title, count, rule = 'bottom' }: Props = $props()
</script>

<div class="section-header" class:rule-top={rule === 'top'}>
	<span class="section-title"
		>{title}{count !== undefined ? ' ' : ''}{#if count !== undefined}<span class="count"
				>{count}</span
			>{/if}</span
	>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);

		&.rule-top {
			border-bottom: none;
			border-top: 1px solid rgba(0, 0, 0, 0.06);
		}
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.count {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		font-weight: typography.$normal;
		margin-left: spacing.$unit-half;
	}
</style>
