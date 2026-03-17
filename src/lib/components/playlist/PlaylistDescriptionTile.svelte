<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { User } from '$lib/types/api/entities'
	import Icon from '$lib/components/Icon.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { formatRelativeTime } from '$lib/utils/date'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		title: string
		description?: string
		backHref?: string
		user?: User | null
		updatedAt?: string
		menu?: Snippet
	}

	let { title, description, backHref, user, updatedAt, menu }: Props = $props()

	const relativeTime = $derived(updatedAt ? formatRelativeTime(updatedAt) : null)
</script>

<div class="description-tile">
	<div class="tile-header">
		<div class="title-row">
			{#if backHref}
				<a class="back-link" href={localizeHref(backHref)}>
					<Icon name="arrow-left" size={16} />
				</a>
			{/if}
			<h1>{title}</h1>
		</div>
		{#if menu}
			<div class="actions">
				{@render menu()}
			</div>
		{/if}
	</div>

	{#if description}
		<p class="description">{description}</p>
	{/if}

	{#if user}
		<div class="attribution">
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
				<span class="username">{user.username}</span>
			</a>
			{#if relativeTime}
				<span class="separator">&middot;</span>
				<span class="updated">{m.playlist_updated({ time: relativeTime })}</span>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.description-tile {
		background: var(--card-bg);
		border: 0.5px solid var(--button-bg);
		border-radius: $card-corner;
		padding: $unit-2x;
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.tile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: $unit;
		flex: 1;
		min-width: 0;
	}

	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		color: var(--text-secondary);
		text-decoration: none;
		flex-shrink: 0;
		transition: background-color 0.15s ease, color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
			color: var(--text-primary);
		}
	}

	h1 {
		margin: 0;
		font-size: $font-large;
		font-weight: $medium;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: $unit;
		flex-shrink: 0;
	}

	.description {
		margin: 0;
		font-size: $font-regular;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.attribution {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.creator-link {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		text-decoration: none;
		color: var(--text-secondary);

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

	.separator {
		color: var(--text-tertiary);
	}

	.updated {
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
