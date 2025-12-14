<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		/** Main title text */
		title: string
		/** Optional subtitle (e.g., gamertag) */
		subtitle?: string | undefined
		/** Optional description text */
		description?: string | undefined
		/** Content rendered below title (e.g., filter tabs) */
		belowTitle?: Snippet | undefined
		/** Action buttons on the right */
		actions?: Snippet | undefined
	}

	const { title, subtitle, description, belowTitle, actions }: Props = $props()
</script>

<div class="section-header">
	<div class="header-info">
		<div class="title-row">
			<span class="header-title">{title}</span>
			{#if subtitle}
				<span class="header-subtitle">[{subtitle}]</span>
			{/if}
		</div>
		{#if description}
			<p class="header-description">{description}</p>
		{/if}
		{#if belowTitle}
			{@render belowTitle()}
		{/if}
	</div>
	{#if actions}
		<div class="header-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.header-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		gap: spacing.$unit;
	}

	.header-title {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
	}

	.header-subtitle {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.header-description {
		color: var(--text-secondary);
		font-size: typography.$font-small;
		line-height: 1.5;
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}
</style>
