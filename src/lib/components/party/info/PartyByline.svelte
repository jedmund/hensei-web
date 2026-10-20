<script lang="ts">
	/**
	 * The line under a party's name: who it's by (see partyByline), then its
	 * visibility when not public and when it was last updated.
	 */
	import * as m from '$lib/paraglide/messages'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { formatRelativeTime } from '$lib/utils/date'
	import { PartyVisibility } from '$lib/types/visibility'
	import { partyByline, type BylineParty, type BylineSegment } from './partyByline'

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

{#snippet text(segments: BylineSegment[])}
	<span class="byline-text">
		{#each segments as segment, i (i)}
			{#if segment.href}
				<a href={localizeHref(segment.href)}>{segment.text}</a>
			{:else}
				{segment.text}
			{/if}
		{/each}
	</span>
{/snippet}

{#if byline?.kind === 'pair'}
	<div class="creator-line">
		<AvatarPair back={byline.back} front={byline.front} size={24} />
		{@render text(byline.segments)}
		{@render meta()}
	</div>
{:else if byline?.kind === 'link'}
	<div class="creator-line">
		<a
			href={localizeHref(`/${byline.user.username}`)}
			class="avatar-link"
			aria-label={byline.user.username}
		>
			<UserAvatar user={byline.user} />
		</a>
		{@render text(byline.segments)}
		{@render meta()}
	</div>
{:else if byline?.kind === 'plain'}
	<div class="creator-line">
		{@render text(byline.segments)}
		{@render meta()}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.creator-line {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
	}

	.avatar-link {
		display: inline-flex;
	}

	.updated-time,
	.visibility-label {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.byline-text {
		font-size: $font-small;
		font-weight: $normal;
		color: var(--text-secondary);

		a {
			font-weight: $medium;
			color: inherit;
			text-decoration: none;

			&:hover {
				color: var(--text-primary);
				text-decoration: underline;
			}
		}
	}
</style>
