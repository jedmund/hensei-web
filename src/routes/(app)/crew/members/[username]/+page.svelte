<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwQueries } from '$lib/api/queries/gw.queries'
	import { formatTimezone } from '$lib/utils/timezone'
	import Button from '$lib/components/ui/Button.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import GwPlayerHistory from '$lib/components/crew/GwPlayerHistory.svelte'

	const username = $derived($page.params.username ?? '')

	// Query for member's GW scores
	const scoresQuery = createQuery(() => gwQueries.memberGwScoresByUsername(username))

	const memberName = $derived(scoresQuery.data?.member?.user?.username ?? 'Member')
	const memberTimezone = $derived(scoresQuery.data?.member?.user?.timezone)
</script>

<svelte:head>
	<title>{memberName} / granblue.team</title>
</svelte:head>

<CrewPage>
	{#if scoresQuery.isLoading}
		<CrewStatusMessage message={m.crew_loading_generic()} />
	{:else if scoresQuery.isError}
		<CrewStatusMessage message={m.gw_failed_load()} />
	{:else if scoresQuery.data}
		{@const data = scoresQuery.data}

		<CrewHeader title={memberName} backHref="/crew/members">
			{#snippet actions()}
				<Button variant="secondary" size="small" href={localizeHref(`/${username}`)}>
					{m.crew_view_profile()}
				</Button>
			{/snippet}
		</CrewHeader>

		{#if memberTimezone}
			<div class="timezone-row">
				<span class="timezone">{formatTimezone(memberTimezone)}</span>
			</div>
		{/if}

		<GwPlayerHistory
			grandTotal={data.grandTotal}
			eventScores={data.eventScores}
			gapLabel={m.gw_not_in_crew()}
			onOpenGap={(eventNumber) => goto(localizeHref(`/crew/events/${eventNumber}`))}
		/>
	{/if}
</CrewPage>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.timezone-row {
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
	}

	.timezone {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
