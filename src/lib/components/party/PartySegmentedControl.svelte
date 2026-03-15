<!-- PartySegmentedControl Component -->

<script lang="ts">
	import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { GridType } from '$lib/types/enums'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import RepSegment from '$lib/components/ui/segmented-control/RepSegment.svelte'
	import CharacterRep from '$lib/components/reps/CharacterRep.svelte'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import SummonRep from '$lib/components/reps/SummonRep.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { getJobIconUrl } from '$lib/utils/jobUtils'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		selectedTab?: GridType
		onTabChange?: (tab: GridType) => void
		party: Party
		class?: string
	}

	let { selectedTab = GridType.Character, onTabChange, party, class: className }: Props = $props()

	// Derived values to ensure reactivity propagates through snippet boundaries
	// When party updates from TanStack Query cache, these will trigger re-renders
	const weapons = $derived(party.weapons)
	const summons = $derived(party.summons)
	const characters = $derived(party.characters)
	const unlimited = $derived(party.raid?.group?.unlimited ?? false)
	const jobIcon = $derived(party.job ? getJobIconUrl(party.job.granblueId) : undefined)

	// Handle value changes
	let value = $state(selectedTab)

	$effect(() => {
		value = selectedTab
	})

	function handleValueChange(newValue: string) {
		value = newValue as GridType
		sidebar.close()
		onTabChange?.(newValue as GridType)
	}

</script>

<nav class={className}>
	<SegmentedControl bind:value onValueChange={handleValueChange} gap={true} grow={true}>
		<RepSegment
			value={GridType.Character}
			label={m.party_segmented_control_characters()}
			labelIcon={jobIcon}
			selected={value === GridType.Character}
		>
			<CharacterRep characters={characters} {unlimited} />
		</RepSegment>

		<RepSegment
			value={GridType.Weapon}
			label={m.party_segmented_control_weapons()}
			selected={value === GridType.Weapon}
		>
			<WeaponRep weapons={weapons} />
		</RepSegment>

		<RepSegment
			value={GridType.Summon}
			label={m.party_segmented_control_summons()}
			selected={value === GridType.Summon}
		>
			<SummonRep summons={summons} />
		</RepSegment>
	</SegmentedControl>
</nav>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	nav {
		width: 100%;
	}
</style>
