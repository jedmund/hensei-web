<script lang="ts">
	// Edit form: the weapon this one is forged from
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import WeaponTypeahead from '$lib/components/ui/WeaponTypeahead.svelte'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity shape from API
		weapon: any
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData?: any
	}

	let { weapon, editData = $bindable() }: Props = $props()

	const forgedFrom = $derived(weapon?.forgedFrom ?? null)

	// Get initial weapon data for typeahead
	const initialForgedFrom = $derived.by(() => {
		if (!forgedFrom) return null
		return {
			id: forgedFrom.id,
			name: forgedFrom.name?.en || forgedFrom.name?.ja || forgedFrom.granblueId,
			granblueId: forgedFrom.granblueId
		}
	})
</script>

<DetailsContainer title="Forge Chain">
	<DetailItem label="Forged From" sublabel="The weapon this was forged from" editable={true}>
		<WeaponTypeahead
			bind:value={editData.forgedFrom}
			initialWeapon={initialForgedFrom}
			placeholder="Search for base weapon..."
			contained
		/>
	</DetailItem>
</DetailsContainer>
