<script lang="ts">
	import type { Snippet } from 'svelte'
	import { page } from '$app/state'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { setLegalContext } from './legalContext'

	interface Props {
		title: string
		/** ISO date (YYYY-MM-DD) the current version took effect. */
		effectiveDate: string
		/** Plain-language lead-in shown above the sections. */
		intro?: Snippet
		children: Snippet
	}

	let { title, effectiveDate, intro, children }: Props = $props()

	// `?view=full` opens straight to the legal text, for links handed to
	// reviewers (Google, the Chrome Web Store).
	let view = $state(page.url.searchParams.get('view') === 'full' ? 'full' : 'summary')

	setLegalContext({
		get showFull() {
			return view === 'full'
		}
	})

	const formattedDate = $derived(
		new Date(`${effectiveDate}T00:00:00Z`).toLocaleDateString(getLocale(), {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC'
		})
	)
</script>

<article class="legal-document">
	<header>
		<div class="heading">
			<h1>{title}</h1>
			<p class="effective">{m.legal_effective_date({ date: formattedDate })}</p>
			{#if getLocale() !== 'en'}
				<p class="notice">{m.legal_english_only()}</p>
			{/if}
		</div>

		<SegmentedControl
			value={view}
			onValueChange={(value) => (view = value)}
			variant="background"
			size="small"
		>
			<Segment value="summary">{m.legal_view_summary()}</Segment>
			<Segment value="full">{m.legal_view_full()}</Segment>
		</SegmentedControl>
	</header>

	{#if intro}
		<div class="intro">{@render intro()}</div>
	{/if}

	{@render children()}
</article>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.legal-document {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;

		:global(p),
		:global(li) {
			font-size: $font-regular;
			line-height: 1.5;
			color: var(--text-primary);
		}

		:global(ul),
		:global(ol) {
			list-style: disc;
			padding-left: $unit-3x;
			display: flex;
			flex-direction: column;
			gap: $unit-half;
		}

		:global(ol) {
			list-style: decimal;
		}

		:global(a) {
			color: var(--accent-blue);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: $unit-2x;
	}

	.heading {
		display: flex;
		flex-direction: column;
		gap: $unit-half;

		h1 {
			font-size: $font-xlarge;
			font-weight: $bold;
			color: var(--text-primary);
		}

		.effective,
		.notice {
			font-size: $font-small;
			color: var(--text-secondary);
		}
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}
</style>
