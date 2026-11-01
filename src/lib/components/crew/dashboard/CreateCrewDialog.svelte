<script lang="ts">
	import { useCreateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { toCrewInput } from '$lib/features/crew/crewForm'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import CrewDetailsFields from '$lib/components/crew/form/CrewDetailsFields.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
	}

	let { open = $bindable(false) }: Props = $props()

	const createCrewMutation = useCreateCrew()

	// Form state
	let crewName = $state('')
	let crewGamertag = $state('')
	let crewGranblueCrewId = $state('')
	let crewDescription = $state('')
	let error = $state<string | null>(null)

	const canCreate = $derived(crewName.trim().length > 0)

	async function handleCreateCrew() {
		if (!canCreate) return

		error = null

		try {
			const crew = await createCrewMutation.mutateAsync(
				toCrewInput({
					name: crewName,
					gamertag: crewGamertag,
					granblueCrewId: crewGranblueCrewId,
					description: crewDescription
				})
			)

			// Update the store - creator is always captain
			crewStore.setCrew(crew, {
				id: '', // Will be populated when fetching crew
				role: 'captain',
				retired: false,
				retiredAt: null,
				joinedAt: new Date().toISOString(),
				createdAt: new Date().toISOString()
			})

			// Close modal and reset form
			open = false
			crewName = ''
			crewGamertag = ''
			crewGranblueCrewId = ''
			crewDescription = ''
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to create crew'
		}
	}

	function handleClose() {
		open = false
		error = null
	}
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<ModalHeader title={m.crew_create()} />

	<ModalBody>
		<CrewDetailsFields
			bind:name={crewName}
			bind:gamertag={crewGamertag}
			bind:granblueCrewId={crewGranblueCrewId}
			bind:description={crewDescription}
			descriptionId="crew-description"
			{error}
		/>
	</ModalBody>

	<ModalFooter
		onCancel={handleClose}
		cancelDisabled={createCrewMutation.isPending}
		primaryAction={{
			label: createCrewMutation.isPending ? m.crew_creating() : m.crew_create(),
			onclick: handleCreateCrew,
			disabled: !canCreate || createCrewMutation.isPending
		}}
	/>
</Dialog>
