<script lang="ts">
	import SupportSummonGrid from '$lib/components/profile/SupportSummonGrid.svelte'
	import type { SupportSummon } from '$lib/types/api/supportSummon'

	interface Props {
		/** Username the card is for. */
		username: string
		/** Owner's display name (falls back to username). */
		displayName?: string | null
		/** All slotted summons (any element + misc). */
		summons: SupportSummon[]
		/** Optional in-game Granblue Fantasy display name the user types in. */
		gbfName?: string | undefined
		/** Optional Granblue Fantasy player ID. */
		gbfId?: string | undefined
		/** Optional URL — typically the user's granblue.team profile. */
		teamUrl?: string | undefined
	}

	let { username, displayName, summons, gbfName, gbfId, teamUrl }: Props = $props()

	const heading = $derived(displayName ?? username)
	const hasMeta = $derived(!!(gbfName || gbfId || teamUrl))
</script>

<!--
	1280×720 canvas with the Granblue sky backdrop and an inset rounded card.
	Layout values are hardcoded to the output size — this component is *only*
	rendered server-side by Playwright at exactly 1280×720, never embedded in
	the live UI, so responsiveness isn't a concern.
-->
<div class="share-card" data-share-card>
	<header class="card-header">
		<div class="title-row">
			<h1 class="title">{heading}</h1>
			<span class="handle">@{username}</span>
		</div>
		{#if hasMeta}
			<dl class="meta">
				{#if gbfName}
					<div class="meta-pair">
						<dt>GBF Name</dt>
						<dd>{gbfName}</dd>
					</div>
				{/if}
				{#if gbfId}
					<div class="meta-pair">
						<dt>GBF ID</dt>
						<dd>{gbfId}</dd>
					</div>
				{/if}
				{#if teamUrl}
					<div class="meta-pair">
						<dt>Profile</dt>
						<dd class="url">{teamUrl}</dd>
					</div>
				{/if}
			</dl>
		{/if}
	</header>

	<div class="card-grid">
		<SupportSummonGrid {summons} isOwner={false} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	// The card itself is inset 24px from the screenshot edge; the surrounding
	// gutter is filled with the sky backdrop painted by the parent route.
	.share-card {
		width: 1232px;
		height: 672px;
		padding: 32px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 24px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 24px;
		// Drop-shadow + subtle white border so the card reads as floating over
		// the sky backdrop.
		box-shadow:
			0 24px 48px rgba(0, 0, 0, 0.18),
			0 0 0 1px rgba(255, 255, 255, 0.45);
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', sans-serif;
		color: #1a1a1a;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		gap: 16px;
		flex-wrap: wrap;
	}

	.title {
		font-size: 36px;
		font-weight: 700;
		line-height: 1.1;
		margin: 0;
	}

	.handle {
		font-size: 18px;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.5);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		margin: 0;
		padding: 0;
	}

	.meta-pair {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-pair dt {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(0, 0, 0, 0.45);
	}

	.meta-pair dd {
		font-size: 16px;
		font-weight: 500;
		margin: 0;
	}

	.meta-pair dd.url {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		font-size: 14px;
	}

	.card-grid {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	// SupportSummonGrid fills the available width.
	.card-grid :global(.support-summon-grid) {
		flex: 1;
	}
</style>
