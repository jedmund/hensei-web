<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { WeaponSeriesVariant } from '$lib/types/api/weaponSeriesVariant'
	import type { AugmentType } from '$lib/types/api/weaponStatModifier'
	import {
		useCreateWeaponSeriesVariant,
		useUpdateWeaponSeriesVariant,
		useDeleteWeaponSeriesVariant
	} from '$lib/api/mutations/weaponSeriesVariant.mutations'
	import { getAugmentTypeOptions } from '$lib/utils/augmentType'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		open?: boolean
		seriesId: string
		variant?: WeaponSeriesVariant | null
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), seriesId, variant = null, onOpenChange }: Props = $props()

	const isEditing = $derived(!!variant)
	const title = $derived(isEditing ? 'Edit Variant' : 'Add Variant')

	// Form fields
	let name = $state('')
	let hasWeaponKeys = $state(false)
	let hasAwakening = $state(false)
	let numWeaponKeysValue = $state<number>(0)
	let augmentType = $state(false)
	let augmentTypeValue = $state<AugmentType>('ax')
	let elementChangeable = $state(false)
	let extra = $state(false)

	// Mutations
	const createMut = useCreateWeaponSeriesVariant()
	const updateMut = useUpdateWeaponSeriesVariant()
	const deleteMut = useDeleteWeaponSeriesVariant()

	const isSaving = $derived(createMut.isPending || updateMut.isPending)
	const isDeleting = $derived(deleteMut.isPending)

	const augmentTypeOptions = getAugmentTypeOptions().filter((opt) => opt.value !== 'no_augment')

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			if (variant) {
				name = variant.name || ''
				hasWeaponKeys = variant.hasWeaponKeys !== null
				hasAwakening = variant.hasAwakening !== null
				elementChangeable = variant.elementChangeable !== null
				extra = variant.extra !== null

				numWeaponKeysValue = variant.numWeaponKeys ?? 0

				if (variant.augmentType !== null && variant.augmentType !== 'no_augment') {
					augmentType = true
					augmentTypeValue = variant.augmentType
				} else {
					augmentType = false
					augmentTypeValue = 'ax'
				}
			} else {
				name = ''
				hasWeaponKeys = false
				hasAwakening = false
				numWeaponKeysValue = 0
				augmentType = false
				augmentTypeValue = 'ax'
				elementChangeable = false
				extra = false
			}
		}
	})

	function buildPayload() {
		return {
			name,
			has_weapon_keys: hasWeaponKeys ? true : null,
			has_awakening: hasAwakening ? true : null,
			num_weapon_keys: hasWeaponKeys ? numWeaponKeysValue : null,
			augment_type: augmentType ? augmentTypeValue : null,
			element_changeable: elementChangeable ? true : null,
			extra: extra ? true : null
		}
	}

	const canSave = $derived(name.trim().length > 0)

	async function handleSave() {
		if (!canSave) {
			toast.error('Variant name is required')
			return
		}

		try {
			const payload = buildPayload()

			if (isEditing && variant) {
				await updateMut.mutateAsync({ seriesId, variantId: variant.id, payload })
			} else {
				await createMut.mutateAsync({ seriesId, payload })
			}

			toast.success(isEditing ? 'Variant updated' : 'Variant created')
			open = false
			onOpenChange?.(false)
		} catch (error) {
			toast.error(extractErrorMessage(error, 'Failed to save variant'))
		}
	}

	// Delete confirmation
	let confirmDeleteOpen = $state(false)

	function handleDeleteClick() {
		confirmDeleteOpen = true
	}

	async function handleConfirmDelete() {
		if (!variant) return
		try {
			await deleteMut.mutateAsync({ seriesId, variantId: variant.id })
			toast.success('Variant deleted')
			confirmDeleteOpen = false
			open = false
			onOpenChange?.(false)
		} catch (error) {
			toast.error(extractErrorMessage(error, 'Failed to delete variant'))
		}
	}
</script>

<Dialog bind:open {onOpenChange}>
	{#snippet children()}
		<ModalHeader {title} />
		<div class="modal-body">
			<DetailItem
				label="Name"
				bind:value={name}
				editable={true}
				type="text"
				placeholder="e.g. Revans, Ennead"
				width="240px"
			/>
			<h4 class="section-header">Overrides</h4>
			<DetailItem
				label="Has Weapon Keys"
				value={hasWeaponKeys}
				editable={true}
				type="checkbox"
				onchange={(checked) => (hasWeaponKeys = checked)}
			/>
			{#if hasWeaponKeys}
				<DetailItem
					label="Num Weapon Keys"
					bind:value={numWeaponKeysValue}
					editable={true}
					type="number"
					placeholder="0"
				/>
			{/if}
			<DetailItem
				label="Has Awakening"
				value={hasAwakening}
				editable={true}
				type="checkbox"
				onchange={(checked) => (hasAwakening = checked)}
			/>
			<DetailItem
				label="Augment Type"
				value={augmentType}
				editable={true}
				type="checkbox"
				onchange={(checked) => (augmentType = checked)}
			/>
			{#if augmentType}
				<DetailItem
					label="Augment"
					bind:value={augmentTypeValue}
					editable={true}
					type="select"
					options={augmentTypeOptions}
				/>
			{/if}
			<DetailItem
				label="Element Changeable"
				value={elementChangeable}
				editable={true}
				type="checkbox"
				onchange={(checked) => (elementChangeable = checked)}
			/>
			<DetailItem
				label="Extra Grid"
				value={extra}
				editable={true}
				type="checkbox"
				onchange={(checked) => (extra = checked)}
			/>
		</div>
		<ModalFooter
			onCancel={() => (open = false)}
			primaryAction={{
				label: isSaving ? 'Saving...' : isEditing ? 'Save' : 'Create',
				onclick: handleSave,
				disabled: isSaving || isDeleting || !canSave
			}}
		>
			{#snippet left()}
				{#if isEditing}
					<Button
						variant="destructive-ghost"
						size="small"
						onclick={handleDeleteClick}
						disabled={isDeleting || isSaving}
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				{/if}
			{/snippet}
		</ModalFooter>

		<!-- Nested delete confirmation dialog -->
		<DialogPrimitive.Root bind:open={confirmDeleteOpen}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay class="dialog-overlay" />
				<DialogPrimitive.Content class="dialog-content confirm-dialog">
					<div class="confirm-body">
						<p>Are you sure you want to delete this variant? Weapons assigned to it will lose their variant override.</p>
					</div>
					<ModalFooter
						onCancel={() => (confirmDeleteOpen = false)}
						primaryAction={{
							label: isDeleting ? 'Deleting...' : 'Delete',
							onclick: handleConfirmDelete,
							destructive: true,
							disabled: isDeleting
						}}
					/>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section-header {
		margin: 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-secondary);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		padding-top: 0;
		max-height: 60vh;
		overflow-y: auto;
	}

	:global(.confirm-dialog) {
		width: 380px;
	}

	.confirm-body {
		padding: spacing.$unit-2x;

		p {
			margin: 0;
			font-size: typography.$font-body;
			color: var(--text-primary);
		}
	}
</style>
