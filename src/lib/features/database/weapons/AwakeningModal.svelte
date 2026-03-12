<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { Awakening } from '$lib/types/api/entities'
	import {
		useCreateAwakening,
		useUpdateAwakening,
		useDeleteAwakening,
		useUploadAwakeningImage
	} from '$lib/api/mutations/awakening.mutations'
	import { getBasePath } from '$lib/utils/images'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		open?: boolean
		awakening?: Awakening | null
		objectType?: string
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), awakening = null, objectType = 'Weapon', onOpenChange }: Props = $props()

	const isEditing = $derived(!!awakening)
	const title = $derived(isEditing ? 'Edit Awakening' : 'Add Awakening')

	// Form state
	let nameEn = $state('')
	let nameJp = $state('')
	let slug = $state('')
	let order = $state<number>(0)

	// Image upload state
	let imageFile = $state<File | null>(null)
	let imagePreview = $state<string | null>(null)
	let fileInputEl = $state<HTMLInputElement>()

	// Mutations
	const createMut = useCreateAwakening()
	const updateMut = useUpdateAwakening()
	const deleteMut = useDeleteAwakening()
	const uploadImageMut = useUploadAwakeningImage()

	const isSaving = $derived(createMut.isPending || updateMut.isPending)
	const isDeleting = $derived(deleteMut.isPending)

	// Reset form when awakening changes or modal opens
	$effect(() => {
		if (open) {
			if (awakening) {
				nameEn = awakening.name.en || ''
				nameJp = awakening.name.ja || ''
				slug = awakening.slug || ''
				order = awakening.order ?? 0
			} else {
				nameEn = ''
				nameJp = ''
				slug = ''
				order = 0
			}
			imageFile = null
			imagePreview = null
		}
	})

	// Existing image URL
	const existingImageUrl = $derived.by(() => {
		if (!awakening?.slug) return null
		const ext = awakening.slug.startsWith('character-') ? 'jpg' : 'png'
		return `${getBasePath()}/awakening/${awakening.slug}.${ext}`
	})

	function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return
		imageFile = file
		const reader = new FileReader()
		reader.onload = () => {
			imagePreview = reader.result as string
		}
		reader.readAsDataURL(file)
	}

	async function handleSave() {
		if (!nameEn || !slug) {
			toast.error('Name and slug are required')
			return
		}

		try {
			let savedAwakening: Awakening

			if (isEditing && awakening) {
				savedAwakening = await updateMut.mutateAsync({
					id: awakening.id,
					payload: {
						name_en: nameEn,
						name_jp: nameJp || undefined,
						slug,
						object_type: objectType,
						order
					}
				})
			} else {
				savedAwakening = await createMut.mutateAsync({
					name_en: nameEn,
					name_jp: nameJp || undefined,
					slug,
					object_type: objectType,
					order
				})
			}

			// Upload image if one was selected
			if (imageFile && savedAwakening) {
				const reader = new FileReader()
				const dataUrl = await new Promise<string>((resolve) => {
					reader.onload = () => resolve(reader.result as string)
					reader.readAsDataURL(imageFile!)
				})
				// Strip data URL prefix, send only base64 payload
				const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
				await uploadImageMut.mutateAsync({
					id: savedAwakening.id,
					imageData: base64,
					filename: imageFile.name
				})
			}

			toast.success(isEditing ? 'Awakening updated' : 'Awakening created')
			open = false
			onOpenChange?.(false)
		} catch (error) {
			toast.error(extractErrorMessage(error, 'Failed to save awakening'))
		}
	}

	// Delete confirmation
	let confirmDeleteOpen = $state(false)

	function handleDeleteClick() {
		confirmDeleteOpen = true
	}

	async function handleConfirmDelete() {
		if (!awakening) return
		try {
			await deleteMut.mutateAsync(awakening.id)
			toast.success('Awakening deleted')
			confirmDeleteOpen = false
			open = false
			onOpenChange?.(false)
		} catch (error) {
			toast.error(extractErrorMessage(error, 'Failed to delete awakening'))
		}
	}
</script>

<Dialog bind:open {onOpenChange}>
	{#snippet children()}
		<ModalHeader {title} />
		<div class="modal-body">
			<div class="form-grid">
				<Input
					label="Name (EN)"
					bind:value={nameEn}
					placeholder="e.g. Attack"
					fullWidth
					contained
				/>

				<Input
					label="Name (JP)"
					bind:value={nameJp}
					placeholder="e.g. 攻撃"
					fullWidth
					contained
				/>

				<Input
					label="Slug"
					bind:value={slug}
					placeholder="e.g. weapon-attack"
					fullWidth
					contained
				/>

				<Input
					label="Order"
					type="number"
					bind:value={order}
					contained
					fullWidth
				/>

				<div class="field">
					<span class="label">Image</span>
					<div class="image-upload">
						{#if imagePreview}
							<img src={imagePreview} alt="Preview" class="image-preview" />
						{:else if existingImageUrl}
							<img src={existingImageUrl} alt={nameEn} class="image-preview" />
						{/if}
						<Button variant="ghost" size="small" onclick={() => fileInputEl?.click()}>
							{existingImageUrl || imagePreview ? 'Change Image' : 'Upload Image'}
						</Button>
						<input
							bind:this={fileInputEl}
							type="file"
							accept="image/png,image/jpeg"
							onchange={handleImageSelect}
							hidden
						/>
					</div>
				</div>
			</div>
		</div>
		<ModalFooter
			onCancel={() => (open = false)}
			primaryAction={{
				label: isSaving ? 'Saving...' : isEditing ? 'Save' : 'Create',
				onclick: handleSave,
				disabled: isSaving || isDeleting || !nameEn || !slug
			}}
		>
			{#snippet left()}
				{#if isEditing}
					<Button
						variant="destructive-ghost"
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
						<p>Are you sure you want to delete this awakening? This action cannot be undone.</p>
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
	@use '$src/themes/layout' as layout;

	.modal-body {
		padding: spacing.$unit-2x;
		padding-top: 0;
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

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.label {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.image-upload {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.image-preview {
		width: 40px;
		height: 40px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-color, #eee);
	}
</style>
