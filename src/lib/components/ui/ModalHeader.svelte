<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		/** Plain-text subtitle. Use `description` snippet for richer content. */
		descriptionText?: string
		description?: Snippet | string
		children?: Snippet
		/** Shadow under the header, e.g. while the body is scrolled down */
		showShadow?: boolean
	}

	let { title, descriptionText, description, children, showShadow = false }: Props = $props()

	const descriptionString = $derived(
		typeof description === 'string' ? description : (descriptionText ?? undefined)
	)
	const descriptionSnippet = $derived(typeof description === 'function' ? description : undefined)
</script>

<div class="modal-header" class:shadow={showShadow}>
	<div class="header-text">
		<h2 class="title">{title}</h2>
		{#if descriptionSnippet}
			<div class="description">{@render descriptionSnippet()}</div>
		{:else if descriptionString}
			<p class="description">{descriptionString}</p>
		{/if}
	</div>
	{#if children}
		{@render children()}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit-2x;
		padding-bottom: spacing.$unit;
		position: relative;
		z-index: 1;
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		// Same shadow as ModalFooter's, facing down
		&.shadow {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

			:global(html[data-theme='dark']) & {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.title {
		font-size: typography.$font-large;
		font-weight: typography.$bold;
		margin: 0;
		color: var(--text-primary);
	}

	.description {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
	}
</style>
