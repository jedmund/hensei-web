<script lang="ts">
	import type { Snippet } from 'svelte'
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	interface Props {
		name?: string
		description?: string
		user?: {
			username?: string
			avatar?: {
				picture?: string | null
				element?: string | null
			} | null
		} | null
		canEdit?: boolean
		onOpenDescription: () => void
		onOpenEdit?: () => void
		/** Slot for the dropdown menu */
		menu?: Snippet
	}

	let {
		name,
		description,
		user,
		canEdit = false,
		onOpenDescription,
		onOpenEdit,
		menu
	}: Props = $props()

	const avatarSrc = $derived(getAvatarSrc(user?.avatar?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(user?.avatar?.picture))
</script>

<div class="description-tile">
	<!-- Header: Title + Actions -->
	<div class="tile-header-container">
		<div class="tile-header">
			<h1 class="party-name">{name || '(untitled party)'}</h1>
			<div class="actions">
				{#if canEdit}
					<Button variant="secondary" size="small" onclick={onOpenEdit}>Edit</Button>
				{/if}
				{#if menu}
					{@render menu()}
				{/if}
			</div>
		</div>

		<!-- Creator info -->
		{#if user}
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
		{#if description}
			<DescriptionRenderer content={description} truncate={true} maxLines={3} />
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

	.description-content {
		padding: $unit;
		margin: 0 (-$unit);
		background: transparent;
		border: none;
		border-radius: $item-corner;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}
	}

	.empty-state {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
