<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		/** Adds vertical padding around the card */
		padded?: boolean
		/** Let content (e.g. sticky columns, tooltips) overflow the card */
		overflow?: 'hidden' | 'visible'
		children: Snippet
	}

	const { padded = false, overflow = 'hidden', children }: Props = $props()
</script>

<div class="page" class:padded>
	<div class="card" class:overflow-visible={overflow === 'visible'}>
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);

		&.padded {
			padding: spacing.$unit-2x 0;
		}
	}

	.card {
		@include layout.page-surface;
		overflow: hidden;

		&.overflow-visible {
			overflow: visible;
		}
	}
</style>
