<script lang="ts">
	import SupportSummonGrid from '$lib/components/profile/SupportSummonGrid.svelte'
	import type { SupportSummon } from '$lib/types/api/supportSummon'

	interface Props {
		/** Username the card is for. Used as the title's final fallback. */
		username: string
		/** Owner's display name. Used as the title fallback when gbfName is empty. */
		displayName?: string | null
		/** All slotted summons (any element + misc). */
		summons: SupportSummon[]
		/** Granblue Fantasy in-game name — the card's primary title. */
		gbfName?: string | undefined
		/** Granblue Fantasy player ID. */
		gbfId?: string | undefined
		/** granblue.team profile URL. */
		teamUrl?: string | undefined
	}

	let { username, displayName, summons, gbfName, gbfId, teamUrl }: Props = $props()

	const title = $derived(gbfName?.trim() || displayName?.trim() || username)
	const hasMeta = $derived(!!(gbfId || teamUrl))
</script>

<!--
	Inset rounded card. Sized to its content so there's no trailing empty
	space below the grid; the parent backdrop centers it. Playwright
	screenshots `main > *:first-child` which is the backdrop, not this card.
-->
<div class="share-card" data-share-card>
	<header class="card-header">
		<h1 class="title">{title}</h1>
		{#if hasMeta}
			<div class="meta">
				{#if gbfId}
					<span class="meta-item">ID {gbfId}</span>
				{/if}
				{#if gbfId && teamUrl}
					<span class="separator" aria-hidden="true">·</span>
				{/if}
				{#if teamUrl}
					<span class="meta-item url">{teamUrl}</span>
				{/if}
			</div>
		{/if}
	</header>

	<div class="card-grid">
		<SupportSummonGrid {summons} isOwner={false} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.share-card {
		width: 1232px;
		// No fixed height — the card sizes to its content so there's no
		// hollow space below the grid. The parent backdrop is sized to fit
		// (+ a 24px gutter on every side).
		padding: 32px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 24px;
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
		gap: 8px;
	}

	.title {
		font-size: 40px;
		font-weight: 700;
		line-height: 1.1;
		margin: 0;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 16px;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.55);
	}

	.meta-item.url {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		font-size: 15px;
	}

	.separator {
		color: rgba(0, 0, 0, 0.3);
	}

	.card-grid {
		display: flex;
	}

	.card-grid :global(.support-summon-grid) {
		flex: 1;
	}
</style>
