<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwQueries } from '$lib/api/queries/gw.queries'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import GwPlayerHistory from '$lib/components/crew/GwPlayerHistory.svelte'

	const phantomId = $derived($page.params.phantomId ?? '')

	// Query for phantom's GW scores
	const scoresQuery = createQuery(() => gwQueries.phantomGwScores(phantomId))

	const phantomName = $derived(scoresQuery.data?.phantom?.name ?? 'Phantom')
</script>

<svelte:head>
	<title>{phantomName} / granblue.team</title>
</svelte:head>

<CrewPage>
	{#if scoresQuery.isLoading}
		<CrewStatusMessage message={m.crew_loading_generic()} />
	{:else if scoresQuery.isError}
		<CrewStatusMessage message={m.gw_failed_load()} />
	{:else if scoresQuery.data}
		{@const data = scoresQuery.data}

		<CrewHeader title={phantomName} backHref="/crew/members">
			{#snippet belowTitle()}
				<span class="phantom-badge">{m.gw_phantom()}</span>
			{/snippet}
		</CrewHeader>

		<GwPlayerHistory
			grandTotal={data.grandTotal}
			eventScores={data.eventScores}
			gapLabel={m.gw_no_score()}
			onOpenGap={(eventNumber) => goto(`/crew/events/${eventNumber}`)}
		/>
	{/if}
</CrewPage>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.phantom-badge {
		display: inline-block;
		font-size: typography.$font-small;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		background: var(--color-purple-light, #ede9fe);
		color: var(--color-purple-dark, #7c3aed);
	}
</style>
