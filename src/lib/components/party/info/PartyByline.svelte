<script lang="ts">
	/**
	 * The line under a party's name: who it's by (see partyByline), then its
	 * visibility when not public and when it was last updated.
	 */
	import * as m from '$lib/paraglide/messages'
	import AvatarPair from '$lib/components/ui/AvatarPair.svelte'
	import UserLink from '$lib/components/ui/UserLink.svelte'
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
		<UserLink user={byline.user} label={byline.text} />
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
