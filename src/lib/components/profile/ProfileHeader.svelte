<script lang="ts">
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	interface Props {
		username: string
		avatarPicture?: string
		title?: string
		activeTab: 'teams' | 'favorites' | 'collection'
		isOwner?: boolean
	}

	let { username, avatarPicture = '', title, activeTab, isOwner = false }: Props = $props()

	const avatarSrc = $derived(getAvatarSrc(avatarPicture))
	const avatarSrcSet = $derived(getAvatarSrcSet(avatarPicture))
	const displayTitle = $derived(title || username)
</script>

<header class="header">
	{#if avatarPicture}
		<img
			class="avatar"
			alt={`Avatar of ${username}`}
			src={avatarSrc}
			srcset={avatarSrcSet}
			width="64"
			height="64"
		/>
	{:else}
		<div class="avatar" aria-hidden="true"></div>
	{/if}
	<div class="header-content">
		<h1>{displayTitle}</h1>
		<nav class="tabs" aria-label="Profile sections">
			<a
				class:active={activeTab === 'teams' || activeTab === 'favorites'}
				href="/{username}"
				data-sveltekit-preload-data="hover"
			>
				Teams
			</a>
			{#if isOwner}
				<a
					class:active={activeTab === 'favorites'}
					href="/{username}?tab=favorites"
					data-sveltekit-preload-data="hover"
				>
					Favorites
				</a>
			{/if}
			<a
				class:active={activeTab === 'collection'}
				href="/{username}/collection/characters"
				data-sveltekit-preload-data="hover"
			>
				Collection
			</a>
		</nav>
	</div>
</header>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;

	.header {
		background: var(--card-bg);
		border-radius: $card-corner;
		padding: $unit-2x;
		display: flex;
		align-items: center;
		gap: $unit-2x;
		margin-bottom: $unit-2x;
	}

	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: $grey-80;
		border: 1px solid $grey-75;
		object-fit: cover;
		flex-shrink: 0;
	}

	.header-content {
		flex: 1;
	}

	h1 {
		margin: 0 0 $unit-half;
		font-size: 24px;
	}

	.tabs {
		display: flex;
		gap: $unit-2x;
	}

	.tabs a {
		text-decoration: none;
		color: var(--text-secondary);
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;

		&:hover {
			color: var(--text-primary);
		}

		&.active {
			border-color: var(--accent-color, #3366ff);
			color: var(--accent-color, #3366ff);
		}
	}
</style>
