<script lang="ts">
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { useUpdateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), onOpenChange }: Props = $props()

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

	const canSave = $derived(
		settingsName.trim().length > 0 && !gamertagError && !isCheckingGamertag
	)

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
			const crew = await updateCrewMutation.mutateAsync({
				name: settingsName.trim(),
				gamertag: settingsGamertag.trim() || undefined,
				granblueCrewId: settingsGranblueCrewId.trim() || undefined,
				description: settingsDescription.trim() || undefined
			})

			crewStore.setCrew(crew, crewStore.membership)
			open = false
		} catch (err: any) {
			settingsError = err.message || 'Failed to update crew'
		}
	}

	function handleClose() {
		open = false
		settingsError = null
		clearTimeout(gamertagTimer)
	}
</script>

<Dialog bind:open onOpenChange={(o) => { if (!o) handleClose(); onOpenChange?.(o) }}>
	{#snippet children()}
		<ModalHeader title={m.crew_settings_title()} />

		<ModalBody>
			{#snippet children()}
				<div class="modal-form">
					{#if settingsError}
						<div class="error-message">{settingsError}</div>
					{/if}

					<div class="form-fields">
						<Input
							label={m.crew_name_label()}
							bind:value={settingsName}
							placeholder={m.crew_name_placeholder_short()}
							maxLength={100}
							fullWidth
							contained
						/>

						<Input
							label="{m.crew_gamertag_label()} {m.crew_gamertag_optional()}"
							value={settingsGamertag}
							oninput={onGamertagInput}
							placeholder={m.crew_gamertag_placeholder()}
							maxLength={4}
							fullWidth
							contained
							error={gamertagError}
							rightIcon={gamertagIcon}
						/>

						<Input
							label="{m.crew_granblue_id_label()} {m.crew_gamertag_optional()}"
							bind:value={settingsGranblueCrewId}
							placeholder={m.crew_granblue_id_placeholder()}
							fullWidth
							contained
						/>

						<div class="form-field">
							<label for="settings-description"
								>{m.crew_description_label()} <span class="optional">{m.crew_gamertag_optional()}</span></label
							>
							<textarea
								id="settings-description"
								bind:value={settingsDescription}
								placeholder={m.crew_description_placeholder()}
								maxlength="500"
								rows="3"
							></textarea>
						</div>
					</div>
				</div>
			{/snippet}
		</ModalBody>

		<ModalFooter
			onCancel={handleClose}
			cancelDisabled={updateCrewMutation.isPending}
			primaryAction={{
				label: updateCrewMutation.isPending ? m.crew_saving() : m.crew_save_button(),
				onclick: handleSave,
				disabled: !canSave || updateCrewMutation.isPending
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.error-message {
		background-color: var(--danger-bg-subtle);
		border: 1px solid var(--danger);
		border-radius: layout.$card-corner;
		color: var(--danger);
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-primary);

			.optional {
				font-weight: typography.$normal;
				color: var(--text-secondary);
			}
		}

		textarea {
			padding: spacing.$unit-2x;
			border: none;
			border-radius: layout.$input-corner;
			font-size: typography.$font-regular;
			font-family: inherit;
			background: var(--input-bound-bg);
			color: var(--text-primary);
			resize: vertical;
			min-height: 80px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&::placeholder {
				color: var(--text-tertiary);
			}
		}
	}
</style>
