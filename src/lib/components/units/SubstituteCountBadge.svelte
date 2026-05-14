<script lang="ts">
	/**
	 * Inline circular count badge appended to a unit's name. Shows how many
	 * substitutes the slot has configured; renders nothing when there are
	 * none. Sized to sit alongside body text, not as an image overlay.
	 */
	interface Props {
		count: number
	}

	let { count }: Props = $props()
</script>

{#if count > 0}
	<span class="substitute-count-badge" title="{count} substitute{count === 1 ? '' : 's'}">
		{count}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.substitute-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 16px;
		height: 16px;
		padding: 0 spacing.$unit-half;
		border-radius: 999px;
		background: var(--button-contained-bg);
		color: var(--text-secondary);
		font-size: typography.$font-tiny;
		font-weight: 600;
		line-height: 1;
		vertical-align: middle;
	}
</style>
