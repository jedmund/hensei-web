<script lang="ts">
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { useUpdateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { toCrewInput } from '$lib/features/crew/crewForm'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import CrewDetailsFields from '$lib/components/crew/form/CrewDetailsFields.svelte'
	import CrewMembershipSettings from '$lib/components/crew/settings/CrewMembershipSettings.svelte'
	import * as m from '$lib/paraglide/messages'

	type Section = 'crew' | 'membership'
	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		/** The signed-in user's element, for the section switcher */
		element?: ElementName | undefined
	}

	let { open = $bindable(false), onOpenChange, element }: Props = $props()

	// Only officers can edit the crew's details; every member can manage
	// their own membership
	const canEditCrew = $derived(crewStore.isOfficer)
	let activeSection = $state<Section>('crew')
	const section = $derived<Section>(canEditCrew ? activeSection : 'membership')

	const updateCrewMutation = useUpdateCrew()

	// Form state
	let settingsName = $state('')
	let settingsGamertag = $state('')
	let settingsGranblueCrewId = $state('')
	let settingsDescription = $state('')
	let settingsError = $state<string | null>(null)

	// Gamertag availability checking
	let isCheckingGamertag = $state(false)
	let gamertagAvailable = $state<boolean | null>(null)
	let gamertagError = $state('')
	let gamertagTimer: ReturnType<typeof setTimeout> | undefined

	// Sync form when dialog opens
	$effect(() => {
		if (open) {
			activeSection = canEditCrew ? 'crew' : 'membership'
			settingsName = crewStore.crew?.name ?? ''
			settingsGamertag = crewStore.crew?.gamertag ?? ''
			settingsGranblueCrewId = crewStore.crew?.granblueCrewId ?? ''
			settingsDescription = crewStore.crew?.description ?? ''
			settingsError = null
			gamertagAvailable = null
			gamertagError = ''
			isCheckingGamertag = false
		}
	})

	const canSave = $derived(settingsName.trim().length > 0 && !gamertagError && !isCheckingGamertag)

	async function checkGamertagAvailability(value: string) {
		if (value.length < 1) return

		isCheckingGamertag = true
		try {
			const result = await crewAdapter.checkGametagAvailability(value)
			// Only update if the value hasn't changed
			if (settingsGamertag === value) {
				gamertagAvailable = result.available
				if (!result.available) {
					gamertagError = m.crew_gamertag_taken()
				}
			}
		} catch {
			// Silently fail availability check
		} finally {
			isCheckingGamertag = false
		}
	}

	function onGamertagInput(e: Event) {
		const target = e.target as HTMLInputElement
		settingsGamertag = target.value
		gamertagAvailable = null
		gamertagError = ''

		clearTimeout(gamertagTimer)

		// Skip check if gamertag hasn't changed from current crew value
		const currentGamertag = crewStore.crew?.gamertag ?? ''
		if (settingsGamertag.trim() === currentGamertag || settingsGamertag.trim() === '') {
			return
		}

		gamertagTimer = setTimeout(() => checkGamertagAvailability(settingsGamertag.trim()), 300)
	}

	const gamertagIcon = $derived(
		isCheckingGamertag
			? 'loader'
			: gamertagAvailable === true
				? 'check'
				: gamertagAvailable === false
					? 'x'
					: undefined
	)

	async function handleSave() {
		if (!canSave) return

		settingsError = null

		try {
			const crew = await updateCrewMutation.mutateAsync(
				toCrewInput({
					name: settingsName,
					gamertag: settingsGamertag,
					granblueCrewId: settingsGranblueCrewId,
					description: settingsDescription
				})
			)

			crewStore.setCrew(crew, crewStore.membership)
			open = false
		} catch (err: unknown) {
			settingsError = err instanceof Error ? err.message : m.crew_update_failed()
		}
	}

	function handleClose() {
		open = false
		settingsError = null
		clearTimeout(gamertagTimer)
	}
</script>

<Dialog
	bind:open
	size="medium"
	onOpenChange={(o) => {
		if (!o) handleClose()
		onOpenChange?.(o)
	}}
>
	<ModalHeader title={m.crew_settings_title()} />

	<ModalBody>
		{#if canEditCrew}
			<div class="sections">
				<SegmentedControl
					value={section}
					onValueChange={(value) => (activeSection = value as Section)}
					variant="background"
					size="small"
					{element}
					grow
				>
					<Segment value="crew">{m.crew_settings_section_crew()}</Segment>
					<Segment value="membership">{m.crew_settings_section_membership()}</Segment>
				</SegmentedControl>
			</div>
		{/if}

		<!-- Both sections share one grid cell, so the dialog keeps the taller
		     one's height when switching -->
		<div class="section-stack">
			{#if canEditCrew}
				<div class="section" class:hidden={section !== 'crew'} inert={section !== 'crew'}>
					<CrewDetailsFields
						bind:name={settingsName}
						bind:gamertag={settingsGamertag}
						bind:granblueCrewId={settingsGranblueCrewId}
						bind:description={settingsDescription}
						descriptionId="settings-description"
						{gamertagError}
						{gamertagIcon}
						{onGamertagInput}
						error={settingsError}
					/>
				</div>
			{/if}
			<div class="section" class:hidden={section !== 'membership'} inert={section !== 'membership'}>
				<CrewMembershipSettings onLeft={handleClose} />
			</div>
		</div>
	</ModalBody>

	{#if section === 'crew'}
		<ModalFooter
			onCancel={handleClose}
			cancelDisabled={updateCrewMutation.isPending}
			userElement={element}
			primaryAction={{
				label: updateCrewMutation.isPending ? m.crew_saving() : m.crew_save_button(),
				onclick: handleSave,
				disabled: !canSave || updateCrewMutation.isPending
			}}
		/>
	{:else}
		<ModalFooter onCancel={handleClose} />
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.sections {
		margin-bottom: spacing.$unit-3x;
	}

	.section-stack {
		display: grid;
	}

	.section {
		grid-area: 1 / 1;

		&.hidden {
			visibility: hidden;
		}
	}
</style>
