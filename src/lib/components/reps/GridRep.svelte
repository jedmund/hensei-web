<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Party } from '$lib/types/api/party'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import SummonRep from '$lib/components/reps/SummonRep.svelte'
	import CharacterRep from '$lib/components/reps/CharacterRep.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import StickerLabels from '$lib/components/stickers/StickerLabels.svelte'
	import { formatRelativeTime } from '$lib/utils/date'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { localizedName } from '$lib/utils/locale'
	import { getJobIconUrl } from '$lib/utils/jobUtils'
	import { getAvatarSrc } from '$lib/utils/avatar'
	import { getDefaultRepView } from '$lib/stores/defaultRepView.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		party: Party
		href?: string
		loading?: boolean
		disabled?: boolean
		dimmed?: boolean
		showUser?: boolean
		indicator?: Snippet
		/** Show the raid name; when false, show when the team was last updated */
		showRaid?: boolean
		/** Rendered below the grid preview, e.g. a staff-pick note */
		footer?: Snippet
		/** For reps inside a card: a light stroke and no minimum width */
		outlined?: boolean
	}

	let {
		party,
		href: hrefProp,
		loading = false,
		disabled = false,
		dimmed = false,
		showUser = true,
		indicator,
		showRaid = true,
		footer,
		outlined = false
	}: Props = $props()

	const updatedAt = $derived(party.lastUpdated ?? party.updatedAt)

	type RepView = 'weapons' | 'summons' | 'characters'

	const defaultRepView = getDefaultRepView()
	// eslint-disable-next-line svelte/prefer-writable-derived -- $derived.writable not available in Svelte 5
	let currentView: RepView = $state(defaultRepView.value as RepView)

	// Sync when the user changes their default in settings
	$effect(() => {
		currentView = defaultRepView.value as RepView
	})

	const VIEWS: { view: RepView; label: () => string }[] = [
		{ view: 'characters', label: () => m.nav_characters() },
		{ view: 'weapons', label: () => m.nav_weapons() },
		{ view: 'summons', label: () => m.nav_summons() }
	]

	let href = $derived(
		hrefProp ??
			localizeHref(
				currentView === 'weapons'
					? `/teams/${party.shortcode}`
					: `/teams/${party.shortcode}/${currentView}`
			)
	)

	const tag = $derived(disabled ? 'div' : 'a')

	function displayName(input: unknown): string {
		if (!input) return '—'
		const obj = input as Record<string, unknown>
		const maybe = obj.name ?? input
		if (typeof maybe === 'string') return maybe
		return localizedName(maybe as string)
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={`gridRep ${loading ? 'hidden' : 'visible'}`}
	class:disabled
	class:dimmed
	class:outlined
	role={disabled ? undefined : 'link'}
	tabindex={disabled ? undefined : 0}
	onpointerleave={(e) => {
		// Only a mouse leaving resets the view; on touch screens the pills switch it
		if (e.pointerType === 'mouse') currentView = defaultRepView.value as RepView
	}}
>
	<svelte:element
		this={tag}
		class="inner"
		href={disabled ? undefined : href}
		data-sveltekit-preload-data={disabled ? undefined : 'hover'}
	>
		<div class="info">
			<div class="name-row">
				{#if indicator}
					{@render indicator()}
				{/if}
				<h2 class:empty={!party.name}>{party.name || m.grid_untitled()}</h2>
				<StickerLabels labels={party.labels} size={32} />
			</div>
			{#if showUser}
				{#if party.user}
					<div class="user-row">
						<span class="user-link">
							{#if party.user.avatar?.picture}
								<img
									class="user-avatar"
									src={getAvatarSrc(party.user.avatar.picture)}
									alt=""
									width="20"
									height="20"
									loading="lazy"
								/>
							{:else}
								<div class="user-avatar-placeholder" aria-hidden="true"></div>
							{/if}
							<span class="user-name">{party.user.displayName ?? party.user.username}</span>
						</span>
					</div>
				{:else}
					<div class="user-row">
						<span class="user-link">
							<img
								class="user-avatar"
								src={getAvatarSrc('npc')}
								alt=""
								width="20"
								height="20"
								loading="lazy"
							/>
							<span class="user-name">{m.grid_anonymous()}</span>
						</span>
					</div>
				{/if}
			{/if}
			<div class="details">
				<div class="details-text">
					{#if party.job}
						<Tooltip content={displayName(party.job)}>
							<img
								class="job-icon"
								src={getJobIconUrl(party.job.granblueId)}
								alt=""
								loading="lazy"
							/>
						</Tooltip>
					{/if}
					{#if showRaid}
						<span class={`raid ${!party.raid ? 'empty' : ''}`}
							>{party.raid ? displayName(party.raid) : m.grid_no_raid()}</span
						>
					{:else if updatedAt}
						<span class="raid">{formatRelativeTime(updatedAt)}</span>
					{/if}
				</div>

				<div class="pills">
					{#if party.chargeAttack}
						<Tooltip content={m.filter_charge_attack()}>
							<span class="pill chargeAttack">
								<Icon name="charge-attack" size={16} />
							</span>
						</Tooltip>
					{/if}
					{#if party.fullAuto}
						<Tooltip content={m.filter_full_auto()}>
							<span class="pill fullAuto">
								<Icon name="full-auto" size={16} />
							</span>
						</Tooltip>
					{/if}
					{#if party.raid?.extra}
						<Tooltip content={m.grid_extra()}>
							<span class="pill extra">
								<Icon name="extra-grid" size={16} />
							</span>
						</Tooltip>
					{/if}
				</div>
			</div>
		</div>
		<div class="gridContainer">
			{#if currentView === 'characters'}
				<div class="characterGrid">
					<CharacterRep {party} unlimited={party.raid?.group?.unlimited} />
				</div>
			{:else if currentView === 'summons'}
				<div class="summonGrid"><SummonRep {party} extendedView={true} /></div>
			{:else}
				<div class="weaponGrid"><WeaponRep {party} /></div>
			{/if}
		</div>
		{#if footer}
			<div class="footer">{@render footer()}</div>
		{/if}
	</svelte:element>
	<!-- The view pills sit over the bottom of the card but outside its link, so
	     they're real buttons: hover (or tap, on touch screens) switches the view
	     without opening the team -->
	<ul class="indicators">
		{#each VIEWS as { view, label } (view)}
			<li>
				<button
					type="button"
					class:active={currentView === view}
					aria-pressed={currentView === view}
					aria-label={label()}
					onmouseenter={() => (currentView = view)}
					onclick={() => (currentView = view)}
				>
					<span class="indicator"></span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/typography' as typography;

	// The card: its box (background, border, corners) is here, around the
	// team link and the view pills below it
	.gridRep {
		box-sizing: border-box;
		min-width: 262px;
		position: relative;
		width: 100%;
		height: 100%;
		opacity: 1;
		display: grid;
		grid-template-rows: 1fr auto;
		border: 1px solid transparent;
		border-radius: layout.$card-corner;
		// Also the image covers' color (see .gridContainer)
		--rep-bg: var(--card-bg);
		background: var(--rep-bg);
		overflow: hidden;

		// Hover effects only where there's a real pointer: on touch screens
		// a tap leaves :hover stuck on the card
		@media (hover: hover) {
			&:hover {
				--rep-bg: var(--grid-rep-hover);
				box-shadow:
					0 0 0 1px rgba(0, 0, 0, 0.1),
					effects.$card-elevation;
			}

			&:hover .indicators {
				opacity: 1;
			}

			&:hover .name-row :global(.sticker-labels) {
				scale: 1;
				filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.18))
					drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
			}
		}

		// Keyboard focus on the link rings the whole card
		&:has(.inner:focus-visible) {
			outline: 2px solid var(--accent-blue-focus);
			outline-offset: 2px;
		}

		// Keyboard focus anywhere in the card shows the pills (a tap doesn't)
		&:has(:focus-visible) .indicators {
			opacity: 1;
		}

		&.visible {
			transition: opacity 0.3s ease-in-out;
			opacity: 1;
		}

		&.hidden {
			opacity: 0;
			transition: opacity 0.12s ease-in-out;
		}

		&.disabled .inner {
			cursor: default;
		}

		&.dimmed {
			.info h2,
			.info .details,
			.gridContainer,
			.indicators {
				opacity: 0.7;
			}
		}

		// The team link: everything but the pills, with the card's padding on
		// the top and sides so the whole card opens the team
		.inner {
			display: grid;
			grid-template-rows: auto 1fr;
			gap: spacing.$unit;
			padding: spacing.$unit spacing.$unit 0;
			text-decoration: none;
			color: inherit;
			min-width: 0;
			box-sizing: border-box;
			user-select: none;

			&:focus-visible {
				outline: none;
			}

			&:focus-visible .name-row :global(.sticker-labels) {
				scale: 1;
				filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.18))
					drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
			}
		}
	}

	.gridContainer {
		// The card's images don't fade in themselves: in iOS Safari an opacity
		// animation moves an image onto its own layer, snapped to whole pixels,
		// so the images shifted a few pixels as they faded in (and on every
		// view switch). Instead each image appears at once under a cover in the
		// card's background, and the cover fades out; a flat color moving by a
		// pixel doesn't show. Every rep image sits directly in a slot wrapper.
		:global(img[data-fade='in']) {
			animation: none;
		}

		:global(*:has(> img[data-fade='in'])) {
			position: relative;
		}

		:global(*:has(> img[data-fade='in'])::after) {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			// Fades by color, not opacity: an opacity animation would put the
			// slot (and its image) on a pixel-snapped layer again
			background-color: transparent;
			animation: rep-image-cover 0.2s ease;

			@media (prefers-reduced-motion: reduce) {
				animation: none;
			}
		}

		/* Reserve a constant visual height for all reps; keeps card height stable */
		aspect-ratio: calc(#{rep.$rep-body-ratio} / 1);
		width: 100%;
		align-self: start;
		overflow: hidden;
	}

	/* inner wrappers simply fill; specific geometry lives inside reps */
	.weaponGrid,
	.characterGrid,
	.summonGrid {
		width: 100%;
		height: 100%;
	}

	// Inside a card the reps sit on the card's own background, so they need
	// a stroke, and the card's padding leaves less room than a full-width grid
	.gridRep.outlined {
		min-width: 0;

		border-color: var(--grid-border-color);
	}

	.footer {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		line-height: 1.4;
		border-top: 1px solid var(--border-subtle);
		padding-top: spacing.$unit;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		padding: spacing.$unit-half 0;
		min-width: 0; /* Critical: allows flex child to shrink below content size */

		.name-row {
			display: flex;
			align-items: center;
			gap: spacing.$unit-half;
			min-width: 0;

			// At the card's right edge. Taller than the name, so they overhang the
			// row rather than grow it, keeping cards with and without stickers the
			// same height. Drawn at full size and shrunk at rest, so they stay
			// sharp when they grow on hover; they grow from their center, out
			// into the card's padding.
			:global(.sticker-labels) {
				margin-block: -6px;
				margin-inline: auto -4px;
				scale: 0.75;
				transition:
					scale 0.15s ease,
					filter 0.15s ease;

				@media (prefers-reduced-motion: reduce) {
					transition: none;
				}
			}
		}

		h2 {
			color: var(--text-primary);
			font-size: 1.6rem;
			font-weight: typography.$bold;
			overflow: hidden;
			padding-bottom: 1px;
			text-overflow: ellipsis;
			white-space: nowrap;
			margin: 0;
			line-height: 1.2;

			&.empty {
				color: var(--text-tertiary);
			}
		}

		.user-row {
			min-width: 0;
		}

		.user-link {
			display: inline-flex;
			align-items: center;
			gap: spacing.$unit-half;
			color: var(--text-secondary);
			min-width: 0;
			max-width: 100%;
		}

		.user-avatar {
			width: 20px;
			height: 20px;
			border-radius: 50%;
			object-fit: cover;
			flex-shrink: 0;
			background: var(--button-bg);
		}

		.user-avatar-placeholder {
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: var(--button-bg);
			flex-shrink: 0;
		}

		.user-name {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.details {
			display: flex;
			flex-direction: row;
			gap: spacing.$unit;
			justify-content: space-between;
			min-width: 0;
		}

		.details-text {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: spacing.$unit-half;
			overflow: hidden;
			flex: 0 1 auto;
			min-width: 0;

			.job-icon {
				width: 20px;
				height: 20px;
				object-fit: contain;
				flex-shrink: 0;
			}
		}

		.raid {
			color: var(--text-secondary);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			&.empty {
				color: var(--text-tertiary);
			}
		}

		.pills {
			flex-shrink: 0;
			display: inline-flex;
			align-items: center;
			gap: spacing.$unit-fourth;

			.pill {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 0 spacing.$unit-half;
				border-radius: layout.$full-corner;
				flex-shrink: 0;

				&.chargeAttack {
					background-color: var(--charge-attack-bg);
					color: var(--charge-attack-text);
				}

				&.fullAuto {
					background-color: var(--full-auto-bg);
					color: var(--full-auto-text);
				}

				&.extra {
					background-color: var(--extra-purple-bg);
					color: var(--extra-purple-text);
				}
			}
		}
	}

	// The view pills, below the team link (see the markup)
	.indicators {
		display: flex;
		flex-direction: row;
		gap: spacing.$unit;
		justify-content: center;
		margin: 0;
		padding: spacing.$unit;
		opacity: 0;
		list-style: none;

		li {
			flex-grow: 1;
			display: flex;
		}

		button {
			flex: 1;
			display: flex;
			align-items: center;
			padding: 0;
			border: none;
			background: none;
			cursor: pointer;

			&.active .indicator {
				background-color: var(--text-secondary);
			}

			@media (hover: hover) {
				&:hover .indicator {
					background-color: var(--text-secondary);
				}
			}

			&:focus-visible {
				outline: 2px solid var(--accent-blue-focus);
				outline-offset: 2px;
				border-radius: spacing.$unit-half;
			}
		}

		.indicator {
			flex: 1;
			transition: background-color 0.12s ease-in-out;
			height: spacing.$unit;
			border-radius: spacing.$unit-half;
			background-color: var(--indicator-bg);
		}

		// Touch screens: always shown and quieter, tapped to switch the view.
		// Each pill's hit area is taller than the pill itself.
		@media (hover: none) {
			opacity: 0.6;

			button {
				padding-block: spacing.$unit;
				margin-block: calc(-1 * #{spacing.$unit});
			}
		}
	}

	@keyframes rep-image-cover {
		from {
			background-color: var(--rep-bg);
		}
	}

	/* Visually hidden, accessible to screen readers */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
