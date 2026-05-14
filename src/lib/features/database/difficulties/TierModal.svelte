<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { difficultyAdapter } from '$lib/api/adapters/difficulty.adapter'
	import type { DifficultyTier } from '$lib/types/api/party'
	import { extractErrorMessage } from '$lib/utils/errors'
	import IconUploadField from '$lib/components/IconUploadField.svelte'
	import { buildTierPayload, validateTierForm } from '$lib/features/database/difficulties/tier-form'
	import {
		ICON_MAX_BYTES,
		ICON_MAX_DIMENSION,
		dataUrlToBase64,
		type IconValidationError
	} from '$lib/utils/iconUpload'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'

	interface Props {
		open?: boolean
		tier?: DifficultyTier | null
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), tier = null, onOpenChange }: Props = $props()

	const isEditing = $derived(!!tier)
	const title = $derived(isEditing ? 'Edit Difficulty Tier' : 'New Difficulty Tier')

	// Form state
	let name = $state('')
	let slug = $state('')
	let description = $state('')
	let minScore = $state<number>(0)
	let maxScore = $state<number>(100)
	let sortOrder = $state<number>(0)
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)
	let isUploadingIcon = $state(false)
	// Tracks intent to clear an existing tier.imageKey without uploading a new one.
	let removeIcon = $state(false)

	const queryClient = useQueryClient()

	const createMut = createMutation(() => ({
		mutationFn: (data: Partial<DifficultyTier>) => difficultyAdapter.createTier(data)
	}))
	const updateMut = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyTier> }) =>
			difficultyAdapter.updateTier(input.id, input.data)
	}))
	const deleteMut = createMutation(() => ({
		mutationFn: (id: string) => difficultyAdapter.deleteTier(id)
	}))

	$effect(() => {
		if (open) {
			iconFile = null
			iconPreview = null
			iconError = null
			removeIcon = false
			if (tier) {
				name = tier.name ?? ''
				slug = tier.slug ?? ''
				description = tier.description ?? ''
				minScore = tier.minScore ?? 0
				maxScore = tier.maxScore ?? 100
				sortOrder = tier.sortOrder ?? 0
			} else {
				name = ''
				slug = ''
				description = ''
				minScore = 0
				maxScore = 100
				sortOrder = 0
			}
		}
	})

	function iconErrorMessage(error: IconValidationError): string {
		switch (error) {
			case 'mime':
				return 'Icon must be a PNG.'
			case 'size':
				return `Icon must be ${ICON_MAX_BYTES / 1024}KB or smaller.`
			case 'dimensions':
				return `Icon must be ${ICON_MAX_DIMENSION}x${ICON_MAX_DIMENSION} or smaller.`
			case 'decode':
				return 'Icon could not be read.'
		}
	}

	function handleIconSelect(selection: { file: File; dataUrl: string }) {
		iconError = null
		iconFile = selection.file
		iconPreview = selection.dataUrl
		removeIcon = false
	}

	function clearIcon() {
		iconFile = null
		iconPreview = null
		iconError = null
	}

	function toggleRemoveIcon() {
		removeIcon = !removeIcon
	}

	const formInput = $derived({
		name,
		slug,
		description,
		minScore,
		maxScore,
		sortOrder
	})

	const canSave = $derived(validateTierForm(formInput).ok)

	function buildPayload(): Partial<DifficultyTier> {
		return buildTierPayload(formInput, { removeIcon, hasIconFile: !!iconFile })
	}

	const saveAction = useAsyncAction(async () => {
		if (!canSave) {
			toast.error('Name, slug, and a valid 0–100 range are required.')
			return
		}

		const result =
			isEditing && tier
				? await updateMut.mutateAsync({ id: tier.id, data: buildPayload() })
				: await createMut.mutateAsync(buildPayload())

		// Image upload runs after the draft is already staged. If it fails we
		// surface a partial-success toast and still close the modal so the
		// staged tier shows up in the list.
		let iconUploadError: unknown = null
		if (iconFile && iconPreview && result.draft?.id) {
			isUploadingIcon = true
			try {
				await difficultyAdapter.uploadDraftImage(
					result.draft.id,
					dataUrlToBase64(iconPreview),
					iconFile.name
				)
			} catch (err) {
				iconUploadError = err
			} finally {
				isUploadingIcon = false
			}
		}

		await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
		if (iconUploadError) {
			toast.error(
				extractErrorMessage(
					iconUploadError,
					'Tier change staged, but the icon upload failed — try Replace.'
				)
			)
		} else {
			toast.success(isEditing ? 'Tier change staged' : 'Tier creation staged')
		}
		open = false
		onOpenChange?.(false)
	}, 'Failed to save tier')

	const handleSave = saveAction.run

	let confirmDeleteOpen = $state(false)

	const deleteAction = useAsyncAction(async () => {
		if (!tier) return
		await deleteMut.mutateAsync(tier.id)
		await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
		toast.success('Tier deletion staged')
		confirmDeleteOpen = false
		open = false
		onOpenChange?.(false)
	}, 'Failed to delete tier')

	const handleConfirmDelete = deleteAction.run

	// Source busy state from the wrapped actions so the indicator covers the
	// whole pipeline (icon upload, cache invalidation), not just the mutation.
	const isSaving = $derived(saveAction.busy)
	const isDeleting = $derived(deleteAction.busy)
