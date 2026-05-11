<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import type { JSONContent } from '@tiptap/core'
	import Button from '$lib/components/ui/Button.svelte'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CollectionViewerSwitcher from './CollectionViewerSwitcher.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { localizedName } from '$lib/utils/locale'
	import { formatRelativeTime } from '$lib/utils/date'
	import { PartyVisibility } from '$lib/types/visibility'
	import type { PartyDifficulty } from '$lib/types/api/party'

	type AvatarUser = {
		username?: string
		avatar?: {
			picture?: string | null
			element?: string | null
		} | null
	}

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
		visibility?: import('$lib/types/visibility').PartyVisibility
		canEdit?: boolean
		onOpenDescription: () => void
		onEditDescription?: () => void
		onOpenEdit?: () => void
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

	const difficultyPreviewHref = $derived(
		shortcode ? `/database/difficulties?tab=preview&shortcode=${shortcode}` : null
	)

	const showCollectionSwitcher = $derived(
		!!authUser?.username &&
			!!collectionSourceUser?.username &&
			authUser.username !== collectionSourceUser.username
	)

	const avatarSrc = $derived(getAvatarSrc(user?.avatar?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(user?.avatar?.picture))
	const relativeTime = $derived(
		updatedAt ? m.time_last_updated({ time: formatRelativeTime(updatedAt) }) : null
	)
	const visibilityLabel = $derived(
		visibility === PartyVisibility.UNLISTED
			? m.visibility_unlisted()
			: visibility === PartyVisibility.PRIVATE
				? m.visibility_private()
				: null
	)

	// Measure content to determine if "Read more" is needed (text overflows 3 lines)
	let contentEl = $state<HTMLDivElement | undefined>(undefined)
	let needsReadMore = $state(false)

	$effect(() => {
		if (contentEl) {
			needsReadMore = contentEl.scrollHeight > contentEl.clientHeight
		}
	})

	/** Extract inline text from a TipTap node */
	function getNodeText(node: JSONContent): string {
		if (node.type === 'text') return node.text ?? ''
		if (node.type === 'mention') {
			const id = node.attrs?.id as
				| { name?: { en?: string; ja?: string }; granblue_en?: string }
				| undefined
			const name = localizedName(id?.name)
			return name !== '—' ? name : (id?.granblue_en ?? '')
		}
		return ''
	}

	/** Extract text from a block node */
	function getBlockText(block: JSONContent): string {
		return block.content?.map(getNodeText).join('') ?? ''
	}

	/** Extract first paragraph text and whether more content exists */
	function getPreviewData(content?: string): { text: string; hasMore: boolean } {
		if (!content) return { text: '', hasMore: false }

		try {
			const json = JSON.parse(content) as JSONContent
			if (json.type !== 'doc' || !json.content?.length) return { text: '', hasMore: false }

			// Find the first non-empty paragraph or heading
			let firstText = ''
			let firstBlockIndex = -1
			for (let i = 0; i < json.content.length; i++) {
				const node = json.content[i]!
				if (node.type !== 'paragraph' && node.type !== 'heading') continue
				const text = getBlockText(node).trim()
				if (text) {
					firstText = text
					firstBlockIndex = i
					break
				}
			}

			if (!firstText) return { text: '', hasMore: false }

			// Check if there's more content after the first block
			const hasMoreBlocks = json.content.slice(firstBlockIndex + 1).some((node) => {
				if (node.type === 'paragraph' || node.type === 'heading') {
					return getBlockText(node).trim().length > 0
				}
				// Lists, blockquotes, etc. count as more content
				return node.type !== 'paragraph'
			})

			return { text: firstText, hasMore: hasMoreBlocks }
		} catch {
			// Plain text fallback
			const lines = content
				.split('\n')
				.map((l) => l.trim())
				.filter(Boolean)
			return {
				text: lines[0] ?? '',
				hasMore: lines.length > 1
			}
		}
	}

	const preview = $derived(getPreviewData(description))

	// Battle settings tokens
	interface Setting {
		key: string
		label: string
		tooltip: string
		active: boolean
	}

	const settings: Setting[] = $derived([
		{
			key: 'chargeAttack',
			label: `${m.battle_charge_attack()} ${(chargeAttack ?? true) ? m.battle_on() : m.battle_off()}`,
			tooltip: m.battle_charge_attack(),
			active: chargeAttack ?? true
		},
		{
			key: 'fullAuto',
			label: `${m.battle_full_auto()} ${fullAuto ? m.battle_on() : m.battle_off()}`,
			tooltip: m.battle_full_auto(),
			active: fullAuto ?? false
		},
		{
			key: 'autoSummon',
			label: `${m.battle_auto_summon()} ${autoSummon ? m.battle_on() : m.battle_off()}`,
			tooltip: m.battle_auto_summon(),
			active: autoSummon ?? false
		},
		{
			key: 'autoGuard',
			label: `${m.battle_auto_guard()} ${autoGuard ? m.battle_on() : m.battle_off()}`,
			tooltip: m.battle_auto_guard(),
			active: autoGuard ?? false
		}
	])

	function formatClearTime(seconds?: number | null): string | null {
		if (seconds == null || seconds <= 0) return null
		const minutes = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}

	const formattedClearTime = $derived(formatClearTime(clearTime))
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
				{#if menu}
					{@render menu()}
				{/if}
			</div>
		</div>

		<!-- Creator info -->
		{#if user && sourceParty?.user?.username && collectionSourceUser?.username}
			<div class="creator-pair-line">
				<AvatarPair back={sourceParty.user} front={user} size={24} />
				<span class="creator-pair-text">
					{m.party_remixed_with_collection({
						username: user.username ?? '',
						otherUsername: sourceParty.user.username ?? '',
						collectionUsername: collectionSourceUser.username ?? ''
					})}
				</span>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if user && sourceParty?.user?.username}
			<div class="creator-pair-line">
				<AvatarPair back={sourceParty.user} front={user} size={24} />
				<span class="creator-pair-text">
					{m.party_remixed({
						username: user.username ?? '',
						otherUsername: sourceParty.user.username ?? ''
					})}
				</span>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if !user && sourceParty?.user?.username}
			<div class="creator-line">
				<span class="anonymous-remix">
					{m.party_remixed_anonymous({ otherUsername: sourceParty.user.username ?? '' })}
				</span>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if user && sourceParty && !sourceParty.user?.username}
			<div class="creator-line">
				<a href={localizeHref(`/${user.username}`)} class="creator-link">
					<div class="avatar-wrapper {user.avatar?.element || ''}">
						{#if user.avatar?.picture}
							<img
								class="avatar"
								alt={`Avatar of ${user.username}`}
								src={getAvatarSrc(user.avatar.picture)}
								srcset={getAvatarSrcSet(user.avatar.picture)}
								width="24"
								height="24"
							/>
						{:else}
							<div class="avatar-placeholder" aria-hidden="true"></div>
						{/if}
					</div>
					<span class="username"
						>{m.party_remixed_from_anonymous({ username: user.username ?? '' })}</span
					>
				</a>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if !user && sourceParty}
			<div class="creator-line">
				<span class="anonymous-remix">
					{m.party_remixed_anonymous_source()}
				</span>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if user && collectionSourceUser?.username && user.username === collectionSourceUser.username}
			<div class="creator-line">
				<a href={localizeHref(`/${user.username}`)} class="creator-link">
					<div class="avatar-wrapper {user.avatar?.element || ''}">
						{#if user.avatar?.picture}
							<img
								class="avatar"
								alt={`Avatar of ${user.username}`}
								src={getAvatarSrc(user.avatar.picture)}
								srcset={getAvatarSrcSet(user.avatar.picture)}
								width="24"
								height="24"
							/>
						{:else}
							<div class="avatar-placeholder" aria-hidden="true"></div>
						{/if}
					</div>
					<span class="username"
						>{m.party_using_own_collection({ username: user.username ?? '' })}</span
					>
				</a>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if user && collectionSourceUser?.username}
			<div class="creator-pair-line">
				<AvatarPair back={user} front={collectionSourceUser} size={24} />
				<span class="creator-pair-text">
					{m.party_using_others_collection({
						username: user.username ?? '',
						otherUsername: collectionSourceUser.username ?? ''
					})}
				</span>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{:else if user}
			<div class="creator-line">
				<a href={localizeHref(`/${user.username}`)} class="creator-link">
					<div class="avatar-wrapper {user.avatar?.element || ''}">
						{#if user.avatar?.picture}
							<img
								class="avatar"
								alt={`Avatar of ${user.username}`}
								src={avatarSrc}
								srcset={avatarSrcSet}
								width="24"
								height="24"
							/>
						{:else}
							<div class="avatar-placeholder" aria-hidden="true"></div>
						{/if}
					</div>
					<span class="username">{user.username}</span>
				</a>
				{#if visibilityLabel}
					<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
				{/if}
				{#if relativeTime}
					<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Battle settings & performance -->
	<div class="battle-section">
		<div class="settings-tokens">
			{#if difficulty?.tier}
				<Tooltip
					content={m.party_difficulty_tooltip({
						tier: difficulty.tier.name,
						score: difficulty.score?.toFixed(0) ?? '—'
					})}
				>
					{#if isEditor && difficultyPreviewHref}
						<a
							class="token difficulty editor-link"
							style:background={difficulty.tier.color || undefined}
							href={difficultyPreviewHref}
							target="_blank"
							rel="noopener"
						>
							{difficulty.tier.name}
						</a>
					{:else}
						<span class="token difficulty" style:background={difficulty.tier.color || undefined}>
							{difficulty.tier.name}
						</span>
					{/if}
				</Tooltip>
			{/if}
			{#if solo}
				<Tooltip content={m.battle_solo()}>
					<span class="token solo on">{m.battle_solo()}</span>
				</Tooltip>
			{/if}
			{#each settings as setting (setting.key)}
				<Tooltip content={setting.tooltip}>
					<span class="token {setting.key}" class:on={setting.active} class:off={!setting.active}>
						{setting.label}
					</span>
				</Tooltip>
			{/each}
			{#if formattedClearTime}
				<Tooltip content={m.party_edit_clear_time()}>
					<span class="token metric">{formattedClearTime}</span>
				</Tooltip>
			{/if}
			{#if buttonCount != null}
				<Tooltip content={m.party_edit_button_count()}>
					<span class="token metric">{buttonCount}B</span>
				</Tooltip>
			{/if}
			{#if chainCount != null}
				<Tooltip content={m.party_edit_chain_count()}>
					<span class="token metric">{chainCount}C</span>
				</Tooltip>
			{/if}
			{#if summonCount != null}
				<Tooltip content={m.party_edit_summon_count()}>
					<span class="token metric">{summonCount}S</span>
				</Tooltip>
			{/if}
		</div>
	</div>

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

	.creator-line {
		display: inline-flex;
		align-items: center;
		gap: 0;
	}

	.creator-link {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		text-decoration: none;
		color: var(--text-secondary);
		width: fit-content;

		&:hover {
			color: var(--text-primary);

			.username {
				text-decoration: underline;
			}
		}
	}

	.avatar-wrapper {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		overflow: hidden;
		background: var(--button-bg);
		flex-shrink: 0;
	}

	.avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: var(--button-bg);
	}

	.username {
		font-size: $font-small;
		font-weight: $medium;
	}

	.updated-time,
	.visibility-label {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.creator-pair-line {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
	}

	.anonymous-remix {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.creator-pair-text {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);

		a {
			color: inherit;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
				color: var(--text-primary);
			}
		}
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

	// Battle settings & performance
	.battle-section {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.settings-tokens {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
	}

	.token {
		display: inline-flex;
		align-items: center;
		padding: $unit-half $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		font-weight: $bold;
		line-height: 1;
		text-align: center;
		user-select: none;
		background: var(--input-bg);

		&.off {
			background: var(--button-bg);
			color: var(--text-secondary);
		}

		&.metric {
			background: var(--button-bg);
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
		}

		&.difficulty {
			color: #1a1a1a;
		}

		&.editor-link {
			text-decoration: none;
			cursor: pointer;
			transition:
				opacity 120ms ease,
				transform 120ms ease;

			&:hover {
				opacity: 0.85;
			}

			&:focus-visible {
				outline: 2px solid var(--focus-ring);
				outline-offset: 2px;
			}
		}

		&.chargeAttack.on {
			background: var(--charge-attack-bg);
			color: var(--charge-attack-text);
		}

		&.fullAuto.on,
		&.autoSummon.on,
		&.solo.on {
			background: var(--full-auto-bg);
			color: var(--full-auto-text);
		}

		&.autoGuard.on {
			background: var(--auto-guard-bg);
			color: var(--auto-guard-text);
		}
	}
</style>
