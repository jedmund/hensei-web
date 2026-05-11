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
	import TierIcon from '$lib/features/database/difficulties/TierIcon.svelte'

	const ICON_MAX_DIMENSION = 128
	const ICON_MAX_BYTES = 256 * 1024

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
	let color = $state('#86C5A8')
	let description = $state('')
	let minScore = $state<number>(0)
	let maxScore = $state<number>(100)
	let sortOrder = $state<number>(0)
	let iconFile = $state<File | null>(null)
	let iconPreview = $state<string | null>(null)
	let iconError = $state<string | null>(null)
	let iconInputRef: HTMLInputElement | undefined = $state(undefined)
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

	const isSaving = $derived(createMut.isPending || updateMut.isPending)
	const isDeleting = $derived(deleteMut.isPending)

	$effect(() => {
		if (open) {
			iconFile = null
			iconPreview = null
			iconError = null
			removeIcon = false
			if (tier) {
				name = tier.name ?? ''
				slug = tier.slug ?? ''
				color = tier.color ?? '#86C5A8'
				description = tier.description ?? ''
				minScore = tier.minScore ?? 0
				maxScore = tier.maxScore ?? 100
				sortOrder = tier.sortOrder ?? 0
			} else {
				name = ''
				slug = ''
				color = '#86C5A8'
				description = ''
				minScore = 0
				maxScore = 100
				sortOrder = 0
			}
		}
	})

	function openIconPicker() {
		iconInputRef?.click()
	}

	async function readDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = () => reject(reader.error)
			reader.readAsDataURL(file)
		})
	}

	async function checkDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve({ width: img.width, height: img.height })
			img.onerror = () => reject(new Error('Could not decode image'))
			img.src = dataUrl
		})
	}

	async function handleIconSelect(e: Event) {
		iconError = null
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		if (file.type !== 'image/png') {
			iconError = 'Icon must be a PNG.'
			input.value = ''
			return
		}
		if (file.size > ICON_MAX_BYTES) {
			iconError = 'Icon must be 256KB or smaller.'
			input.value = ''
			return
		}

		const dataUrl = await readDataUrl(file)
		const { width, height } = await checkDimensions(dataUrl)
		if (width > ICON_MAX_DIMENSION || height > ICON_MAX_DIMENSION) {
			iconError = `Icon must be ${ICON_MAX_DIMENSION}x${ICON_MAX_DIMENSION} or smaller.`
			input.value = ''
			return
		}

		iconFile = file
		iconPreview = dataUrl
		removeIcon = false
	}

	function clearIcon() {
		iconFile = null
		iconPreview = null
		iconError = null
		if (iconInputRef) iconInputRef.value = ''
	}

	function toggleRemoveIcon() {
		removeIcon = !removeIcon
	}

	function buildPayload(): Partial<DifficultyTier> {
		const payload: Partial<DifficultyTier> = {
			name: name.trim(),
			slug: slug.trim(),
			color,
			description: description.trim() || undefined,
			minScore,
			maxScore,
			sortOrder
		}
		// Clearing an existing icon is expressed as imageKey: null; uploading a
		// new icon goes through uploadDraftImage after the draft is staged.
		if (removeIcon && !iconFile) payload.imageKey = null
		return payload
	}

	const canSave = $derived(
		name.trim().length > 0 &&
			slug.trim().length > 0 &&
			maxScore > minScore &&
			minScore >= 0 &&
			maxScore <= 100
	)

	async function handleSave() {
		if (!canSave) {
			toast.error('Name, slug, and a valid 0–100 range are required.')
			return
		}

		try {
			const result =
				isEditing && tier
					? await updateMut.mutateAsync({ id: tier.id, data: buildPayload() })
					: await createMut.mutateAsync(buildPayload())

			if (iconFile && result.draft?.id) {
				isUploadingIcon = true
				try {
					const dataUrl = await readDataUrl(iconFile)
					const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
					await difficultyAdapter.uploadDraftImage(result.draft.id, base64, iconFile.name)
				} finally {
					isUploadingIcon = false
				}
			}

			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success(isEditing ? 'Tier updated' : 'Tier created')
			open = false
			onOpenChange?.(false)
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Failed to save tier'))
		}
	}

	let confirmDeleteOpen = $state(false)

	async function handleConfirmDelete() {
		if (!tier) return
		try {
			await deleteMut.mutateAsync(tier.id)
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success('Tier deleted')
			confirmDeleteOpen = false
			open = false
			onOpenChange?.(false)
		} catch (err) {
			toast.error(extractErrorMessage(err, 'Failed to delete tier'))
		}
	}
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
		<DetailItem label="Color" editable={true}>
			<div class="color-control">
				<input type="color" bind:value={color} aria-label="Tier color" class="color-input" />
				<span class="color-value">{color}</span>
			</div>
		</DetailItem>
		<DetailItem
			label="Icon"
			sublabel="Optional. PNG, 128×128 or smaller, 256KB max. Shown next to the tier name."
			editable={true}
		>
			<div class="icon-control">
				<TierIcon
					imageKey={removeIcon ? null : tier?.imageKey}
					src={iconPreview}
					{color}
					{name}
					size={40}
				/>
				<div class="icon-actions">
					<Button variant="ghost" size="small" onclick={openIconPicker}>
						{iconPreview || (tier?.imageKey && !removeIcon) ? 'Replace' : 'Upload'}
					</Button>
					{#if iconPreview}
						<Button variant="ghost" size="small" onclick={clearIcon}>Cancel</Button>
					{:else if tier?.imageKey}
						<Button variant="ghost" size="small" onclick={toggleRemoveIcon}>
							{removeIcon ? 'Undo' : 'Remove'}
						</Button>
					{/if}
				</div>
				<input
					bind:this={iconInputRef}
					type="file"
					accept="image/png"
					onchange={handleIconSelect}
					class="icon-input-hidden"
				/>
				{#if iconError}
					<p class="icon-error">{iconError}</p>
				{/if}
			</div>
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

	.color-control {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.color-input {
		width: 42px;
		height: 32px;
		padding: 0;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$item-corner-small;
		background: transparent;
		cursor: pointer;

		&::-webkit-color-swatch-wrapper {
			padding: 2px;
		}

		&::-webkit-color-swatch {
			border-radius: 3px;
			border: none;
		}
	}

	.color-value {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.icon-control {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		flex-wrap: wrap;
	}

	.icon-actions {
		display: flex;
		gap: spacing.$unit-half;
	}

	.icon-input-hidden {
		display: none;
	}

	.icon-error {
		flex-basis: 100%;
		margin: 0;
		color: var(--danger);
		font-size: typography.$font-small;
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
