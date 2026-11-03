<script lang="ts">
	/**
	 * The line above a party's name: who it's by (see partyByline), then its
	 * visibility when not public. When it was updated sits under the name
	 * (DescriptionTile).
	 */
	import * as m from '$lib/paraglide/messages'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { PartyVisibility } from '$lib/types/visibility'
	import { partyByline, type BylineParty, type BylineSegment } from './partyByline'

	interface Props extends BylineParty {
		visibility?: PartyVisibility | undefined
	}

	let { user, sourceParty, collectionSourceUser, visibility }: Props = $props()

	const byline = $derived(partyByline({ user, sourceParty, collectionSourceUser }))
	const visibilityLabel = $derived(
		visibility === PartyVisibility.UNLISTED
			? m.visibility_unlisted()
			: visibility === PartyVisibility.PRIVATE
				? m.visibility_private()
				: null
	)
</script>

{#snippet meta()}
	{#if visibilityLabel}
		<span class="visibility-label">&middot;&nbsp;{visibilityLabel}</span>
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

	// The flex gap sets off the " · " before the visibility. One line: when
	// space runs short (beside the actions on a phone), the name keeps its
	// room and the visibility trails off
	.creator-line {
		display: flex;
		align-items: center;
		gap: $unit-half;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
	}

	.avatar-link,
	.byline-text {
		flex-shrink: 0;
	}

	.avatar-link {
		display: inline-flex;
	}

	.visibility-label {
		font-size: $font-small;
		color: var(--text-tertiary);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
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
