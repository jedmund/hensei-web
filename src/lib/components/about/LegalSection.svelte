<script lang="ts">
	import type { Snippet } from 'svelte'
	import { getLegalContext } from './legalContext'

	interface Props {
		/** Anchor id, so sections can be linked to. */
		id: string
		/** Optional: an opening section can go without a heading. */
		title?: string
		/** The plain-language explanation, always shown. */
		summary: Snippet
		/** The legal text, shown when the document is in full view. */
		children: Snippet
	}

	let { id, title, summary, children }: Props = $props()

	const legal = getLegalContext()
</script>

<section {id} class="legal-section">
	{#if title}
		<h2><a href="#{id}">{title}</a></h2>
	{/if}
	<div class="summary">{@render summary()}</div>
	<!-- Hidden rather than removed, so the full text is always in the page. -->
	<div class="full" hidden={!legal.showFull}>{@render children()}</div>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.legal-section {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		scroll-margin-top: $unit-10x;
	}

	h2 {
		font-size: $font-large;
		font-weight: $bold;

		a {
			color: var(--text-primary) !important;
		}
	}

	.summary,
	.full {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.full {
		padding: $unit-2x;
		border-radius: $input-corner;
		background: var(--button-bg, rgba(128, 128, 128, 0.12));

		&[hidden] {
			display: none;
		}

		:global(p),
		:global(li) {
			font-size: $font-small;
			color: var(--text-secondary);
		}

		:global(h3) {
			font-size: $font-small;
			font-weight: $bold;
			color: var(--text-primary);
		}
	}
</style>
