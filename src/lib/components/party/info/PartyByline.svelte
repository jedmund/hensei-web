<script lang="ts">
	/**
	 * The line under a party's name: who it's by (see partyByline), then its
	 * visibility when not public and when it was last updated.
	 */
	import * as m from '$lib/paraglide/messages'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { formatRelativeTime } from '$lib/utils/date'
	import { PartyVisibility } from '$lib/types/visibility'
	import { partyByline, type BylineParty } from './partyByline'

	interface Props extends BylineParty {
		visibility?: PartyVisibility | undefined
		updatedAt?: string | undefined
	}

	let { user, sourceParty, collectionSourceUser, visibility, updatedAt }: Props = $props()

	const byline = $derived(partyByline({ user, sourceParty, collectionSourceUser }))
	const visibilityLabel = $derived(
		visibility === PartyVisibility.UNLISTED
			? m.visibility_unlisted()
			: visibility === PartyVisibility.PRIVATE
				? m.visibility_private()
				: null
	)
	const relativeTime = $derived(
		updatedAt ? m.time_last_updated({ time: formatRelativeTime(updatedAt) }) : null
	)
</script>

{#snippet meta()}
	{#if visibilityLabel}
		<span class="visibility-label">&nbsp;&middot;&nbsp;{visibilityLabel}</span>
	{/if}
	{#if relativeTime}
		<span class="updated-time">&nbsp;&middot;&nbsp;{relativeTime}</span>
	{/if}
{/snippet}

{#if byline?.kind === 'pair'}
	<div class="creator-pair-line">
		<AvatarPair back={byline.back} front={byline.front} size={24} />
		<span class="creator-pair-text">{byline.text}</span>
		{@render meta()}
	</div>
{:else if byline?.kind === 'link'}
	<div class="creator-line">
		<a href={localizeHref(`/${byline.user.username}`)} class="creator-link">
			<div class="avatar-wrapper {byline.user.avatar?.element || ''}">
				{#if byline.user.avatar?.picture}
					<img
						class="avatar"
						alt={`Avatar of ${byline.user.username}`}
						src={getAvatarSrc(byline.user.avatar.picture)}
						srcset={getAvatarSrcSet(byline.user.avatar.picture)}
						width="24"
						height="24"
					/>
				{:else}
					<div class="avatar-placeholder" aria-hidden="true"></div>
				{/if}
			</div>
			<span class="username">{byline.text}</span>
		</a>
		{@render meta()}
	</div>
{:else if byline?.kind === 'plain'}
	<div class="creator-line">
		<span class="anonymous-remix">{byline.text}</span>
		{@render meta()}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

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

	.anonymous-remix,
	.creator-pair-text {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}
</style>
