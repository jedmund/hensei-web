<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { JSONContent } from '@tiptap/core'
	import Button from '$lib/components/ui/Button.svelte'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import CollectionViewerSwitcher from './CollectionViewerSwitcher.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

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
		canEdit?: boolean
		onOpenDescription: () => void
		onOpenEdit?: () => void
		menu?: Snippet
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
		canEdit = false,
		onOpenDescription,
		onOpenEdit,
		menu
	}: Props = $props()

	const showCollectionSwitcher = $derived(
		!!authUser?.username && !!collectionSourceUser?.username &&
		authUser.username !== collectionSourceUser.username
	)

	const avatarSrc = $derived(getAvatarSrc(user?.avatar?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(user?.avatar?.picture))

	// Measure content height to determine if fade gradient is needed
	let contentEl = $state<HTMLDivElement | undefined>(undefined)
	let needsFade = $state(false)

	$effect(() => {
		if (contentEl) {
			// Show fade if content is taller than ~2 lines
			// Based on line-height 1.5 × font-size ~16px × 2 lines ≈ 48px
			needsFade = contentEl.scrollHeight > 48
		}
	})

	/** Extract plain text from first two non-empty paragraphs of TipTap JSON content */
	function getPreviewParagraphs(content?: string): string[] {
		if (!content) return []

		try {
			const json = JSON.parse(content) as JSONContent
			if (json.type !== 'doc' || !json.content?.length) return []

			// Extract text from an inline node (text or mention)
			const getNodeText = (node: JSONContent): string => {
				if (node.type === 'text') return node.text ?? ''
				if (node.type === 'mention') {
					// EntityMention stores name in attrs.id
					const id = node.attrs?.id as { name?: { en?: string }; granblue_en?: string } | undefined
					return id?.name?.en ?? id?.granblue_en ?? ''
				}
				return ''
			}

			// Extract text from a block
			const getBlockText = (block: JSONContent): string =>
				block.content?.map(getNodeText).join('') ?? ''

			// Find first two non-empty paragraphs or headings
			const paragraphs: string[] = []
			for (const node of json.content) {
				if (node.type !== 'paragraph' && node.type !== 'heading') continue
				const text = getBlockText(node).trim()
				if (text) {
					paragraphs.push(text)
					if (paragraphs.length >= 2) break
				}
			}

			return paragraphs
		} catch {
			// Plain text fallback - return first two non-empty lines
			return content.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2)
		}
	}

	const previewParagraphs = $derived(getPreviewParagraphs(description))
</script>

<div class="description-tile" class:has-fade={needsFade}>
	<!-- Header: Title + Actions -->
	<div class="tile-header-container">
		<div class="tile-header">
			<h1 class="party-name" class:empty={!name}>{name || 'Untitled team'}</h1>
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
					<Button variant="secondary" size="small" onclick={onOpenEdit}>Edit</Button>
				{/if}
				{#if menu}
					{@render menu()}
				{/if}
			</div>
		</div>

		<!-- Creator info -->
		{#if user && collectionSourceUser?.username && user.username === collectionSourceUser.username}
			<a href="/{user.username}" class="creator-link">
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
				<span class="username">{user.username} using their collection</span>
			</a>
		{:else if user && collectionSourceUser?.username}
			<div class="creator-pair-line">
				<AvatarPair back={user} front={collectionSourceUser} size={24} />
				<span class="creator-pair-text">
					<a href="/{user.username}">{user.username}</a> using <a href="/{collectionSourceUser.username}">{collectionSourceUser.username}</a>'s collection
				</span>
			</div>
		{:else if user && sourceParty?.user?.username}
			<div class="creator-pair-line">
				<AvatarPair back={sourceParty.user} front={user} size={24} />
				<span class="creator-pair-text">
					<a href="/{user.username}">{user.username}</a> remixed <a href="/{sourceParty.user.username}">{sourceParty.user.username}</a>'s team
				</span>
			</div>
		{:else if user}
			<a href="/{user.username}" class="creator-link">
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
		{/if}
	</div>

	<!-- Description content (clickable) -->
	<button type="button" class="description-content" onclick={onOpenDescription}>
		{#if previewParagraphs.length}
			<div class="preview-text" bind:this={contentEl}>
				{#each previewParagraphs as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		{:else}
			<span class="empty-state">No description</span>
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

		&.has-fade::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 96px;
			background: linear-gradient(to bottom, transparent, var(--card-bg));
			pointer-events: none;
			border-radius: 0 0 $card-corner $card-corner;
		}
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
		font-weight: $bold;
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

	.creator-pair-line {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
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

		p {
			margin: 0 0 $unit-half 0;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	.empty-state {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}

</style>
