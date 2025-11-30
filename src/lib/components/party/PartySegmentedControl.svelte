<!-- PartySegmentedControl Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { getContext } from 'svelte'
	import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { GridType } from '$lib/types/enums'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import RepSegment from '$lib/components/ui/segmented-control/RepSegment.svelte'
	import CharacterRep from '$lib/components/reps/CharacterRep.svelte'
	import WeaponRep from '$lib/components/reps/WeaponRep.svelte'
	import SummonRep from '$lib/components/reps/SummonRep.svelte'
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
	const job = $derived(party.job)
	const element = $derived(party.element)

	// Handle value changes
	let value = $state(selectedTab)

	$effect(() => {
		value = selectedTab
	})

	function handleValueChange(newValue: string) {
		value = newValue as GridType
		onTabChange?.(newValue as GridType)
	}

	// Get user gender from context if available
	// This would typically come from auth/account state
	const accountContext = getContext<any>('account')
	const userGender = $derived(accountContext?.user?.gender ?? 0)
</script>

<nav class={className}>
	<SegmentedControl bind:value onValueChange={handleValueChange} gap={true} grow={true}>
		<RepSegment
			value={GridType.Character}
			label={m.party_segmented_control_characters()}
			selected={value === GridType.Character}
		>
			<CharacterRep
				job={job}
				element={element}
				gender={userGender}
				characters={characters}
			/>
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
