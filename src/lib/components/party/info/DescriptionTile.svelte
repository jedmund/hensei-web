<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CollectionViewerSwitcher from './CollectionViewerSwitcher.svelte'
	import PartyByline from './PartyByline.svelte'
	import PartySettings from './PartySettings.svelte'
	import type { AvatarUser } from '$lib/utils/avatar'
	import { descriptionPreview } from '$lib/utils/descriptionPreview'
	import type { PartyDifficulty } from '$lib/types/api/party'
	import type { PartyVisibility } from '$lib/types/visibility'

	interface Props {
		name?: string
		description?: string
		user?: AvatarUser | null
		collectionSourceUser?: AvatarUser | null
		sourceParty?: {
			shortcode?: string
			name?: string
			user?: AvatarUser | null
		} | null
		/** The currently authenticated user (for collection viewer switcher) */
		authUser?: AvatarUser | null
		/** Which collection is currently being viewed */
		activeCollectionUser?: 'viewer' | 'source'
		/** Callback when collection viewer is switched */
		onSwitchCollectionUser?: (target: 'viewer' | 'source') => void
		updatedAt?: string
		visibility?: PartyVisibility
		canEdit?: boolean
		onOpenDescription: () => void
		onEditDescription?: () => void
		onOpenEdit?: () => void
		onOpenCalculator?: () => void
		menu?: Snippet
		// Battle settings
		fullAuto?: boolean
		solo?: boolean
		autoGuard?: boolean
		autoSummon?: boolean
		chargeAttack?: boolean
		// Performance
		clearTime?: number | null
		buttonCount?: number | null
		chainCount?: number | null
		summonCount?: number | null
		// Computed difficulty assignment (null when not yet scoreable)
		difficulty?: PartyDifficulty | null
		/** Party shortcode, used to build the editor preview link */
		shortcode?: string
		/** When true, the difficulty tier chip becomes a link to the editor preview */
		isEditor?: boolean
	}

	let {
		name,
		description,
		user,
		collectionSourceUser,
		sourceParty,
		authUser,
		activeCollectionUser = 'viewer',
		onSwitchCollectionUser,
		updatedAt,
		visibility,
		canEdit = false,
		onOpenDescription,
		onEditDescription,
		onOpenEdit,
		onOpenCalculator,
		menu,
		fullAuto,
		solo,
		autoGuard,
		autoSummon,
		chargeAttack,
		clearTime,
		buttonCount,
		chainCount,
		summonCount,
		difficulty,
		shortcode,
		isEditor = false
	}: Props = $props()

	const showCollectionSwitcher = $derived(
		!!authUser?.username &&
			!!collectionSourceUser?.username &&
			authUser.username !== collectionSourceUser.username
	)

	// Measure content to determine if "Read more" is needed (text overflows 3 lines)
	let contentEl = $state<HTMLDivElement | undefined>(undefined)
	let needsReadMore = $state(false)

	$effect(() => {
		if (contentEl) {
			needsReadMore = contentEl.scrollHeight > contentEl.clientHeight
		}
	})

	const preview = $derived(descriptionPreview(description))
</script>

<div class="description-tile">
	<!-- Header: Title + Actions -->
	<div class="tile-header-container">
		<div class="tile-header">
			<h1 class="party-name" class:empty={!name}>{name || m.party_untitled()}</h1>
			<div class="actions">
				{#if showCollectionSwitcher && authUser && collectionSourceUser}
					<CollectionViewerSwitcher
						{authUser}
						{collectionSourceUser}
						{activeCollectionUser}
						onSwitchCollectionUser={(v) => onSwitchCollectionUser?.(v)}
					/>
				{/if}
				{#if canEdit}
					<Button variant="secondary" size="small" onclick={onOpenEdit}>{m.action_edit()}</Button>
				{/if}
				{#if onOpenCalculator}
					<Tooltip content={m.calculator_open()}>
						<Button
							variant="ghost"
							size="small"
							iconOnly
							icon="calculator"
							aria-label={m.calculator_open()}
							onclick={onOpenCalculator}
						/>
					</Tooltip>
				{/if}
				{#if menu}
					{@render menu()}
				{/if}
			</div>
		</div>

		<PartyByline {user} {sourceParty} {collectionSourceUser} {visibility} {updatedAt} />
	</div>

	<PartySettings
		{solo}
		{chargeAttack}
		{fullAuto}
		{autoSummon}
		{autoGuard}
		{clearTime}
		{buttonCount}
		{chainCount}
		{summonCount}
		{difficulty}
		{shortcode}
		{isEditor}
	/>

	<!-- Description content (clickable) -->
	<button
		type="button"
		class="description-content"
		onclick={canEdit && !preview.text && onEditDescription ? onEditDescription : onOpenDescription}
	>
		{#if preview.text}
			<div class="preview-text" bind:this={contentEl}>
				<p>
					{preview.text}{#if preview.hasMore || needsReadMore}…&nbsp;<span
							class="read-more"
							style:color={user?.avatar?.element
								? `var(--${user.avatar.element}-ghost-text)`
								: undefined}>{m.description_read_more()}</span
						>{/if}
				</p>
			</div>
		{:else}
			<span class="empty-state"
				>{canEdit ? m.party_write_description() : m.party_no_description()}</span
			>
		{/if}
	</button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.description-tile {
		background: var(--card-bg);
		border: 0.5px solid var(--button-bg);
		border-radius: $card-corner;
		padding: $unit-2x $unit-2x $unit $unit-2x;
		display: flex;
		flex-direction: column;
		gap: $unit;
		overflow: hidden;
		position: relative;
	}

	.tile-header-container {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.tile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.party-name {
		font-size: $font-large;
		font-weight: $medium;
		color: var(--text-primary);
		margin: 0;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.empty {
			color: var(--text-tertiary);
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: $unit-half;
		flex-shrink: 0;
	}

	.description-content {
		padding: $unit;
		margin: 0 (-$unit);
		background: transparent;
		border: none;
		border-radius: $item-corner;
		justify-content: flex-start;
		align-items: flex-start;
		display: flex;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
		min-width: 0;
		width: calc(100% + #{$unit * 2});
		flex: 1;
		overflow: hidden;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}
	}

	.preview-text {
		font-size: $font-regular;
		color: var(--text-secondary);
		overflow: hidden;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;

		p {
			margin: 0;
			display: inline;
		}
	}

	.read-more {
		color: var(--text-tertiary);
		font-weight: $medium;
	}

	.empty-state {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}
</style>
