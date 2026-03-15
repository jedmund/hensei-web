
<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'

	type Element = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		userElement?: Element | string | undefined
	}

	const { userElement }: Props = $props()

	const typedElement = $derived(
		userElement as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined ?? undefined
	)

	interface Tab {
		value: string
		href: string
		label: string
		match: (pathname: string) => boolean
	}

	const tabs: Tab[] = [
		{
			value: 'events',
			href: '/crew',
			label: m.crew_tab_events(),
			match: (pathname) => pathname === '/crew'
		},
		{
			value: 'members',
			href: '/crew/members',
			label: m.crew_tab_members(),
			match: (pathname) => pathname.startsWith('/crew/members')
		},
		{
			value: 'teams',
			href: '/crew/teams',
			label: m.crew_tab_teams(),
			match: (pathname) => pathname.startsWith('/crew/teams')
		},
		{
			value: 'roster',
			href: '/crew/roster',
			label: m.crew_tab_roster(),
			match: (pathname) => pathname === '/crew/roster'
		}
	]

	const currentTab = $derived(
		tabs.find((tab) => tab.match($page.url.pathname))?.value ?? 'events'
	)

	function handleTabChange(value: string) {
		const tab = tabs.find((t) => t.value === value)
		if (tab) {
			goto(tab.href)
		}
	}
</script>

<nav class="crew-tabs" aria-label="Crew navigation">
	<SegmentedControl
		value={currentTab}
		onValueChange={handleTabChange}
		variant="background"
		size="small"
		element={typedElement}
		grow
	>
		{#each tabs as tab (tab.value)}
			<Segment value={tab.value}>{tab.label}</Segment>
		{/each}
	</SegmentedControl>
</nav>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.crew-tabs {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}
</style>