</script>

<Dialog bind:open {onOpenChange}>
	<ModalHeader {title} description="Score ranges determine which tier a party falls into." />
	<div class="modal-body">
		<DetailItem
			label="Name"
			bind:value={name}
			editable={true}
			type="text"
			placeholder="e.g. Endgame"
			width="280px"
		/>
		<DetailItem
			label="Slug"
			sublabel="Used in URLs and the filter param"
			bind:value={slug}
			editable={true}
			type="text"
			placeholder="endgame"
			width="280px"
		/>
		<DetailItem
			label="Icon"
			sublabel="Optional. PNG, 128×128 or smaller, 256KB max. Shown next to the tier name."
			editable={true}
		>
			<IconUploadField
				iconKey={removeIcon ? null : tier?.imageKey}
				{iconPreview}
				{name}
				size={40}
				error={iconError}
				onSelect={handleIconSelect}
				onError={(err) => (iconError = iconErrorMessage(err))}
			>
				{#snippet actions({ open })}
					<Button variant="ghost" size="small" onclick={open}>
						{iconPreview || (tier?.imageKey && !removeIcon) ? 'Replace' : 'Upload'}
					</Button>
					{#if iconPreview}
						<Button variant="ghost" size="small" onclick={clearIcon}>Cancel</Button>
					{:else if tier?.imageKey}
						<Button variant="ghost" size="small" onclick={toggleRemoveIcon}>
							{removeIcon ? 'Undo' : 'Remove'}
						</Button>
					{/if}
				{/snippet}
			</IconUploadField>
		</DetailItem>
		<DetailItem
			label="Sort Order"
			sublabel="Lower values appear first in lists"
			bind:value={sortOrder}
			editable={true}
			type="number"
		/>
		<h4 class="section-header">Score range</h4>
		<DetailItem
			label="Min score"
			bind:value={minScore}
			editable={true}
			type="number"
			min={0}
			max={100}
		/>
		<DetailItem
			label="Max score"
			bind:value={maxScore}
			editable={true}
			type="number"
			min={0}
			max={100}
		/>
		<h4 class="section-header">Description</h4>
		<DetailItem label="Notes" editable={true}>
			<textarea
				bind:value={description}
				placeholder="Optional description shown to editors"
				rows="3"
				class="description-input"
			></textarea>
		</DetailItem>
	</div>
	<ModalFooter
		onCancel={() => (open = false)}
		primaryAction={{
			label: isSaving || isUploadingIcon ? 'Saving…' : isEditing ? 'Save' : 'Create',
			onclick: handleSave,
			disabled: isSaving || isUploadingIcon || isDeleting || !canSave
		}}
	>
		{#snippet left()}
			{#if isEditing}
				<Button
					variant="destructive-ghost"
					size="small"
					onclick={() => (confirmDeleteOpen = true)}
					disabled={isDeleting || isSaving}
				>
					{isDeleting ? 'Deleting…' : 'Delete'}
				</Button>
			{/if}
		{/snippet}
	</ModalFooter>
</Dialog>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete tier?"
	message={`Parties currently assigned to "${tier?.name ?? ''}" will be reset to no tier until the next score sweep.`}
	confirmLabel="Delete"
	loading={isDeleting}
	onconfirm={handleConfirmDelete}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		padding-top: 0;
		max-height: 60vh;
		overflow-y: auto;
	}

	.section-header {
		margin: spacing.$unit 0 0 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-secondary);
	}

	.description-input {
		width: 320px;
		padding: spacing.$unit;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$input-corner;
		background: var(--input-bg);
		color: var(--text-primary);
		font: inherit;
		resize: vertical;

		&:focus {
			outline: 2px solid var(--focus-ring);
			outline-offset: -1px;
			border-color: transparent;
		}
	}
</style>
