<script lang="ts">
	/**
	 * PartyVisibilitySection - Privacy level, plus the share-with-crew toggle
	 * for crew members.
	 */
	import * as m from '$lib/paraglide/messages'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import PrivacySelector from '$lib/components/party/edit/PrivacySelector.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import type { PartyVisibility } from '$lib/types/visibility'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		visibility: PartyVisibility
		sharedWithCrew: boolean
		/** Element for selector and switch theming */
		element?: ElementType | undefined
	}

	let { visibility = $bindable(), sharedWithCrew = $bindable(), element }: Props = $props()

	// Query the user's crew membership to show/hide the share toggle
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		staleTime: 5 * 60 * 1000 // Cache for 5 minutes
	}))
	const isInCrew = $derived(myCrewQuery.data != null)
</script>

<DetailsSection title={m.visibility_label()}>
	<PrivacySelector bind:value={visibility} {element} showLabel={false} />
	{#if isInCrew}
		<DetailRow label={m.party_edit_share_crew()} compact>
			<Switch bind:checked={sharedWithCrew} size="small" {element} />
		</DetailRow>
	{/if}
</DetailsSection>
