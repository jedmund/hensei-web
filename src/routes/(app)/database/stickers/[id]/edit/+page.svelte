<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import StickerFormFields from '$lib/components/database/StickerFormFields.svelte'
	import {
		uploadImages,
		useDeleteSticker,
		useUpdateSticker,
		useUploadStickerImage
	} from '$lib/api/mutations/sticker-catalogue.mutations'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'

	import type { StickerImageLanguage } from '$lib/types/api/sticker'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const sticker = $derived(data.sticker)

	const updateMut = useUpdateSticker()
	const uploadMut = useUploadStickerImage()
	const deleteMut = useDeleteSticker()

	// Writable: the form edits it, and it resets if the sticker changes
	let values = $derived({
		slug: sticker.slug,
		meaningEn: sticker.meaning.en ?? '',
		meaningJp: sticker.meaning.ja ?? '',
		active: sticker.active
	})

	// Chosen images, uploaded on save
	let imageFiles = $state<Partial<Record<StickerImageLanguage, File>>>({})
	let saveError = $state<string | null>(null)
	let confirmDeleteOpen = $state(false)

	const canSave = $derived(values.meaningEn.trim() !== '' && values.meaningJp.trim() !== '')

	const saveAction = useAsyncAction(
		async () => {
			saveError = null
			await updateMut.mutateAsync({
				id: sticker.id,
				payload: {
					meaningEn: values.meaningEn.trim(),
					meaningJp: values.meaningJp.trim(),
					active: values.active
				}
			})
			await uploadImages(uploadMut, sticker.id, imageFiles)
			goto(localizeHref('/database/stickers'))
		},
		m.db_stickers_save_failed(),
		{ onError: (_, message) => (saveError = message) }
	)

	// A sticker someone has given can't be deleted; the API's 422 message
	// lands in the error banner. Deactivating is the way to retire it.
	const deleteAction = useAsyncAction(
		async () => {
			await deleteMut.mutateAsync({ id: sticker.id })
			goto(localizeHref('/database/stickers'))
		},
		m.db_stickers_delete_failed(),
		{ onError: (_, message) => (saveError = message) }
	)

	async function handleConfirmDelete() {
		try {
			await deleteAction.run()
		} finally {
			confirmDeleteOpen = false
		}
	}
</script>

<PageMeta title={m.page_title_db_edit({ name: sticker.slug })} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title={m.db_stickers_edit_title()}
		onCancel={() => goto(localizeHref('/database/stickers'))}
		onSave={saveAction.run}
		isSaving={saveAction.busy}
		disabled={!canSave}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<StickerFormFields
			bind:values
			imageUrl={sticker.imageUrl}
			imageUrlJa={sticker.imageUrlJa}
			slugLocked
			onSelectImage={(file, language) => (imageFiles[language] = file)}
		/>

		<div class="delete-row">
			<p class="hint">{m.db_stickers_delete_hint()}</p>
			<Button variant="destructive" size="small" onclick={() => (confirmDeleteOpen = true)}>
				{m.db_stickers_delete()}
			</Button>
		</div>
	</section>

	<Dialog bind:open={confirmDeleteOpen} size="small">
		<ModalHeader title={m.db_stickers_delete_confirm_title()} />
		<ModalBody>
			<p>{m.db_stickers_delete_confirm({ slug: sticker.slug })}</p>
		</ModalBody>
		<ModalFooter
			onCancel={() => (confirmDeleteOpen = false)}
			primaryAction={{
				label: m.db_stickers_delete(),
				onclick: handleConfirmDelete,
				destructive: true
			}}
		/>
	</Dialog>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}

	.delete-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
